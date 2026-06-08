import { useState, useRef, useEffect } from "react";
import { getApiBaseUrl } from "../lib/apiBaseUrl.js";
const API_BASE = getApiBaseUrl();

const CHARACTERS = [
  {
    id: "rabbi",
    emoji: "🧙",
    name: "הרב",
    description: "רב אורתודוקסי — תורה, הלכה, אמונה",
    voiceId: "voice_rabbi_placeholder",
    systemPrompt:
      "אתה רב אורתודוקסי חכם ונבון. עונה בעברית עם ציטוטים מהתנ״ך והתלמוד. סגנונך מכובד, חמים ומלמד.",
  },
  {
    id: "god",
    emoji: "👁️",
    name: "האל",
    description: "קול האל — מיסטי ואינסופי",
    voiceId: "voice_god_placeholder",
    systemPrompt:
      "אתה קול האל — מיסטי, אינסופי, רחמן. מדבר בעברית בשפה עתיקה ומרוממת. כל תשובה כוללת חכמה עמוקה ואהבה אינסופית.",
  },
  {
    id: "scientist",
    emoji: "🔬",
    name: "המדען",
    description: "מדען — שכל, עובדות, מחקר",
    voiceId: "voice_scientist_placeholder",
    systemPrompt:
      "אתה מדען רציונלי. עונה בעברית עם עובדות מדעיות, מחקרים ונתונים. סגנונך מדויק, ביקורתי ומושכל.",
  },
  {
    id: "death",
    emoji: "💀",
    name: "המוות",
    description: "דמות המוות — פילוסופי ועמוק",
    voiceId: "voice_death_placeholder",
    systemPrompt:
      "אתה המוות כדמות פילוסופית. מדבר בעברית בצורה שקטה, עמוקה ומחשבתית. מזכיר את הסופיות ואת ערך החיים.",
  },
  {
    id: "miriam",
    emoji: "🌹",
    name: "מרים",
    description: "מאמינה רכה — חסד, אהבה, תפילה",
    voiceId: "voice_miriam_placeholder",
    systemPrompt:
      "אתה מרים — אישה מאמינה עם לב חם ורחום. מדברת בעברית בסגנון עדין, מלא אהבה ואמונה. מעודדת ומחזקת.",
  },
  {
    id: "prophet",
    emoji: "🦅",
    name: "הנביא",
    description: "נביא — חזון, אזהרה, עתיד",
    voiceId: "voice_prophet_placeholder",
    systemPrompt:
      "אתה נביא בסגנון נביאי ישראל. מדבר בעברית בקול רם ועוצמתי, מביא חזונות ואזהרות. סגנונך דרמטי ומרשים.",
  },
  {
    id: "darwin",
    emoji: "🧪",
    name: "דרווין",
    description: "צ׳רלס דרווין — אבולוציה וטבע",
    voiceId: "voice_darwin_placeholder",
    systemPrompt:
      "אתה צ׳רלס דרווין. מדבר בעברית על אבולוציה, ברירה טבעית וחיי הטבע. סגנונך מדעי-היסטורי, סקרן ומדויק.",
  },
  {
    id: "nietzsche",
    emoji: "⚡",
    name: "ניטשה",
    description: "פרידריך ניטשה — כוח, רצון, אמת",
    voiceId: "voice_nietzsche_placeholder",
    systemPrompt:
      "אתה פרידריך ניטשה. מדבר בעברית בסגנון פילוסופי נועז ופרובוקטיבי. מאתגר, ישיר ואינטנסיבי.",
  },
  {
    id: "kook",
    emoji: "🕍",
    name: "הרב קוק",
    description: "הרב קוק — אמונה, ציונות, אור",
    voiceId: "voice_kook_placeholder",
    systemPrompt:
      "אתה הרב אברהם יצחק הכהן קוק. מדבר בעברית בסגנון פיוטי ורוחני, מחבר בין אמונה לציונות. עמוק, שירי ומרומם.",
  },
  {
    id: "spirit",
    emoji: "🌙",
    name: "הרוח",
    description: "ישות רוחנית — סוד, אנרגיה, עולמות",
    voiceId: "voice_spirit_placeholder",
    systemPrompt:
      "אתה ישות רוחנית מעולמות עליונים. מדברת בעברית בסגנון מסתורי ועדין. מדברת על אנרגיות, נשמות וקשרים רוחניים.",
  },
];

