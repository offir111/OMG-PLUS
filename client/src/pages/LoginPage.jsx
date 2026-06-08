import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
const API_BASE = getApiBaseUrl();

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    direction: 'rtl',
    position: 'relative',
    overflow: 'hidden',
  },
  bgCanvas: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(15, 12, 28, 0.92)',
    border: '1px solid rgba(150, 80, 255, 0.3)',
    borderRadius: '20px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '400px',
    margin: '16px',
    boxShadow: '0 0 60px rgba(120, 40, 220, 0.25), 0 0 120px rgba(120, 40, 220, 0.1)',
    backdropFilter: 'blur(12px)',
  },
  title: {
    textAlign: 'center',
    fontSize: '2.6rem',
    fontWeight: '900',
    marginBottom: '6px',
    background: 'linear-gradient(135deg, #9b4dff 0%, #d4a017 50%, #9b4dff 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '2px',
    animation: 'shimmer 3s linear infinite',
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(200, 180, 255, 0.6)',
    fontSize: '0.85rem',
    marginBottom: '28px',
    letterSpacing: '1px',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginBottom: '28px',
  },
  statBadge: {
    background: 'rgba(100, 60, 180, 0.2)',
    border: '1px solid rgba(150, 80, 255, 0.25)',
    borderRadius: '10px',
    padding: '6px 14px',
    textAlign: 'center',
    minWidth: '90px',
  },
  statNum: {
    color: '#c89fff',
    fontWeight: '700',
    fontSize: '1.1rem',
    display: 'block',
  },
  statLabel: {
    color: 'rgba(180, 160, 220, 0.6)',
    fontSize: '0.72rem',
  },
  onlineDot: {
    display: 'inline-block',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#22c55e',
    marginLeft: '5px',
    animation: 'pulse 1.5s ease-in-out infinite',
    verticalAlign: 'middle',
  },
  fieldGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'block',
    color: 'rgba(200, 180, 255, 0.85)',
    fontSize: '0.82rem',
    marginBottom: '7px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    background: 'rgba(20, 15, 40, 0.8)',
    border: '1px solid rgba(130, 70, 220, 0.35)',
    borderRadius: '10px',
    padding: '11px 14px',
    color: '#e8d8ff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    textAlign: 'right',
  },
  inputFocus: {
    borderColor: 'rgba(155, 77, 255, 0.7)',
    boxShadow: '0 0 0 3px rgba(155, 77, 255, 0.12)',
  },
  inputError: {
    borderColor: 'rgba(255, 80, 80, 0.6)',
  },
  sideLabel: {
    display: 'block',
    color: 'rgba(200, 180, 255, 0.85)',
    fontSize: '0.82rem',
    marginBottom: '10px',
    fontWeight: '600',
  },
  sideRow: {
    display: 'flex',
    gap: '12px',
  },
  sideBtn: (selected, color) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    border: selected
      ? `2px solid ${color}`
      : '2px solid rgba(100, 80, 160, 0.3)',
    background: selected
      ? `${color}22`
      : 'rgba(20, 15, 40, 0.6)',
    color: selected ? color : 'rgba(180, 160, 220, 0.6)',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    boxShadow: selected ? `0 0 18px ${color}44` : 'none',
  }),
  sideDesc: {
    fontSize: '0.68rem',
    opacity: 0.7,
    display: 'block',
    marginTop: '3px',
    fontWeight: '400',
  },
  errorBox: {
    background: 'rgba(220, 50, 50, 0.12)',
    border: '1px solid rgba(220, 50, 50, 0.35)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ff8080',
    fontSize: '0.85rem',
    marginBottom: '16px',
    textAlign: 'right',
  },
  privateBanner: {
    background: 'rgba(200, 150, 0, 0.18)',
    border: '1px solid rgba(220, 170, 0, 0.5)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#ffd966',
    fontSize: '0.82rem',
    marginBottom: '16px',
    textAlign: 'right',
  },
  submitBtn: (loading) => ({
    width: '100%',
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    background: loading
      ? 'rgba(100, 60, 180, 0.4)'
      : 'linear-gradient(135deg, #7b2fff 0%, #b8860b 100%)',
    color: '#fff',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: loading ? 'not-allowed' : 'pointer',
    marginTop: '20px',
    transition: 'all 0.2s',
    letterSpacing: '1px',
    boxShadow: loading ? 'none' : '0 4px 24px rgba(120, 40, 220, 0.35)',
    position: 'relative',
    overflow: 'hidden',
  }),
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    marginLeft: '8px',
    verticalAlign: 'middle',
  },
  switchText: {
    textAlign: 'center',
    color: 'rgba(180, 160, 220, 0.55)',
    fontSize: '0.78rem',
    marginTop: '16px',
  },
  switchLink: {
    color: '#9b6dff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: '600',
  },
  hintText: {
    color: 'rgba(180, 160, 220, 0.45)',
    fontSize: '0.7rem',
    marginTop: '4px',
    display: 'block',
  },
};

