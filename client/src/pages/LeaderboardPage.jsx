import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Static fallback data ───────────────────────────────────────────────────
const MOCK_LEADERS = [
  { rank: 1, username: 'אריאל_מנצח', score: 4820, debates: 38, side: 'בעד' },
  { rank: 2, username: 'דינה_חכמה', score: 4115, debates: 31, side: 'נגד' },
  { rank: 3, username: 'יוסי_מדבר', score: 3740, debates: 29, side: 'בעד' },
  { rank: 4, username: 'רחל_שואלת', score: 3210, debates: 24, side: 'נגד' },
  { rank: 5, username: 'מיכאל_רהוט', score: 2980, debates: 22, side: 'בעד' },
  { rank: 6, username: 'שירה_לוגיקה', score: 2750, debates: 20, side: 'נגד' },
  { rank: 7, username: 'אלי_טיעון', score: 2540, debates: 18, side: 'בעד' },
  { rank: 8, username: 'נועה_ביקורת', score: 2310, debates: 17, side: 'נגד' },
  { rank: 9, username: 'תמר_עמדה', score: 2180, debates: 15, side: 'בעד' },
  { rank: 10, username: 'גל_פולמוס', score: 2050, debates: 14, side: 'נגד' },
  { rank: 11, username: 'אורן_ויכוח', score: 1920, debates: 13, side: 'בעד' },
  { rank: 12, username: 'לי_משכנעת', score: 1800, debates: 12, side: 'נגד' },
  { rank: 13, username: 'עדן_טיעון', score: 1680, debates: 11, side: 'בעד' },
  { rank: 14, username: 'רון_ניתוח', score: 1560, debates: 10, side: 'נגד' },
  { rank: 15, username: 'יעל_פרשנות', score: 1440, debates: 9, side: 'בעד' },
  { rank: 16, username: 'אבי_חקירה', score: 1320, debates: 8, side: 'נגד' },
  { rank: 17, username: 'נילי_דיון', score: 1210, debates: 7, side: 'בעד' },
  { rank: 18, username: 'זיו_הוכחה', score: 1100, debates: 7, side: 'נגד' },
  { rank: 19, username: 'מאיה_סוגיה', score: 990, debates: 6, side: 'בעד' },
  { rank: 20, username: 'ידין_טענה', score: 880, debates: 5, side: 'נגד' },
];

const MOCK_TOPICS = [
  { label: 'בינה מלאכותית תחליף אנשים', count: 142 },
  { label: 'גיל הנישואין צריך לרדת', count: 98 },
  { label: 'חינוך דתי חובה', count: 87 },
  { label: 'עונש מוות ראוי', count: 74 },
  { label: 'קנאביס חוקי לכולם', count: 69 },
  { label: 'נשיאות ישירה בישראל', count: 61 },
  { label: 'חובת שירות אזרחי', count: 55 },
  { label: 'ויכוח על עתיד הדמוקרטיה', count: 48 },
];

// ─── Rank config ────────────────────────────────────────────────────────────
const RANK_CONFIG = {
  1: {
    medal: '🥇',
    label: 'מקום ראשון',
    gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    glow: 'rgba(255, 215, 0, 0.55)',
    border: '#FFD700',
    textColor: '#1a0e00',
  },
  2: {
    medal: '🥈',
    label: 'מקום שני',
    gradient: 'linear-gradient(135deg, #E8E8E8 0%, #9E9E9E 100%)',
    glow: 'rgba(192, 192, 192, 0.45)',
    border: '#C0C0C0',
    textColor: '#1a1a1a',
  },
  3: {
    medal: '🥉',
    label: 'מקום שלישי',
    gradient: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)',
    glow: 'rgba(205, 127, 50, 0.45)',
    border: '#CD7F32',
    textColor: '#fff8f0',
  },
};

const SIDE_COLORS = {
  'בעד': { bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.4)' },
  'נגד': { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)' },
};

