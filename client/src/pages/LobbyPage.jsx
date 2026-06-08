import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { socket } from '../socket.js';
import SideTag from '../components/ui/SideTag.jsx';
import UserAvatarSlot from '../components/ui/UserAvatarSlot.jsx';
import { getCageAvatarDataUrlForDisplayName } from '../lib/cageUserProfile.js';

/* ─── AI Personas ──────────────────────────────────────────────────────────── */
const AI_PERSONAS = [
  { id: 'rabbi',        emoji: '🧑‍🏫', name: 'הרב',            side: 'believer',  color: '#60a5fa' },
  { id: 'philosopher',  emoji: '🧠', name: 'הפילוסוף',        side: 'atheist',   color: '#a78bfa' },
  { id: 'scientist',    emoji: '🔬', name: 'המדענית',          side: 'atheist',   color: '#34d399' },
  { id: 'mystic',       emoji: '🌙', name: 'המיסטיקן',         side: 'believer',  color: '#fbbf24' },
  { id: 'skeptic',      emoji: '🤨', name: 'הסקפטיקן',         side: 'atheist',   color: '#f87171' },
  { id: 'kabbalist',    emoji: '✡️',  name: 'המקובל',           side: 'believer',  color: '#c084fc' },
  { id: 'atheistProf',  emoji: '👨‍🎓', name: 'הפרופסור האתאיסט', side: 'atheist',   color: '#fb923c' },
  { id: 'nun',          emoji: '⛪', name: 'הנזירה',           side: 'believer',  color: '#f9a8d4' },
  { id: 'rationalist',  emoji: '📐', name: 'הרציונליסט',       side: 'atheist',   color: '#67e8f9' },
  { id: 'sufi',         emoji: '🌹', name: 'הסופי',             side: 'believer',  color: '#86efac' },
  { id: 'nihilist',     emoji: '🕳️', name: 'הניהיליסט',        side: 'atheist',   color: '#94a3b8' },
  { id: 'kiddushClub',  emoji: '🍷', name: 'חבר קידוש',        side: 'believer',  color: '#fde68a' },
  { id: 'cosmicAI',     emoji: '🤖', name: 'AI קוסמי',         side: 'atheist',   color: '#7dd3fc' },
];

/* ─── Animated dots ─────────────────────────────────────────────────────────── */
function ConnectingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center', marginTop: 10 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <span
          key={i}
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'var(--gold, #f59e0b)',
            display: 'inline-block',
            animation: `omgDotPulse 1.1s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes omgDotPulse {
          0%, 70%, 100% { opacity: 0.18; transform: scale(0.72); }
          35% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>
    </span>
  );
}

/* ─── AI offer dialog ────────────────────────────────────────────────────────── */
function AiOfferDialog({ onAccept, onDecline }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="הצעה לדיון מול AI"
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'var(--surface, #1e1e2e)',
          border: '1px solid var(--border, #333)',
          borderRadius: 20,
          padding: '36px 28px',
          maxWidth: 360,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>⏳</div>
        <h2 style={{ margin: '0 0 10px', fontSize: '1.25rem', fontWeight: 800 }}>
          לא נמצא יריב
        </h2>
        <p style={{ color: 'var(--muted, #888)', lineHeight: 1.65, marginBottom: 28, fontSize: '0.95rem' }}>
          רוצה להתפלמס מול AI?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="btn"
            onClick={onAccept}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '14px 24px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🤖 כן, התפלמס מול AI
          </button>
          <button
            onClick={onDecline}
            style={{
              background: 'transparent',
              color: 'var(--muted, #888)',
              border: '1px solid var(--border, #444)',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            המשך לחכות
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Persona picker ─────────────────────────────────────────────────────────── */
function PersonaPicker({ onSelect, onBack, userSide }) {
  return (
    <div style={{ padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent',
            border: '1px solid var(--border, #444)',
            borderRadius: 8,
            color: 'var(--muted, #888)',
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.88rem',
          }}
        >
          ← חזרה
        </button>
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>בחר יריב AI</h2>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {AI_PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              background: 'var(--surface, #1e1e2e)',
              border: `2px solid ${p.color}33`,
              borderRadius: 14,
              padding: '16px 10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              transition: 'border-color 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = p.color;
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = `${p.color}33`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{p.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: p.color }}>{p.name}</span>
            <span
              style={{
                fontSize: '0.72rem',
                color: p.side === 'believer' ? 'var(--believer, #60a5fa)' : 'var(--atheist, #f87171)',
                fontWeight: 600,
              }}
            >
              {p.side === 'believer' ? 'מאמין' : 'אתאיסט'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Waiting shell (human search) ──────────────────────────────────────────── */
function WaitingShell({ user, queuePosition, waitSeconds, showAiOffer, onAiAccept, onAiDecline, onCancel }) {
  const oppSide = user?.side === 'believer' ? 'atheist' : 'believer';
  const oppLabel = oppSide === 'believer' ? 'מאמין' : 'אתאיסט';

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}s`;
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--shell-top, 56px))',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
        gap: 0,
      }}
    >
      {showAiOffer && (
        <AiOfferDialog onAccept={onAiAccept} onDecline={onAiDecline} />
      )}

      <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🔍</div>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 900 }}>
        מחפש יריב {oppLabel}…
      </h2>
      <ConnectingDots />

      <div
        style={{
          marginTop: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'var(--surface, #1e1e2e)',
          border: '1px solid var(--border, #333)',
          borderRadius: 16,
          padding: '20px 32px',
          minWidth: 200,
        }}
      >
        <div>
          <span style={{ color: 'var(--muted, #888)', fontSize: '0.82rem' }}>מיקום בתור</span>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--gold, #f59e0b)' }}>
            #{queuePosition ?? '…'}
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--muted, #888)', fontSize: '0.82rem' }}>זמן המתנה</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatTime(waitSeconds)}</div>
        </div>
      </div>

      <button
        onClick={onCancel}
        style={{
          marginTop: 28,
          background: 'transparent',
          color: '#f87171',
          border: '1px solid #f87171',
          borderRadius: 12,
          padding: '12px 28px',
          fontSize: '0.95rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 600,
        }}
      >
        ✕ ביטול חיפוש
      </button>
    </div>
  );
}