const keyframes = `
  @keyframes shimmer {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.85); }
  }
  @keyframes float0 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-30px) scale(1.08); }
  }
  @keyframes float1 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(25px) scale(0.95); }
  }
  @keyframes float2 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-20px) scale(1.05); }
  }
  @keyframes float3 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(18px) scale(0.92); }
  }
`;

const BG_ORBS = [
  { size: 340, top: '5%', left: '10%', color: 'rgba(100,30,200,0.18)', anim: 'float0 8s ease-in-out infinite' },
  { size: 260, top: '60%', left: '70%', color: 'rgba(180,120,0,0.12)', anim: 'float1 11s ease-in-out infinite' },
  { size: 180, top: '75%', left: '5%', color: 'rgba(80,20,180,0.15)', anim: 'float2 9s ease-in-out infinite' },
  { size: 220, top: '15%', left: '65%', color: 'rgba(140,80,0,0.1)', anim: 'float3 13s ease-in-out infinite' },
];

function AnimatedBackground() {
  return (
    <div style={styles.bgCanvas}>
      {BG_ORBS.map((orb, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: orb.size,
            height: orb.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            top: orb.top,
            left: orb.left,
            animation: orb.anim,
            filter: 'blur(2px)',
          }}
        />
      ))}
    </div>
  );
}

function InputField({ label, hint, value, onChange, type = 'text', placeholder, hasError, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...styles.input,
          ...(focused ? styles.inputFocus : {}),
          ...(hasError ? styles.inputError : {}),
        }}
        {...rest}
      />
      {hint && <span style={styles.hintText}>{hint}</span>}
    </div>
  );
}