// ─── Scoring tooltip content ─────────────────────────────────────────────────
const SCORING_RULES = [
  { icon: '🏆', text: 'ניצחון בוויכוח', points: '+50 נק׳' },
  { icon: '💬', text: 'השתתפות בוויכוח', points: '+10 נק׳' },
  { icon: '⭐', text: 'הצבעת הקהל (כל הצבעה)', points: '+5 נק׳' },
  { icon: '🔥', text: 'ניצחון רצוף (streak)', points: '+25 נק׳' },
  { icon: '📣', text: 'הזמנת משתמש חדש', points: '+30 נק׳' },
];

// ─── Shimmer skeleton styles ─────────────────────────────────────────────────
const shimmerKeyframes = `
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.85); }
  70%  { transform: scale(1.04); }
  100% { opacity: 1; transform: scale(1); }
}
`;

const SHIMMER_BG =
  'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.04) 75%)';

function ShimmerBox({ width = '100%', height = 20, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: SHIMMER_BG,
        backgroundSize: '800px 100%',
        animation: 'shimmer 1.4s infinite linear',
        ...style,
      }}
    />
  );
}

// ─── Scoring tooltip ─────────────────────────────────────────────────────────
function ScoringTooltip() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="כיצד מחושב הניקוד?"
        style={{
          background: 'rgba(150, 80, 255, 0.18)',
          border: '1px solid rgba(150, 80, 255, 0.45)',
          borderRadius: '50%',
          width: 28,
          height: 28,
          color: '#c084fc',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        ?
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 10, 30, 0.98)',
            border: '1px solid rgba(150, 80, 255, 0.4)',
            borderRadius: 14,
            padding: '16px 20px',
            width: 260,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#e2d9f3', fontSize: 14 }}>
            כיצד מחושב הניקוד?
          </p>
          {SCORING_RULES.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              <span style={{ color: '#c4b5fd' }}>
                {r.icon} {r.text}
              </span>
              <span style={{ color: '#a3e635', fontWeight: 700, marginRight: 8 }}>
                {r.points}
              </span>
            </div>
          ))}
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 10,
              background: 'none',
              border: 'none',
              color: 'rgba(196,181,253,0.5)',
              fontSize: 12,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            סגור ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Top-3 Card ──────────────────────────────────────────────────────────────