/* ─── Recent debate card ─────────────────────────────────────────────────────── */
function RecentDebateCard({ debate }) {
  const ago = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'עכשיו';
    if (m < 60) return `לפני ${m} דק'`;
    const h = Math.floor(m / 60);
    if (h < 24) return `לפני ${h} שע'`;
    return `לפני ${Math.floor(h / 24)} ימים`;
  };

  return (
    <div
      style={{
        background: 'var(--surface, #1e1e2e)',
        border: '1px solid var(--border, #333)',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
        <span style={{ color: 'var(--believer, #60a5fa)', fontWeight: 700, fontSize: '0.9rem' }}>
          {debate.believer?.username || debate.believer}
        </span>
        <span style={{ color: 'var(--muted, #888)', fontSize: '0.8rem' }}>VS</span>
        <span style={{ color: 'var(--atheist, #f87171)', fontWeight: 700, fontSize: '0.9rem' }}>
          {debate.atheist?.username || debate.atheist}
        </span>
      </div>
      <span style={{ color: 'var(--muted, #888)', fontSize: '0.75rem', flexShrink: 0 }}>
        {debate.createdAt ? ago(debate.createdAt) : ''}
      </span>
    </div>
  );
}

/* ─── Main LobbyPage ─────────────────────────────────────────────────────────── */
export default function LobbyPage() {
  const user = useAppStore(s => s.user);
  const setDebate = useAppStore(s => s.setDebate);
  const navigate = useNavigate();
  const location = useLocation();

  // Read user from localStorage as fallback (spec says 'omgplus_user')
  const resolvedUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('omgplus_user') || 'null'); } catch { return null; }
  })();

  const [view, setView] = useState('idle'); // idle | waiting | persona-picker | waiting-ai | found
  const [queuePosition, setQueuePosition] = useState(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [showAiOffer, setShowAiOffer] = useState(false);
  const [onlineCount, setOnlineCount] = useState(null);
  const [recentDebates, setRecentDebates] = useState([]);
  const [connected, setConnected] = useState(socket.connected);

  const matchActiveRef = useRef(false);
  const waitTimerRef = useRef(null);
  const offerTimerRef = useRef(null);

  const quickAi = new URLSearchParams(location.search).get('ai') === '1';
  const quickHuman = new URLSearchParams(location.search).get('human') === '1';
  const quickAiSentRef = useRef(false);
  const quickHumanSentRef = useRef(false);

  /* ── socket lifecycle ──────────────────────────────────────────────────── */
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    const onMatchFound = ({ debateId, opponent, isAI, aiSide, believer, atheist, turn }) => {
      if (!matchActiveRef.current) return;
      matchActiveRef.current = false;
      clearTimers();
      setView('found');
      setDebate({
        id: debateId, isAI: !!isAI, aiSide,
        believer, atheist,
        phase: 'text', turn: turn || 'believer',
        textMessages: [], voiceMessages: [],
        textCount: { believer: 0, atheist: 0 },
        voiceCount: { believer: 0, atheist: 0 },
        giftsReceived: { believer: 0, atheist: 0 },
      });
      setTimeout(() => navigate(`/debate/${debateId}`), 250);
    };

    // canonical server event
    const onQueuePosition = ({ position }) => setQueuePosition(position);

    // legacy aliases used by current server
    const onWaitingForOpponent = () => setView(v => v === 'idle' ? 'waiting' : v);
    const onOnlineUsers = ({ count }) => setOnlineCount(count);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('match_found', onMatchFound);
    socket.on('MATCH_FOUND', onMatchFound);
    socket.on('queue_position', onQueuePosition);
    socket.on('QUEUE_POSITION', onQueuePosition);
    socket.on('WAITING_FOR_OPPONENT', onWaitingForOpponent);
    socket.on('online_users', onOnlineUsers);
    socket.on('ONLINE_USERS', onOnlineUsers);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('match_found', onMatchFound);
      socket.off('MATCH_FOUND', onMatchFound);
      socket.off('queue_position', onQueuePosition);
      socket.off('QUEUE_POSITION', onQueuePosition);
      socket.off('WAITING_FOR_OPPONENT', onWaitingForOpponent);
      socket.off('online_users', onOnlineUsers);
      socket.off('ONLINE_USERS', onOnlineUsers);
    };
  }, []);

  /* ── fetch recent debates ──────────────────────────────────────────────── */
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '';
    fetch(`${base}/api/debates/archived?limit=5`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setRecentDebates(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setRecentDebates([]));
  }, []);

  /* ── wait timer & 15s timeout ──────────────────────────────────────────── */
  useEffect(() => {
    if (view !== 'waiting') {
      clearTimers();
      if (view === 'idle') {
        setWaitSeconds(0);
        setQueuePosition(null);
        setShowAiOffer(false);
      }
      return;
    }

    // tick every second
    waitTimerRef.current = setInterval(() => {
      setWaitSeconds(s => s + 1);
    }, 1000);

    // 15s opt-in offer
    offerTimerRef.current = setTimeout(() => {
      setShowAiOffer(true);
    }, 15000);

    return () => clearTimers();
  }, [view]);

  /* ── quick-ai deep link ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!quickAi || !resolvedUser?.username || !resolvedUser?.side) return;
    if (quickAiSentRef.current) return;
    quickAiSentRef.current = true;
    matchActiveRef.current = true;
    setView('waiting-ai');
    socket.emit('REQUEST_AI_DEBATE', { username: resolvedUser.username, side: resolvedUser.side });
  }, [quickAi, resolvedUser?.username, resolvedUser?.side]);

  /* ── quick-human deep link ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!quickHuman || !resolvedUser?.username || !resolvedUser?.side) return;
    if (quickHumanSentRef.current) return;
    quickHumanSentRef.current = true;
    startHumanSearch();
  }, [quickHuman, resolvedUser?.username, resolvedUser?.side]);

  /* ── reset on homeTap ──────────────────────────────────────────────────── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.get('homeTap')) return;
    handleCancel();
    navigate('/lobby', { replace: true });
  }, [location.search]);

  function clearTimers() {
    if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null; }
    if (offerTimerRef.current) { clearTimeout(offerTimerRef.current); offerTimerRef.current = null; }
  }

  function startHumanSearch() {
    if (!resolvedUser?.username || !resolvedUser?.side) return;
    matchActiveRef.current = true;
    setWaitSeconds(0);
    setQueuePosition(null);
    setShowAiOffer(false);
    setView('waiting');
    socket.emit('join_queue', { username: resolvedUser.username, side: resolvedUser.side });
    // also emit server's legacy event name
    socket.emit('JOIN_QUEUE', { username: resolvedUser.username, side: resolvedUser.side });
  }

  function startAIDebate(persona) {
    if (!resolvedUser?.username || !resolvedUser?.side) return;
    matchActiveRef.current = true;
    setView('waiting-ai');
    socket.emit('REQUEST_AI_DEBATE', {
      username: resolvedUser.username,
      side: resolvedUser.side,
      persona: persona?.id,
    });
  }

  function handleCancel() {
    matchActiveRef.current = false;
    quickAiSentRef.current = false;
    quickHumanSentRef.current = false;
    clearTimers();
    setView('idle');
    setShowAiOffer(false);
    setWaitSeconds(0);
    setQueuePosition(null);
    socket.emit('leave_queue');
    socket.emit('LEAVE_QUEUE');
  }

  function handleAiOfferAccept() {
    setShowAiOffer(false);
    socket.emit('leave_queue');
    socket.emit('LEAVE_QUEUE');
    setView('persona-picker');
  }

  function handleAiOfferDecline() {
    setShowAiOffer(false);
    // restart the 15s timer so we offer again if still waiting
    if (offerTimerRef.current) clearTimeout(offerTimerRef.current);
    offerTimerRef.current = setTimeout(() => setShowAiOffer(true), 15000);
  }

  /* ─── render: waiting for human ─ */
  if (view === 'waiting') {
    return (
      <WaitingShell
        user={resolvedUser}
        queuePosition={queuePosition}
        waitSeconds={waitSeconds}
        showAiOffer={showAiOffer}
        onAiAccept={handleAiOfferAccept}
        onAiDecline={handleAiOfferDecline}
        onCancel={handleCancel}
      />
    );
  }

  /* ─── render: persona picker ─ */
  if (view === 'persona-picker') {
    return (
      <div className="page" style={{ direction: 'rtl' }}>
        <PersonaPicker
          userSide={resolvedUser?.side}
          onSelect={p => startAIDebate(p)}
          onBack={() => setView('idle')}
        />
      </div>
    );
  }

  /* ─── render: connecting to AI ─ */
  if (view === 'waiting-ai' || view === 'found') {
    return (
      <div
        className="page"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100vh - var(--shell-top, 56px))',
          padding: 24, direction: 'rtl',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div className="spinner" style={{ margin: '0 auto 20px', width: 44, height: 44 }} aria-hidden />
          <p style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 }}>
            {view === 'found' ? 'נמצא יריב! פותחים דיון…' : 'מתחבר ל-AI…'}
          </p>
          <p style={{ color: 'var(--muted, #888)', fontSize: '0.88rem', lineHeight: 1.5 }}>
            {view === 'found' ? 'מכין את הצ׳אט, רגע אחד' : 'מכין את הדיון, רגע אחד'}
          </p>
          {view !== 'found' && (
            <button
              onClick={handleCancel}
              style={{
                marginTop: 28,
                background: 'transparent',
                color: 'var(--muted, #888)',
                border: '1px solid var(--border, #444)',
                borderRadius: 10,
                padding: '10px 24px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
              }}
            >
              ✕ ביטול
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ─── render: idle lobby ─ */
  const sideColor = resolvedUser?.side === 'believer' ? 'var(--believer, #60a5fa)' : 'var(--atheist, #f87171)';

  return (
    <div className="page" style={{ direction: 'rtl' }}>
      <div className="container container-narrow" style={{ paddingTop: 20, paddingBottom: 40 }}>

        {/* ── User info ── */}
        <div
          style={{
            background: 'var(--surface, #1e1e2e)',
            border: '1px solid var(--border, #333)',
            borderRadius: 18,
            padding: '22px 20px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <UserAvatarSlot
            size="lg"
            displayName={resolvedUser?.username}
            avatarUrl={getCageAvatarDataUrlForDisplayName(resolvedUser?.username) || undefined}
          />
          <h1 style={{ margin: '12px 0 4px', fontSize: '1.35rem', fontWeight: 900 }}>
            {resolvedUser?.username || '—'}
          </h1>
          <div style={{ marginBottom: 12 }}>
            <SideTag side={resolvedUser?.side} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: sideColor }}>
                {resolvedUser?.score ?? 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted, #888)' }}>נקודות</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.5rem', fontWeight: 900,
                  color: onlineCount != null ? '#34d399' : 'var(--muted, #888)',
                }}
              >
                {onlineCount != null ? onlineCount : '…'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted, #888)' }}>משתמשים מקוונים</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: connected ? '#86efac' : '#f87171' }}>
                {connected ? '●' : '○'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted, #888)' }}>
                {connected ? 'מחובר' : 'מנותק'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          <button
            onClick={startHumanSearch}
            style={{
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '20px 24px',
              fontSize: '1.15rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              letterSpacing: '0.01em',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🔍</span>
            חפש יריב אנושי
          </button>

          <button
            onClick={() => setView('persona-picker')}
            style={{
              background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '20px 24px',
              fontSize: '1.15rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              letterSpacing: '0.01em',
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            התפלמס מול AI
          </button>
        </div>

        {/* ── Recent debates ── */}
        {recentDebates.length > 0 && (
          <div>
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--muted, #888)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              דיונים אחרונים
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentDebates.map((d, i) => (
                <RecentDebateCard key={d.id || d._id || i} debate={d} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
