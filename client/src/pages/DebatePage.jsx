import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { socket } from '../socket'
import useAppStore from '../store/appStore'

const PHASES = [
  { id: 'text', label: 'טקסט', icon: '💬' },
  { id: 'voice', label: 'קול', icon: '🎙️' },
  { id: 'live', label: 'שידור', icon: '📡' }
]

const GIFTS = [
  { emoji: '🌹', label: 'ורד' },
  { emoji: '👑', label: 'כתר' },
  { emoji: '💎', label: 'יהלום' },
  { emoji: '🔥', label: 'אש' },
  { emoji: '⭐', label: 'כוכב' }
]

const MAX_MESSAGES_PER_SIDE = 5

export default function DebatePage() {
  const navigate = useNavigate()
  const { user, currentDebate, setCurrentDebate } = useAppStore()

  const [phase, setPhase] = useState('text')
  const [myMessages, setMyMessages] = useState([])
  const [opponentMessages, setOpponentMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isMyTurn, setIsMyTurn] = useState(true)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [giftAnimations, setGiftAnimations] = useState([])
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [debateEnded, setDebateEnded] = useState(false)
  const [results, setResults] = useState(null)
  const [streamingText, setStreamingText] = useState('')

  // Voice phase state
  const [isRecording, setIsRecording] = useState(false)
  const [opponentAudioUrl, setOpponentAudioUrl] = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const messagesEndRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [myMessages, opponentMessages, scrollToBottom])

  useEffect(() => {
    if (!socket.connected) {
      socket.auth = { token: user?.token }
      socket.connect()
    }

    socket.on('debate_state', (state) => {
      setPhase(state.phase || 'text')
      setMyMessages(state.myMessages || [])
      setOpponentMessages(state.opponentMessages || [])
      setIsMyTurn(state.isMyTurn ?? true)
      setSpectatorCount(state.spectatorCount || 0)
      setCurrentDebate(state)
    })

    socket.on('new_message', ({ from, text, isStreaming }) => {
      if (isStreaming) {
        setStreamingText((prev) => prev + text)
        return
      }
      if (from === 'me') {
        setMyMessages((prev) => [...prev, { text, timestamp: Date.now() }])
        setIsMyTurn(false)
      } else {
        if (streamingText) {
          setOpponentMessages((prev) => [...prev, { text: streamingText, timestamp: Date.now() }])
          setStreamingText('')
        } else {
          setOpponentMessages((prev) => [...prev, { text, timestamp: Date.now() }])
        }
        setIsMyTurn(true)
      }
    })

    socket.on('stream_chunk', ({ chunk }) => {
      setStreamingText((prev) => prev + chunk)
    })

    socket.on('stream_end', ({ fullText }) => {
      setOpponentMessages((prev) => [...prev, { text: fullText, timestamp: Date.now() }])
      setStreamingText('')
      setIsMyTurn(true)
    })

    socket.on('voice_message', ({ audioData, mimeType }) => {
      const blob = new Blob([audioData], { type: mimeType || 'audio/webm' })
      const url = URL.createObjectURL(blob)
      setOpponentAudioUrl(url)
      const audio = new Audio(url)
      audio.play().catch(() => {})
    })

    socket.on('gift_received', ({ emoji, from }) => {
      const id = Date.now()
      setGiftAnimations((prev) => [...prev, { id, emoji, from }])
      setTimeout(() => {
        setGiftAnimations((prev) => prev.filter((g) => g.id !== id))
      }, 3000)
    })

    socket.on('phase_change', ({ phase: newPhase }) => {
      setPhase(newPhase)
    })

    socket.on('spectator_count', ({ count }) => {
      setSpectatorCount(count)
    })

    socket.on('debate_ended', ({ results: debateResults }) => {
      setResults(debateResults)
      setDebateEnded(true)
      setTimeout(() => {
        navigate('/lobby')
      }, 5000)
    })

    return () => {
      socket.off('debate_state')
      socket.off('new_message')
      socket.off('stream_chunk')
      socket.off('stream_end')
      socket.off('voice_message')
      socket.off('gift_received')
      socket.off('phase_change')
      socket.off('spectator_count')
      socket.off('debate_ended')
    }
  }, [navigate, setCurrentDebate, user, streamingText])

  const sendMessage = useCallback(() => {
    const text = inputText.trim()
    if (!text || !isMyTurn || phase !== 'text') return

    const totalMyMessages = myMessages.length + 1
    socket.emit('send_message', { text })
    setMyMessages((prev) => [...prev, { text, timestamp: Date.now() }])
    setInputText('')
    setIsMyTurn(false)

    if (totalMyMessages >= MAX_MESSAGES_PER_SIDE && opponentMessages.length >= MAX_MESSAGES_PER_SIDE) {
      setTimeout(() => {
        socket.emit('advance_phase')
      }, 1000)
    }
  }, [inputText, isMyTurn, phase, myMessages.length, opponentMessages.length])

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage]
  )

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          socket.emit('send_voice', { audioData: reader.result, mimeType: 'audio/webm' })
        }
        reader.readAsArrayBuffer(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const sendGift = useCallback((emoji) => {
    socket.emit('send_gift', { emoji })
  }, [])

  const endDebate = useCallback(() => {
    socket.emit('end_debate')
    setShowEndConfirm(false)
  }, [])

  const currentPhaseIndex = PHASES.findIndex((p) => p.id === phase)

  if (debateEnded) {
    return (
      <div style={styles.endScreen}>
        <div style={styles.endCard}>
          <div style={styles.endTitle}>הדיון הסתיים</div>
          {results && (
            <div style={styles.resultsContainer}>
              <div style={styles.resultItem}>
                <span style={styles.resultLabel}>ניצח:</span>
                <span style={styles.resultValue}>{results.winner || 'תיקו'}</span>
              </div>
              {results.score && (
                <div style={styles.resultItem}>
                  <span style={styles.resultLabel}>ניקוד:</span>
                  <span style={styles.resultValue}>{results.score}</span>
                </div>
              )}
            </div>
          )}
          <div style={styles.redirectNotice}>חוזר ללובי...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container} dir="rtl">
      {/* Phase indicator bar */}
      <div style={styles.phaseBar}>
        {PHASES.map((p, idx) => (
          <div
            key={p.id}
            style={{
              ...styles.phaseStep,
              ...(idx === currentPhaseIndex ? styles.phaseStepActive : {}),
              ...(idx < currentPhaseIndex ? styles.phaseStepDone : {})
            }}
          >
            <span style={styles.phaseIcon}>{p.icon}</span>
            <span style={styles.phaseLabel}>{p.label}</span>
            {idx < PHASES.length - 1 && (
              <div
                style={{
                  ...styles.phaseConnector,
                  ...(idx < currentPhaseIndex ? styles.phaseConnectorDone : {})
                }}
              />
            )}
          </div>
        ))}

        {/* Spectator badge */}
        <div style={styles.spectatorBadge}>
          👁️ {spectatorCount}
        </div>
      </div>

      {/* Turn indicator */}
      <div style={{ ...styles.turnIndicator, ...(isMyTurn ? styles.myTurnIndicator : styles.waitingIndicator) }}>
        {isMyTurn ? '🟢 התור שלך' : '⏳ ממתין ליריב...'}
      </div>

      {/* Gift animations overlay */}
      <div style={styles.giftOverlay}>
        {giftAnimations.map((g) => (
          <div key={g.id} style={styles.giftAnimation}>
            {g.emoji}
          </div>
        ))}
      </div>

      {/* Messages area */}
      <div style={styles.messagesArea}>
        {/* Left side — my messages */}
        <div style={styles.messageColumn}>
          <div style={styles.columnHeader}>אני</div>
          <div style={styles.messageList}>
            {myMessages.map((msg, i) => (
              <div key={i} style={styles.myMessage}>
                <div style={styles.messageText}>{msg.text}</div>
                <div style={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side — opponent messages */}
        <div style={styles.messageColumn}>
          <div style={styles.columnHeader}>יריב</div>
          <div style={styles.messageList}>
            {opponentMessages.map((msg, i) => (
              <div key={i} style={styles.opponentMessage}>
                <div style={styles.messageText}>{msg.text}</div>
                <div style={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {streamingText && (
              <div style={{ ...styles.opponentMessage, ...styles.streamingMessage }}>
                <div style={styles.messageText}>{streamingText}<span style={styles.cursor}>|</span></div>
              </div>
            )}
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Gift bar */}
      <div style={styles.giftBar}>
        {GIFTS.map((g) => (
          <button key={g.emoji} style={styles.giftButton} onClick={() => sendGift(g.emoji)} title={g.label}>
            {g.emoji}
          </button>
        ))}
      </div>

      {/* Phase-specific controls */}
      {phase === 'text' && (
        <div style={styles.inputArea}>
          <textarea
            style={styles.textInput}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isMyTurn ? 'כתוב את טיעונך...' : 'ממתין ליריב...'}
            disabled={!isMyTurn}
            rows={3}
            dir="rtl"
          />
          <button
            style={{ ...styles.sendButton, ...(!isMyTurn || !inputText.trim() ? styles.sendButtonDisabled : {}) }}
            onClick={sendMessage}
            disabled={!isMyTurn || !inputText.trim()}
          >
            שלח
          </button>
        </div>
      )}

      {phase === 'voice' && (
        <div style={styles.voiceArea}>
          <button
            style={{ ...styles.recordButton, ...(isRecording ? styles.recordButtonActive : {}) }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
          >
            {isRecording ? '🔴 מקליט...' : '🎙️ לחץ להקלטה'}
          </button>
          {opponentAudioUrl && (
            <audio controls src={opponentAudioUrl} style={styles.audioPlayer}>
              הדפדפן שלך אינו תומך בשמע
            </audio>
          )}
        </div>
      )}

      {phase === 'live' && (
        <div style={styles.liveArea}>
          <div style={styles.liveBadge}>📡 שידור חי</div>
          <p style={styles.liveText}>הדיון מועבר בשידור חי לצופים</p>
        </div>
      )}

      {/* End debate button */}
      <button style={styles.endButton} onClick={() => setShowEndConfirm(true)}>
        סיים דיון
      </button>

      {/* Confirmation dialog */}
      {showEndConfirm && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <div style={styles.dialogTitle}>סיום דיון</div>
            <div style={styles.dialogText}>האם אתה בטוח שברצונך לסיים את הדיון?</div>
            <div style={styles.dialogActions}>
              <button style={styles.dialogConfirm} onClick={endDebate}>
                כן, סיים
              </button>
              <button style={styles.dialogCancel} onClick={() => setShowEndConfirm(false)}>
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    backgroundColor: '#0d0d0d',
    color: '#f0f0f0',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  phaseBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 16px',
    backgroundColor: '#1a1a2e',
    borderBottom: '1px solid #2a2a4a',
    position: 'relative'
  },
  phaseStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    opacity: 0.45,
    transition: 'opacity 0.3s'
  },
  phaseStepActive: {
    opacity: 1
  },
  phaseStepDone: {
    opacity: 0.7
  },
  phaseIcon: {
    fontSize: 20
  },
  phaseLabel: {
    fontSize: 11,
    color: '#aaa'
  },
  phaseConnector: {
    position: 'absolute',
    height: 2,
    width: 40,
    backgroundColor: '#333',
    top: '50%',
    right: -24
  },
  phaseConnectorDone: {
    backgroundColor: '#7c3aed'
  },
  spectatorBadge: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: '#1e1e3a',
    border: '1px solid #3a3a6a',
    borderRadius: 20,
    padding: '4px 10px',
    fontSize: 13,
    color: '#aaa'
  },
  turnIndicator: {
    textAlign: 'center',
    padding: '6px 12px',
    fontSize: 14,
    fontWeight: 600,
    transition: 'background-color 0.3s'
  },
  myTurnIndicator: {
    backgroundColor: '#0f2d0f',
    color: '#4ade80'
  },
  waitingIndicator: {
    backgroundColor: '#1a1a0f',
    color: '#facc15'
  },
  giftOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  giftAnimation: {
    fontSize: 72,
    animation: 'float 3s ease-in-out forwards',
    position: 'absolute',
    top: '30%'
  },
  messagesArea: {
    flex: 1,
    display: 'flex',
    gap: 8,
    padding: 12,
    overflow: 'hidden'
  },
  messageColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    overflow: 'hidden'
  },
  columnHeader: {
    textAlign: 'center',
    fontSize: 13,
    color: '#888',
    padding: '4px 0',
    borderBottom: '1px solid #222'
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingRight: 4
  },
  myMessage: {
    backgroundColor: '#1e3a5f',
    borderRadius: '12px 12px 4px 12px',
    padding: '8px 12px',
    alignSelf: 'flex-end',
    maxWidth: '90%'
  },
  opponentMessage: {
    backgroundColor: '#2a1a3e',
    borderRadius: '12px 12px 12px 4px',
    padding: '8px 12px',
    alignSelf: 'flex-start',
    maxWidth: '90%'
  },
  streamingMessage: {
    opacity: 0.85,
    borderLeft: '2px solid #7c3aed'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: 'break-word'
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'left'
  },
  cursor: {
    animation: 'blink 1s step-end infinite',
    color: '#7c3aed'
  },
  giftBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#111',
    borderTop: '1px solid #222'
  },
  giftButton: {
    fontSize: 22,
    background: 'none',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '4px 8px',
    cursor: 'pointer',
    transition: 'transform 0.15s, border-color 0.15s'
  },
  inputArea: {
    display: 'flex',
    gap: 8,
    padding: '10px 12px',
    backgroundColor: '#111',
    borderTop: '1px solid #222',
    alignItems: 'flex-end'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: 10,
    color: '#f0f0f0',
    fontSize: 14,
    padding: '10px 12px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    direction: 'rtl'
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  sendButtonDisabled: {
    backgroundColor: '#3a2a5e',
    cursor: 'not-allowed',
    opacity: 0.5
  },
  voiceArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '14px 12px',
    backgroundColor: '#111',
    borderTop: '1px solid #222'
  },
  recordButton: {
    backgroundColor: '#1e3a5f',
    color: '#f0f0f0',
    border: '2px solid #3a6aaf',
    borderRadius: 50,
    width: 90,
    height: 90,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    lineHeight: 1.3
  },
  recordButtonActive: {
    backgroundColor: '#5f1e1e',
    borderColor: '#af3a3a',
    transform: 'scale(1.1)'
  },
  audioPlayer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 8
  },
  liveArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '14px 12px',
    backgroundColor: '#111',
    borderTop: '1px solid #222'
  },
  liveBadge: {
    backgroundColor: '#7c1e1e',
    border: '1px solid #af3a3a',
    borderRadius: 20,
    padding: '6px 18px',
    fontSize: 15,
    fontWeight: 700,
    color: '#ff6b6b'
  },
  liveText: {
    color: '#888',
    fontSize: 13,
    margin: 0
  },
  endButton: {
    margin: '8px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #5a1e1e',
    borderRadius: 8,
    color: '#ef4444',
    fontSize: 14,
    padding: '8px 0',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  dialogOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200
  },
  dialog: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 16,
    padding: '24px 28px',
    width: 280,
    textAlign: 'center'
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10
  },
  dialogText: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20
  },
  dialogActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center'
  },
  dialogConfirm: {
    backgroundColor: '#7c1e1e',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 20px',
    cursor: 'pointer'
  },
  dialogCancel: {
    backgroundColor: '#2a2a4a',
    border: '1px solid #3a3a6a',
    borderRadius: 8,
    color: '#ccc',
    fontSize: 14,
    padding: '8px 20px',
    cursor: 'pointer'
  },
  endScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100dvh',
    backgroundColor: '#0d0d0d'
  },
  endCard: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #3a3a6a',
    borderRadius: 20,
    padding: '36px 40px',
    textAlign: 'center',
    minWidth: 280
  },
  endTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20
  },
  resultsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 16
  },
  resultLabel: {
    color: '#888'
  },
  resultValue: {
    fontWeight: 600,
    color: '#a78bfa'
  },
  redirectNotice: {
    color: '#555',
    fontSize: 13
  }
}