function TopCard({ player, delay = 0 }) {
  const cfg = RANK_CONFIG[player.rank];
  const sideStyle = SIDE_COLORS[player.side] || SIDE_COLORS['בעד'];

  return (
    <div
      style={{
        flex: '1 1 260px',
        maxWidth: 320,
        borderRadius: 20,
        padding: '24px 20px',
        background: 'rgba(15, 10, 30, 0.85)',
        border: `1.5px solid ${cfg.border}`,
        boxShadow: `0 0 28px ${cfg.glow}, 0 0 60px ${cfg.glow.replace('0.55', '0.18')}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        animation: `popIn 0.45s ease ${delay}ms both`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* gradient shimmer accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: cfg.gradient,
          borderRadius: '20px 20px 0 0',
        }}
      />

      {/* avatar with gradient ring */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: cfg.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
          boxShadow: `0 0 20px ${cfg.glow}`,
          flexShrink: 0,
        }}
      >
        <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          {player.rank === 1 ? '👑' : player.rank === 2 ? '🎖️' : '🏅'}
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, marginBottom: 2 }}>{cfg.medal}</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#f0eaff',
            marginBottom: 2,
            direction: 'rtl',
          }}
        >
          {player.username}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(196,181,253,0.55)' }}>{cfg.label}</div>
      </div>

      {/* Score */}
      <div
        style={{
          background: cfg.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        {player.score.toLocaleString('he-IL')}
        <span style={{ fontSize: 13, fontWeight: 500 }}> נק׳</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span
          style={{
            background: 'rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 12,
            color: '#c4b5fd',
          }}
        >
          💬 {player.debates} ויכוחים
        </span>
        <span
          style={{
            background: sideStyle.bg,
            border: `1px solid ${sideStyle.border}`,
            borderRadius: 8,
            padding: '4px 10px',
            fontSize: 12,
            color: sideStyle.color,
            fontWeight: 700,
          }}
        >
          {player.side}
        </span>
      </div>
    </div>
  );
}

// ─── Shimmer top card ────────────────────────────────────────────────────────
function ShimmerTopCard() {
  return (
    <div
      style={{
        flex: '1 1 260px',
        maxWidth: 320,
        borderRadius: 20,
        padding: '28px 20px',
        background: 'rgba(255,255,255,0.03)',
        border: '1.5px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <ShimmerBox width={72} height={72} radius={36} />
      <ShimmerBox width={120} height={16} />
      <ShimmerBox width={80} height={28} />
      <ShimmerBox width={150} height={14} />
    </div>
  );
}

// ─── Table row ───────────────────────────────────────────────────────────────
function TableRow({ player, index }) {
  const sideStyle = SIDE_COLORS[player.side] || SIDE_COLORS['בעד'];
  const isEven = index % 2 === 0;

  return (
    <tr
      style={{
        background: isEven ? 'rgba(255,255,255,0.025)' : 'transparent',
        animation: `fadeIn 0.3s ease ${index * 40}ms both`,
      }}
    >
      <td
        style={{
          padding: '12px 16px',
          textAlign: 'center',
          fontWeight: 700,
          color: 'rgba(196,181,253,0.7)',
          fontSize: 14,
        }}
      >
        #{player.rank}
      </td>
      <td
        style={{
          padding: '12px 16px',
          textAlign: 'right',
          color: '#e2d9f3',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {player.username}
      </td>
      <td
        style={{
          padding: '12px 16px',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 14,
          color: '#c084fc',
        }}
      >
        {player.score.toLocaleString('he-IL')}
      </td>
      <td
        style={{
          padding: '12px 16px',
          textAlign: 'center',
          color: 'rgba(196,181,253,0.7)',
          fontSize: 13,
        }}
      >
        {player.debates}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        <span
          style={{
            background: sideStyle.bg,
            border: `1px solid ${sideStyle.border}`,
            borderRadius: 6,
            padding: '2px 10px',
            fontSize: 12,
            color: sideStyle.color,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {player.side}
        </span>
      </td>
    </tr>
  );
}

// ─── Shimmer table row ───────────────────────────────────────────────────────
function ShimmerRow({ index }) {
  return (
    <tr style={{ background: index % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'transparent' }}>
      {[40, 110, 60, 40, 50].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px', textAlign: 'center' }}>
          <ShimmerBox width={w} height={13} style={{ margin: '0 auto' }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Hot Topics ──────────────────────────────────────────────────────────────
function HotTopics({ topics }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(150,80,255,0.2)',
        borderRadius: 16,
        padding: '20px 24px',
        animation: 'fadeIn 0.4s ease 0.3s both',
      }}
    >
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 16,
          fontWeight: 700,
          color: '#e2d9f3',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        🔥 נושאים חמים
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {topics.map((t, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(150,80,255,0.12)',
              border: '1px solid rgba(150,80,255,0.3)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 13,
              color: '#d4b5ff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'default',
              transition: 'background 0.2s',
            }}
          >
            {t.label}
            <span
              style={{
                background: 'rgba(150,80,255,0.35)',
                borderRadius: 10,
                padding: '1px 7px',
                fontSize: 11,
                fontWeight: 700,
                color: '#c084fc',
              }}
            >
              {t.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE}/api/leaderboard`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setLeaders(data.leaders || data || []);
        setTopics(data.hotTopics || MOCK_TOPICS);
      } catch (err) {
        if (cancelled) return;
        // Fall back gracefully to mock data so the page always shows something
        setLeaders(MOCK_LEADERS);
        setTopics(MOCK_TOPICS);
        setError('לא ניתן לטעון נתונים מהשרת — מציג נתוני דוגמה');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const top3 = leaders.slice(0, 3);
  const restAll = leaders.slice(3);
  const totalPages = Math.max(1, Math.ceil(restAll.length / PAGE_SIZE));
  const rest = restAll.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      {/* inject keyframes */}
      <style>{shimmerKeyframes}</style>

      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0f',
          color: '#f0eaff',
          fontFamily: "'Segoe UI', Arial, sans-serif",
          direction: 'rtl',
          padding: '0 0 60px',
        }}
      >
        {/* ── Hero header ── */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(150,80,255,0.15) 0%, transparent 100%)',
            borderBottom: '1px solid rgba(150,80,255,0.2)',
            padding: '36px 20px 28px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(22px, 5vw, 30px)',
              fontWeight: 900,
              background: 'linear-gradient(90deg, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            לוח המובילים
          </h1>
          <p style={{ margin: '8px 0 0', color: 'rgba(196,181,253,0.6)', fontSize: 14 }}>
            המתווכחים הטובים ביותר בפלטפורמה
          </p>
        </div>

        {/* ── Content wrapper ── */}
        <div
          style={{
            maxWidth: 860,
            margin: '0 auto',
            padding: '32px 16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 10,
                padding: '10px 16px',
                color: '#fca5a5',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* ── TOP 3 ── */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#e2d9f3',
                }}
              >
                🥇 מובילי הדירוג
              </h2>
              <ScoringTooltip />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {loading
                ? [0, 1, 2].map((i) => <ShimmerTopCard key={i} />)
                : top3.map((p, i) => (
                    <TopCard key={p.rank} player={p} delay={i * 100} />
                  ))}
            </div>
          </section>

          {/* ── Full table ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#e2d9f3',
                }}
              >
                📋 דירוג מלא
              </h2>
              {!loading && (
                <span style={{ fontSize: 13, color: 'rgba(196,181,253,0.6)' }}>
                  סה״כ {leaders.length} מתפלמסים רשומים
                </span>
              )}
            </div>

            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(150,80,255,0.2)',
                background: 'rgba(15,10,30,0.6)',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 14,
                    minWidth: 380,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'rgba(150,80,255,0.15)',
                        borderBottom: '1px solid rgba(150,80,255,0.25)',
                      }}
                    >
                      {['מקום', 'שם', 'ניקוד', 'ויכוחים', 'צד'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '14px 16px',
                            textAlign: 'center',
                            fontWeight: 700,
                            color: '#c4b5fd',
                            fontSize: 13,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody
                    key={page}
                    style={{ animation: 'pageFadeIn 0.3s ease both' }}
                  >
                    {loading
                      ? Array.from({ length: PAGE_SIZE }, (_, i) => (
                          <ShimmerRow key={i} index={i} />
                        ))
                      : rest.map((p, i) => (
                          <TableRow key={p.rank} player={p} index={i} />
                        ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Pagination controls ── */}
            {!loading && restAll.length > PAGE_SIZE && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  marginTop: 16,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  style={{
                    background: page === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(150,80,255,0.2)',
                    border: `1px solid ${page === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(150,80,255,0.45)'}`,
                    borderRadius: 10,
                    padding: '8px 18px',
                    color: page === 0 ? 'rgba(196,181,253,0.3)' : '#c084fc',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: page === 0 ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {'< הקודם'}
                </button>

                <span style={{ fontSize: 14, color: 'rgba(196,181,253,0.75)', fontWeight: 600 }}>
                  עמוד {page + 1} מתוך {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  style={{
                    background: page >= totalPages - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(150,80,255,0.2)',
                    border: `1px solid ${page >= totalPages - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(150,80,255,0.45)'}`,
                    borderRadius: 10,
                    padding: '8px 18px',
                    color: page >= totalPages - 1 ? 'rgba(196,181,253,0.3)' : '#c084fc',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit',
                  }}
                >
                  {'הבא >'}
                </button>
              </div>
            )}
          </section>

          {/* ── Hot Topics ── */}
          {!loading && <HotTopics topics={topics} />}
        </div>
      </div>
    </>
  );
}
