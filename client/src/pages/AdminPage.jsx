import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
import './AdminPage.css';

const TABS = [
  { id: 'users', label: 'משתמשים' },
  { id: 'debates', label: 'דיונים' },
  { id: 'blog', label: 'בלוג' },
  { id: 'stats', label: 'סטטיסטיקות' },
];

const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function getToken() {
  return localStorage.getItem('omg_admin_token') || '';
}

function getTokenTimestamp() {
  return parseInt(localStorage.getItem('omg_admin_token_ts') || '0', 10);
}

function setTokenTimestamp() {
  localStorage.setItem('omg_admin_token_ts', Date.now().toString());
}

function isTokenExpired() {
  const ts = getTokenTimestamp();
  if (!ts) return false; // no timestamp recorded yet — treat as valid
  return Date.now() - ts > TOKEN_MAX_AGE_MS;
}

function clearAdminAuth() {
  localStorage.removeItem('omg_admin_token');
  localStorage.removeItem('omg_admin_token_ts');
  localStorage.removeItem('omg_user');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiFetch(path, options = {}) {
  const BASE = getApiBaseUrl();
  const res = await fetch(`${BASE}/api/admin${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ─────────── Confirmation Modal ─────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()} dir="rtl">
        <p className="admin-modal-message">{message}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn admin-btn-red" onClick={onConfirm}>אישור</button>
          <button className="admin-btn admin-btn-gray" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Users Tab ─────────── */
function UsersTab({ onActivity }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [noteEdit, setNoteEdit] = useState({});
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await apiFetch('/users');
    if (ok && data?.users) setUsers(data.users);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  }

  function askConfirm(message, action) {
    onActivity();
    setConfirm({ message, onConfirm: action });
  }

  function closeConfirm() {
    setConfirm(null);
  }

  async function toggleBlock(user) {
    if (!user.blocked) {
      askConfirm(`האם לחסום את המשתמש ${user.username}?`, async () => {
        closeConfirm();
        const { ok, data } = await apiFetch('/block', {
          method: 'POST',
          body: JSON.stringify({ username: user.normalized, blocked: true }),
        });
        if (ok && data?.users) { setUsers(data.users); flash('חסום'); }
      });
    } else {
      const { ok, data } = await apiFetch('/block', {
        method: 'POST',
        body: JSON.stringify({ username: user.normalized, blocked: false }),
      });
      if (ok && data?.users) { setUsers(data.users); flash('שוחרר מחסימה'); }
    }
  }

  async function saveNote(norm) {
    onActivity();
    const note = noteEdit[norm] ?? users.find(u => u.normalized === norm)?.note ?? '';
    const { ok, data } = await apiFetch('/note', {
      method: 'POST',
      body: JSON.stringify({ username: norm, note }),
    });
    if (ok && data?.users) { setUsers(data.users); flash('הערה נשמרה'); }
  }

  async function resetScore(norm) {
    if (!window.confirm(`לאפס ניקוד של ${norm}?`)) return;
    onActivity();
    const { ok, data } = await apiFetch('/reset-score', {
      method: 'POST',
      body: JSON.stringify({ username: norm }),
    });
    if (ok && data?.users) { setUsers(data.users); flash('ניקוד אופס'); }
  }

  async function resetLogin(norm, username) {
    if (!window.confirm(`לאפס כניסה של "${username}"?\nהמשתמש יוסר מהמערכת ויוכל להירשם מחדש (ניקוד נשמר).`)) return;
    onActivity();
    const { ok, data } = await apiFetch('/reset-login', {
      method: 'POST',
      body: JSON.stringify({ username: norm }),
    });
    if (ok && data?.users) { setUsers(data.users); flash(`✅ כניסת ${username} אופסה — יכול להירשם מחדש`); }
    else flash('❌ שגיאה באיפוס כניסה');
  }

  async function deleteUser(norm, username) {
    askConfirm(`האם למחוק לצמיתות את המשתמש ${username}? פעולה זו אינה הפיכה!`, async () => {
      closeConfirm();
      const { ok, data } = await apiFetch(`/users/${encodeURIComponent(norm)}`, { method: 'DELETE' });
      if (ok && data?.users) { setUsers(data.users); flash('משתמש נמחק'); }
    });
  }

  const filtered = users.filter(u =>
    !search || u.username.includes(search) || u.note.includes(search),
  );

  return (
    <div className="admin-tab-content">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={closeConfirm}
        />
      )}
      {msg && <div className="admin-flash">{msg}</div>}
      <div className="admin-search-row">
        <input
          className="admin-input"
          placeholder="חיפוש שם משתמש..."
          value={search}
          onChange={e => { setSearch(e.target.value); onActivity(); }}
        />
        <span className="admin-count">{filtered.length} משתמשים</span>
      </div>
      {loading ? (
        <div className="admin-loading">טוען...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>שם משתמש</th>
                <th>ניקוד</th>
                <th>עמדה</th>
                <th>ניצחונות</th>
                <th>מצב</th>
                <th>הערה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.normalized} className={u.blocked ? 'admin-row-blocked' : ''}>
                  <td className="admin-username">{u.username}</td>
                  <td>{u.score}</td>
                  <td>{u.side === 'believer' ? 'מאמין' : u.side === 'atheist' ? 'אתאיסט' : '—'}</td>
                  <td>{u.voiceDebates || 0}</td>
                  <td>
                    <span className={`admin-badge ${u.blocked ? 'admin-badge-blocked' : 'admin-badge-ok'}`}>
                      {u.blocked ? 'חסום' : 'פעיל'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-note-cell">
                      <input
                        className="admin-input admin-note-input"
                        placeholder="הערה..."
                        value={noteEdit[u.normalized] ?? u.note}
                        onChange={e => setNoteEdit(prev => ({ ...prev, [u.normalized]: e.target.value }))}
                      />
                      <button className="admin-btn admin-btn-sm" onClick={() => saveNote(u.normalized)}>שמור</button>
                    </div>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className={`admin-btn admin-btn-sm ${u.blocked ? 'admin-btn-green' : 'admin-btn-orange'}`}
                        onClick={() => toggleBlock(u)}
                        disabled={u.normalized === 'omg'}
                      >
                        {u.blocked ? 'שחרר' : 'חסום'}
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-blue"
                        onClick={() => resetLogin(u.normalized, u.username)}
                        disabled={u.normalized === 'omg'}
                        title="מוחק סיסמה — המשתמש יוכל להירשם מחדש. פותר כניסה כפולה (אפליקציה + דפדפן)"
                      >
                        🔑 אפס כניסה
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-gray"
                        onClick={() => resetScore(u.normalized)}
                        disabled={u.normalized === 'omg'}
                      >
                        אפס ניקוד
                      </button>
                      <button
                        className="admin-btn admin-btn-sm admin-btn-red"
                        onClick={() => deleteUser(u.normalized, u.username)}
                        disabled={u.normalized === 'omg'}
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────── Debates Tab ─────────── */
function DebatesTab({ onActivity }) {
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await apiFetch('/debates');
    if (ok && data?.debates) setDebates(data.debates);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  }

  async function deleteDebate(id) {
    if (!window.confirm('למחוק דיון זה לצמיתות?')) return;
    onActivity();
    const { ok } = await apiFetch(`/debates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (ok) { setDebates(prev => prev.filter(d => d.id !== id)); flash('דיון נמחק'); }
  }

  return (
    <div className="admin-tab-content">
      {msg && <div className="admin-flash">{msg}</div>}
      <div className="admin-search-row">
        <span className="admin-count">{debates.length} דיונים</span>
      </div>
      {loading ? (
        <div className="admin-loading">טוען...</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>מאמין</th>
                <th>אתאיסט</th>
                <th>סוג</th>
                <th>הודעות</th>
                <th>תאריך</th>
                <th>תקציר</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              {debates.map(d => (
                <tr key={d.id}>
                  <td>{d.believer || '—'}</td>
                  <td>{d.atheist || '—'}</td>
                  <td>{d.isAI ? 'AI' : 'אנושי'}</td>
                  <td>{d.messageCount}</td>
                  <td>{formatDate(d.startedAt)}</td>
                  <td className="admin-summary">{d.summary || '—'}</td>
                  <td>
                    <button
                      className="admin-btn admin-btn-sm admin-btn-red"
                      onClick={() => deleteDebate(d.id)}
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────── Blog Tab ─────────── */
function BlogTab({ onActivity }) {
  const [mod, setMod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorInput, setAuthorInput] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const BASE = getApiBaseUrl();
    const res = await fetch(`${BASE}/api/admin/blog-feed/status`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).catch(() => null);
    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data) setMod(data);
    } else {
      setMod({ hiddenKeys: [], pendingKeys: [], blockedAuthors: [] });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function flash(text) {
    setMsg(text);
    setTimeout(() => setMsg(''), 2500);
  }

  async function blockAuthor() {
    const a = authorInput.trim();
    if (!a) return;
    onActivity();
    const { ok, data } = await apiFetch('/blog-feed/block-author', {
      method: 'POST',
      body: JSON.stringify({ author: a }),
    });
    if (ok && data) { setMod(data); setAuthorInput(''); flash(`כותב "${a}" נחסם`); }
  }

  async function unblockAuthor(author) {
    onActivity();
    const { ok, data } = await apiFetch('/blog-feed/unblock-author', {
      method: 'POST',
      body: JSON.stringify({ author }),
    });
    if (ok && data) { setMod(data); flash(`כותב "${author}" שוחרר`); }
  }

  return (
    <div className="admin-tab-content">
      {msg && <div className="admin-flash">{msg}</div>}
      {loading ? (
        <div className="admin-loading">טוען...</div>
      ) : (
        <>
          <div className="admin-section">
            <h3 className="admin-section-title">חסימת כותב מהבלוג הציבורי</h3>
            <div className="admin-row-gap">
              <input
                className="admin-input"
                placeholder="שם משתמש לחסימה..."
                value={authorInput}
                onChange={e => setAuthorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && blockAuthor()}
              />
              <button className="admin-btn admin-btn-orange" onClick={blockAuthor}>חסום כותב</button>
            </div>
            {mod?.blockedAuthors?.length > 0 && (
              <div className="admin-tag-list">
                {mod.blockedAuthors.map(a => (
                  <span key={a} className="admin-tag admin-tag-red">
                    {a}
                    <button className="admin-tag-x" onClick={() => unblockAuthor(a)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="admin-section">
            <h3 className="admin-section-title">פוסטים מוסתרים ({mod?.hiddenKeys?.length || 0})</h3>
            {mod?.hiddenKeys?.length > 0 ? (
              <div className="admin-key-list">
                {mod.hiddenKeys.map(k => <div key={k} className="admin-key-item">{k}</div>)}
              </div>
            ) : <p className="admin-empty">אין פוסטים מוסתרים</p>}
          </div>

          <div className="admin-section">
            <h3 className="admin-section-title">ממתינים לבדיקה ({mod?.pendingKeys?.length || 0})</h3>
            {mod?.pendingKeys?.length > 0 ? (
              <div className="admin-key-list">
                {mod.pendingKeys.map(k => <div key={k} className="admin-key-item">{k}</div>)}
              </div>
            ) : <p className="admin-empty">אין פוסטים ממתינים</p>}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────── Stats Tab ─────────── */
function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const BASE = getApiBaseUrl();
    fetch(`${BASE}/api/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-tab-content"><div className="admin-loading">טוען...</div></div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats?.registered ?? '—'}</div>
          <div className="admin-stat-label">משתמשים רשומים</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats?.online ?? '—'}</div>
          <div className="admin-stat-label">מחוברים עכשיו</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats?.believers ?? '—'}</div>
          <div className="admin-stat-label">מאמינים</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats?.atheists ?? '—'}</div>
          <div className="admin-stat-label">אתאיסטים</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Main Admin Page ─────────── */
export default function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [authorized, setAuthorized] = useState(null);
  const inactivityTimer = useRef(null);

  function doLogout() {
    clearAdminAuth();
    navigate('/login');
  }

  function resetInactivityTimer() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      alert('התנתקת אוטומטית עקב חוסר פעילות של 30 דקות.');
      doLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }

  // Record activity from child tabs
  function handleActivity() {
    resetInactivityTimer();
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthorized(false); return; }

    // Check token age
    if (isTokenExpired()) {
      clearAdminAuth();
      setAuthorized(false);
      return;
    }

    // Record login timestamp if not present
    if (!getTokenTimestamp()) {
      setTokenTimestamp();
    }

    apiFetch('/verify').then(({ ok }) => {
      setAuthorized(ok);
      if (ok) {
        // Start inactivity timer once authorized
        resetInactivityTimer();
        // Track user interactions for inactivity reset
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        events.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
      }
    });

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
      events.forEach(ev => window.removeEventListener(ev, resetInactivityTimer));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    doLogout();
  }

  if (authorized === null) {
    return <div className="admin-page"><div className="admin-loading admin-loading-center">מאמת הרשאות...</div></div>;
  }

  if (!authorized) {
    return (
      <div className="admin-page">
        <div className="admin-auth-error">
          <h2>גישה נדחתה</h2>
          <p>נדרשת כניסה כמנהל (OMG)</p>
          <button className="admin-btn admin-btn-orange" onClick={() => navigate('/login')}>חזור לכניסה</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" dir="rtl">
      <div className="admin-header">
        <div className="admin-header-title">
          <span className="admin-crown">👑</span>
          <span>לוח בקרה — מנהל OMG</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="admin-btn admin-btn-orange admin-btn-sm" onClick={() => navigate(-1)}>← חזרה לאפליקציה</button>
          <button className="admin-btn admin-btn-gray admin-btn-sm" onClick={logout}>התנתק</button>
        </div>
      </div>

      <div className="admin-security-warning" dir="rtl">
        ⚠️ שים לב: הישאר מחובר רק במכשיר מאובטח
      </div>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab-btn ${tab === t.id ? 'admin-tab-btn-active' : ''}`}
            onClick={() => { setTab(t.id); handleActivity(); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab onActivity={handleActivity} />}
      {tab === 'debates' && <DebatesTab onActivity={handleActivity} />}
      {tab === 'blog' && <BlogTab onActivity={handleActivity} />}
      {tab === 'stats' && <StatsTab />}
    </div>
  );
}