// micStatus: 'unknown' | 'checking' | 'granted' | 'prompt' | 'denied'
export default function AiVoicePage() {
  const [selectedChar, setSelectedChar] = useState(null);
  const [inputText, setInputText] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [micStatus, setMicStatus] = useState("unknown");
  const [micError, setMicError] = useState(null);
  const audioRef = useRef(null);
  const historyEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicPermission();
  }, []);

  async function checkMicPermission() {
    setMicStatus("checking");
    setMicError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus("denied");
      setMicError("הדפדפן שלך אינו תומך בגישה למיקרופון. נסה Chrome או Firefox עדכני.");
      return;
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "microphone" });

        if (result.state === "denied") {
          setMicStatus("denied");
          setMicError(
            "יש להעניק גישה למיקרופון בהגדרות הדפדפן כדי להשתמש בסימולטור הקולי"
          );
        } else if (result.state === "prompt") {
          setMicStatus("prompt");
          setMicError(null);
        } else if (result.state === "granted") {
          setMicStatus("granted");
          setMicError(null);
        }

        // Listen for permission changes
        result.onchange = () => {
          if (result.state === "granted") {
            setMicStatus("granted");
            setMicError(null);
          } else if (result.state === "denied") {
            setMicStatus("denied");
            setMicError(
              "יש להעניק גישה למיקרופון בהגדרות הדפדפן כדי להשתמש בסימולטור הקולי"
            );
          }
        };
      } else {
        // Fallback: try to access mic directly
        await requestMicAccess();
      }
    } catch (e) {
      // permissions.query not supported — try direct access
      await requestMicAccess();
    }
  }

  async function requestMicAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop all tracks immediately — we just needed to check permission
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus("granted");
      setMicError(null);
    } catch (e) {
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setMicStatus("denied");
        setMicError(
          "יש להעניק גישה למיקרופון בהגדרות הדפדפן כדי להשתמש בסימולטור הקולי"
        );
      } else if (e.name === "NotFoundError") {
        setMicStatus("denied");
        setMicError("לא נמצא מיקרופון במכשיר. אנא חבר מיקרופון ונסה שנית.");
      } else if (e.name === "NotReadableError") {
        setMicStatus("denied");
        setMicError("המיקרופון בשימוש על ידי תוכנה אחרת. סגור אותה ונסה שנית.");
      } else {
        setMicStatus("denied");
        setMicError("שגיאה בגישה למיקרופון: " + (e.message || e.name));
      }
    }
  }

  async function handleRequestMicPermission() {
    setMicError(null);
    await requestMicAccess();
  }

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl]);

  async function handleSend() {
    if (!selectedChar) {
      setError("בחר דמות תחילה");
      return;
    }
    const text = inputText.trim();
    if (!text) return;

    // Check mic permission before sending
    if (micStatus === "denied") {
      setError(
        "יש להעניק גישה למיקרופון בהגדרות הדפדפן כדי להשתמש בסימולטור הקולי"
      );
      return;
    }

    if (micStatus === "prompt") {
      // Try to request permission now
      await requestMicAccess();
      if (micStatus === "denied") return;
    }

    setLoading(true);
    setError(null);

    const userMsg = { role: "user", text, charId: selectedChar.id };
    const newHistory = [...history, userMsg].slice(-10);
    setHistory(newHistory);
    setInputText("");

    try {
      const res = await fetch(`${API_BASE}/api/voice-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: selectedChar.voiceId,
          character: selectedChar.id,
          systemPrompt: selectedChar.systemPrompt,
          history: newHistory
            .filter((m) => m.role === "user")
            .map((m) => m.text),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `שגיאת שרת ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(url);

        setHistory((prev) =>
          [...prev, { role: "assistant", text: "🔊 הושמע קול", charId: selectedChar.id }].slice(-10)
        );
      } else {
        const data = await res.json();
        const replyText = data.text || data.reply || "תגובה התקבלה";

        if (data.audioUrl) {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setAudioUrl(data.audioUrl);
        }

        setHistory((prev) =>
          [...prev, { role: "assistant", text: replyText, charId: selectedChar.id }].slice(-10)
        );
      }
    } catch (e) {
      if (
        e.name === "NotAllowedError" ||
        e.name === "PermissionDeniedError" ||
        (e.message && e.message.includes("Permission"))
      ) {
        setError("יש להעניק גישה למיקרופון בהגדרות הדפדפן כדי להשתמש בסימולטור הקולי");
        setMicStatus("denied");
      } else if (e.name === "NotFoundError") {
        setError("לא נמצא מיקרופון. אנא חבר מיקרופון ונסה שנית.");
      } else if (e.name === "NotReadableError") {
        setError("המיקרופון בשימוש על ידי תוכנה אחרת. סגור אותה ונסה שנית.");
      } else {
        setError(e.message || "שגיאה לא ידועה");
      }
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSelectChar(char) {
    setSelectedChar(char);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function getMicIndicator() {
    if (micStatus === "granted") {
      return { icon: "🎤", color: "#4ade80", label: "מיקרופון פעיל" };
    }
    if (micStatus === "denied") {
      return { icon: "🎤", color: "#f87171", label: "מיקרופון חסום" };
    }
    if (micStatus === "checking") {
      return { icon: "🎤", color: "#fbbf24", label: "בודק הרשאה..." };
    }
    if (micStatus === "prompt") {
      return { icon: "🎤", color: "#fbbf24", label: "נדרשת הרשאה" };
    }
    return { icon: "🎤", color: "#94a3b8", label: "סטטוס מיקרופון לא ידוע" };
  }

  const micIndicator = getMicIndicator();

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎙️ שיחת קול עם AI</h1>
      <p style={styles.subtitle}>בחר דמות ושוחח בקול</p>

      {/* Microphone Status Indicator */}
      <div style={styles.micStatusRow}>
        <span style={{ ...styles.micIcon, color: micIndicator.color }}>
          {micIndicator.icon}
        </span>
        <span style={{ ...styles.micLabel, color: micIndicator.color }}>
          {micIndicator.label}
        </span>
        {(micStatus === "prompt" || micStatus === "unknown") && (
          <button
            onClick={handleRequestMicPermission}
            style={styles.micRequestBtn}
          >
            אפשר גישה
          </button>
        )}
        {micStatus === "denied" && (
          <button
            onClick={checkMicPermission}
            style={styles.micRequestBtn}
          >
            בדוק שנית
          </button>
        )}
      </div>

      {/* Microphone Error / Instructions */}
      {micError && (
        <div style={styles.micErrorBox}>
          <span style={styles.micErrorIcon}>🚫</span>
          <div style={styles.micErrorContent}>
            <div style={styles.micErrorText}>{micError}</div>
            {micStatus === "denied" && (
              <div style={styles.micInstructions}>
                <strong>כיצד לאפשר גישה:</strong>
                <ul style={styles.micInstructionsList}>
                  <li>Chrome: לחץ על סמל המנעול/מיקרופון בשורת הכתובת ← הגדרות אתר ← מיקרופון ← אפשר</li>
                  <li>Firefox: לחץ על סמל המיקרופון ליד שורת הכתובת ← הסר חסימה</li>
                  <li>Safari: העדפות ← אתרים ← מיקרופון ← אפשר לאתר זה</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Character Grid */}
      <div style={styles.grid}>
        {CHARACTERS.map((char) => (
          <button
            key={char.id}
            onClick={() => handleSelectChar(char)}
            style={{
              ...styles.charCard,
              ...(selectedChar?.id === char.id ? styles.charCardActive : {}),
            }}
            title={char.description}
          >
            <span style={styles.charEmoji}>{char.emoji}</span>
            <span style={styles.charName}>{char.name}</span>
            <span style={styles.charDesc}>{char.description}</span>
          </button>
        ))}
      </div>

      {/* Selected character banner */}
      {selectedChar && (
        <div style={styles.selectedBanner}>
          <span style={{ fontSize: 22 }}>{selectedChar.emoji}</span>
          <span style={styles.selectedName}>{selectedChar.name}</span>
          <span style={styles.selectedDesc}>{selectedChar.description}</span>
        </div>
      )}

      {/* Conversation History */}
      {history.length > 0 && (
        <div style={styles.historyBox}>
          {history.map((msg, i) => {
            const char = CHARACTERS.find((c) => c.id === msg.charId);
            return (
              <div
                key={i}
                style={{
                  ...styles.msgRow,
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    ...styles.msgBubble,
                    ...(msg.role === "user" ? styles.msgUser : styles.msgAssistant),
                  }}
                >
                  {msg.role === "assistant" && char && (
                    <span style={styles.msgEmoji}>{char.emoji}</span>
                  )}
                  <span style={styles.msgText}>{msg.text}</span>
                </div>
              </div>
            );
          })}
          <div ref={historyEndRef} />
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div style={styles.audioBox}>
          <audio ref={audioRef} controls style={styles.audio} src={audioUrl}>
            הדפדפן שלך לא תומך בהשמעת שמע
          </audio>
        </div>
      )}

      {/* Error */}
      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      {/* Input Area */}
      <div style={styles.inputArea}>
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            selectedChar
              ? `שאל את ${selectedChar.name}...`
              : "בחר דמות תחילה..."
          }
          disabled={loading || !selectedChar}
          style={styles.textarea}
          rows={3}
          dir="rtl"
        />
        <button
          onClick={handleSend}
          disabled={loading || !selectedChar || !inputText.trim()}
          style={{
            ...styles.sendBtn,
            ...(loading || !selectedChar || !inputText.trim()
              ? styles.sendBtnDisabled
              : {}),
          }}
        >
          {loading ? (
            <span style={styles.pulse}>⏳ שולח...</span>
          ) : (
            "שלח 🎤"
          )}
        </button>
      </div>

      {/* Loading pulse overlay */}
      {loading && (
        <div style={styles.loadingBar}>
          <div style={styles.loadingDot} />
          <div style={{ ...styles.loadingDot, animationDelay: "0.2s" }} />
          <div style={{ ...styles.loadingDot, animationDelay: "0.4s" }} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .char-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(139,92,246,0.4);
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1025 50%, #0f0f1a 100%)",
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    direction: "rtl",
    padding: "20px 16px 40px",
    maxWidth: 700,
    margin: "0 auto",
    boxSizing: "border-box",
  },
  title: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: 700,
    color: "#c4b5fd",
    margin: "0 0 6px",
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    margin: "0 0 16px",
  },
  micStatusRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    justifyContent: "flex-end",
    direction: "rtl",
  },
  micIcon: {
    fontSize: 18,
    lineHeight: 1,
  },
  micLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  micRequestBtn: {
    background: "rgba(139,92,246,0.25)",
    border: "1px solid rgba(139,92,246,0.5)",
    color: "#c4b5fd",
    borderRadius: 8,
    padding: "4px 12px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    direction: "rtl",
  },
  micErrorBox: {
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 14,
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    direction: "rtl",
    animation: "fadeIn 0.3s ease",
  },
  micErrorIcon: {
    fontSize: 20,
    flexShrink: 0,
    marginTop: 2,
  },
  micErrorContent: {
    flex: 1,
  },
  micErrorText: {
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  micInstructions: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 1.5,
  },
  micInstructionsList: {
    margin: "6px 0 0 0",
    paddingRight: 18,
    paddingLeft: 0,
    listStyleType: "disc",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.7,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10,
    marginBottom: 20,
  },
  charCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(139,92,246,0.2)",
    borderRadius: 14,
    padding: "12px 8px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    transition: "all 0.2s ease",
    color: "#e2e8f0",
    textAlign: "center",
  },
  charCardActive: {
    background: "rgba(139,92,246,0.25)",
    border: "2px solid #8b5cf6",
    boxShadow: "0 0 20px rgba(139,92,246,0.4)",
  },
  charEmoji: {
    fontSize: 28,
    lineHeight: 1,
  },
  charName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#c4b5fd",
  },
  charDesc: {
    fontSize: 10,
    color: "#94a3b8",
    lineHeight: 1.3,
  },
  selectedBanner: {
    background: "rgba(139,92,246,0.15)",
    border: "1px solid rgba(139,92,246,0.4)",
    borderRadius: 12,
    padding: "10px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
    animation: "fadeIn 0.3s ease",
  },
  selectedName: {
    fontWeight: 700,
    color: "#c4b5fd",
    fontSize: 16,
  },
  selectedDesc: {
    color: "#94a3b8",
    fontSize: 13,
  },
  historyBox: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    maxHeight: 320,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    animation: "fadeIn 0.25s ease",
  },
  msgBubble: {
    maxWidth: "78%",
    padding: "9px 14px",
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.5,
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    wordBreak: "break-word",
  },
  msgUser: {
    background: "rgba(139,92,246,0.3)",
    border: "1px solid rgba(139,92,246,0.4)",
    borderRadius: "14px 4px 14px 14px",
  },
  msgAssistant: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px 14px 14px 14px",
  },
  msgEmoji: {
    fontSize: 16,
    flexShrink: 0,
  },
  msgText: {
    direction: "rtl",
  },
  audioBox: {
    marginBottom: 16,
    display: "flex",
    justifyContent: "center",
  },
  audio: {
    width: "100%",
    borderRadius: 10,
    outline: "none",
    accentColor: "#8b5cf6",
  },
  errorBox: {
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.4)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fca5a5",
    fontSize: 14,
    marginBottom: 14,
    textAlign: "center",
  },
  inputArea: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  textarea: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(139,92,246,0.3)",
    borderRadius: 12,
    color: "#e2e8f0",
    fontSize: 15,
    padding: "12px 14px",
    resize: "none",
    outline: "none",
    direction: "rtl",
    fontFamily: "inherit",
    lineHeight: 1.5,
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "13px 24px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
    letterSpacing: 0.5,
    boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
  },
  sendBtnDisabled: {
    background: "rgba(255,255,255,0.08)",
    color: "#64748b",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  loadingBar: {
    display: "flex",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#8b5cf6",
    animation: "pulse 1s infinite ease-in-out",
  },
  pulse: {
    animation: "pulse 1s infinite ease-in-out",
    display: "inline-block",
  },
};