function isLocalStorageAvailable() {
  try { localStorage.setItem('test', '1'); localStorage.removeItem('test'); return true; }
  catch (e) { return false; }
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [side, setSide] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: null, online: null });
  const [privateMode, setPrivateMode] = useState(false);

  useEffect(() => {
    if (!isLocalStorageAvailable()) setPrivateMode(true);
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats({ total: data.registered ?? data.total ?? null, online: data.online ?? null });
      }
    } catch {
      // silent — stats are cosmetic
    }
  }

  function validate() {
    if (!username.trim()) return 'יש להזין שם משתמש';
    if (username.trim().length < 2 || username.trim().length > 20)
      return 'שם משתמש חייב להיות בין 2 ל-20 תווים';
    if (!password) return 'יש להזין סיסמה';
    if (!/^\d{4}$/.test(password)) return 'הסיסמה חייבת להיות בדיוק 4 ספרות';
    if (mode === 'register' && !side) return 'יש לבחור צד — מאמין או ספקן';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/register' : '/api/login';
      const body = mode === 'register'
        ? { username: username.trim(), password, side }
        : { username: username.trim(), password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        let msg;
        if (res.status === 404) msg = 'שם המשתמש לא קיים';
        else if (res.status === 401) msg = 'סיסמה שגויה';
        else if (res.status === 409) msg = 'שם המשתמש כבר תפוס — בחר שם אחר';
        else msg = data.message || data.error || 'שגיאה בשרת, נסה שנית';
        setError(msg);
        return;
      }

      const user = {
        username: data.username || username.trim(),
        side: data.side || side,
        token: data.token || null,
        id: data.id || data._id || null,
      };
      localStorage.setItem('omgplus_user', JSON.stringify(user));
      navigate('/lobby');
    } catch {
      setError('אין חיבור לשרת — בדוק את החיבור לאינטרנט');
    } finally {
      setLoading(false);
    }
  }

  function handlePasswordChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPassword(val);
  }

  const isRegister = mode === 'register';

  return (
    <>
      <style>{keyframes}</style>
      <div style={styles.wrapper}>
        <AnimatedBackground />
        <div style={styles.card}>
          <h1 style={styles.title}>OMG-PLUS</h1>
          <p style={styles.subtitle}>פלטפורמת הדיון האולטימטיבית</p>

          {/* Stats */}
          {(stats.total !== null || stats.online !== null) && (
            <div style={styles.statsRow}>
              {stats.total !== null && (
                <div style={styles.statBadge}>
                  <span style={styles.statNum}>{stats.total.toLocaleString()}</span>
                  <span style={styles.statLabel}>משתמשים רשומים</span>
                </div>
              )}
              {stats.online !== null && (
                <div style={styles.statBadge}>
                  <span style={styles.statNum}>
                    <span style={styles.onlineDot} />
                    {stats.online}
                  </span>
                  <span style={styles.statLabel}>מחוברים עכשיו</span>
                </div>
              )}
            </div>
          )}

          {privateMode && (
            <div style={styles.privateBanner}>
              ⚠️ הדפדפן שלך במצב פרטי — הנתונים לא יישמרו בין ביקורים
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <InputField
              label="שם משתמש"
              hint="2–20 תווים, עברית ואנגלית מותרות"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="הכנס שם משתמש..."
              maxLength={20}
              autoComplete="username"
            />

            <InputField
              label="סיסמה"
              hint="בדיוק 4 ספרות"
              value={password}
              onChange={handlePasswordChange}
              type="password"
              inputMode="numeric"
              placeholder="4 ספרות"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />

            {isRegister && (
              <div style={styles.fieldGroup}>
                <label style={styles.sideLabel}>בחר את הצד שלך</label>
                <div style={styles.sideRow}>
                  <button
                    type="button"
                    style={styles.sideBtn(side === 'believer', '#ef4444')}
                    onClick={() => setSide('believer')}
                  >
                    מאמין
                    <span style={styles.sideDesc}>יש אלוהים</span>
                  </button>
                  <button
                    type="button"
                    style={styles.sideBtn(side === 'skeptic', '#22c55e')}
                    onClick={() => setSide('skeptic')}
                  >
                    ספקן
                    <span style={styles.sideDesc}>אין הוכחה</span>
                  </button>
                </div>
              </div>
            )}

            {error && <div style={styles.errorBox}>{error}</div>}

            <button type="submit" style={styles.submitBtn(loading)} disabled={loading}>
              {loading ? (
                <>
                  {isRegister ? 'נרשם...' : 'מתחבר...'}
                  <span style={styles.spinner} />
                </>
              ) : (
                isRegister ? 'הירשם ✦' : 'כניסה ✦'
              )}
            </button>
          </form>

          <p style={styles.switchText}>
            {isRegister ? 'כבר יש לך חשבון? ' : 'אין לך חשבון עדיין? '}
            <span
              style={styles.switchLink}
              onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}
            >
              {isRegister ? 'התחבר כאן' : 'הירשם עכשיו'}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
