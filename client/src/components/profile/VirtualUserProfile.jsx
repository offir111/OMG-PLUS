/**
 * VirtualUserProfile.jsx
 * Renders the profile page for a virtual (AI) user.
 * Shows emoji avatar, bio, expertise, side badge, always-online dot, and blog posts.
 * No edit buttons, no messaging panel.
 */

import React, { useState } from 'react';
import { getLikes, saveLikes, getComments, saveComments, getPositions, savePositions, fmtDate } from '../../lib/blogReactions.js';

/* ─── Side config ─────────────────────────────────────────────────────── */
const SIDE_CONFIG = {
  believer: {
    label: 'מאמין',
    icon: '🙏',
    color: '#CC0000',
    bg: 'rgba(204,0,0,0.12)',
    border: 'rgba(204,0,0,0.35)',
  },
  atheist: {
    label: 'חילוני',
    icon: '🔬',
    color: '#00AA44',
    bg: 'rgba(0,170,68,0.12)',
    border: 'rgba(0,170,68,0.35)',
  },
};

/* ─── Blog post card (for virtual posts) ─────────────────────────────── */
function VirtualPostCard({ post, viewerUsername }) {
  const [likes, setLikes] = useState(() => getLikes(post.id));
  const [comments, setComments] = useState(() => getComments(post.id));
  const [positions, setPositions] = useState(() => getPositions(post.id));
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [showLikers, setShowLikers] = useState(false);
  const [draft, setDraft] = useState('');

  const iLiked = viewerUsername && likes.includes(viewerUsername);
  const myPos = viewerUsername ? positions[viewerUsername] : null;
  const believerCount = Object.values(positions).filter(v => v === 'believer').length;
  const skepticCount  = Object.values(positions).filter(v => v === 'skeptic').length;

  const handleLike = () => {
    if (!viewerUsername) return;
    const next = iLiked ? likes.filter(u => u !== viewerUsername) : [...likes, viewerUsername];
    saveLikes(post.id, next);
    setLikes(next);
  };

  const handlePos = pos => {
    if (!viewerUsername) return;
    const next = { ...positions };
    if (next[viewerUsername] === pos) delete next[viewerUsername];
    else next[viewerUsername] = pos;
    savePositions(post.id, next);
    setPositions(next);
  };

  const handleComment = () => {
    const body = draft.trim();
    if (!body || !viewerUsername) return;
    const c = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: viewerUsername,
      body,
      ts: Date.now(),
    };
    const next = [...comments, c];
    saveComments(post.id, next);
    setComments(next);
    setDraft('');
  };

  const btnBase = {
    border: 'none', background: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: '0.85rem', fontWeight: 700, padding: '8px 10px',
    minHeight: 40, borderRadius: 6, touchAction: 'manipulation',
  };

  return (
    <article style={{
      padding: '14px 14px 0',
      borderBottom: '1px solid var(--border)',
      direction: 'rtl',
    }}>
      {post.title ? (
        <h3 style={{ margin: '0 0 6px', color: 'var(--gold)', fontSize: '1rem', fontWeight: 900 }}>
          {post.title}
        </h3>
      ) : null}
      <p style={{
        margin: '0 0 8px',
        color: 'var(--text)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.65,
        fontSize: '0.88rem',
      }}>
        {post.body}
      </p>
      <span style={{ color: 'var(--muted)', fontSize: '0.68rem' }}>{fmtDate(post.ts)}</span>

      {/* Reaction bar */}
      <div style={{
        display: 'flex', gap: 2, flexWrap: 'wrap',
        margin: '8px 0 0', paddingBottom: 8,
        borderBottom: commentsOpen || showLikers ? '1px solid var(--border)' : 'none',
        alignItems: 'center',
      }}>
        <button type="button" onClick={handleLike} style={{
          ...btnBase,
          color: iLiked ? '#f43f5e' : 'var(--text-secondary)',
          background: iLiked ? 'rgba(244,63,94,0.1)' : 'transparent',
        }}>
          {iLiked ? '❤️' : '🤍'} {likes.length}
        </button>
        {likes.length > 0 && (
          <button type="button" onClick={() => setShowLikers(o => !o)} style={{
            ...btnBase, color: 'var(--muted)', fontSize: '0.72rem',
          }}>
            {showLikers ? 'הסתר ▲' : 'מי אהב? ▼'}
          </button>
        )}
        <button type="button" onClick={() => setCommentsOpen(o => !o)} style={{
          ...btnBase,
          color: commentsOpen ? 'var(--accent)' : 'var(--text-secondary)',
          background: commentsOpen ? 'rgba(99,102,241,0.1)' : 'transparent',
        }}>
          💬 {comments.length}
        </button>
        <span style={{ color: 'var(--border)', margin: '0 2px' }}>|</span>
        <button type="button" onClick={() => handlePos('believer')} style={{
          ...btnBase,
          color: myPos === 'believer' ? '#a78bfa' : 'var(--text-secondary)',
          background: myPos === 'believer' ? 'rgba(167,139,250,0.12)' : 'transparent',
        }} title="מאמין">🙏 {believerCount}</button>
        <button type="button" onClick={() => handlePos('skeptic')} style={{
          ...btnBase,
          color: myPos === 'skeptic' ? '#34d399' : 'var(--text-secondary)',
          background: myPos === 'skeptic' ? 'rgba(52,211,153,0.12)' : 'transparent',
        }} title="מפקפק">🔬 {skepticCount}</button>
      </div>

      {/* Likers list */}
      {showLikers && likes.length > 0 && (
        <div style={{ padding: '8px 0 10px', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <span style={{ color: 'var(--muted)', fontWeight: 700 }}>אהבו: </span>
          {likes.join(' · ')}
        </div>
      )}

      {/* Comments */}
      {commentsOpen && (
        <div style={{ paddingBottom: 12 }}>
          {comments.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '8px 0' }}>אין תגובות עדיין.</p>
          )}
          {comments.map(c => (
            <div key={c.id} style={{
              padding: '7px 0',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.82rem',
              direction: 'rtl',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', marginLeft: 6 }}>{c.author}</span>
              <span style={{ color: 'var(--text)' }}>{c.body}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.68rem', marginRight: 8 }}>{fmtDate(c.ts)}</span>
            </div>
          ))}
          {viewerUsername && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, direction: 'rtl' }}>
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="הוסף תגובה..."
                maxLength={500}
                style={{
                  flex: 1, padding: '8px 10px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6, color: 'var(--text)',
                  fontSize: '0.84rem', fontFamily: 'inherit',
                  direction: 'rtl',
                }}
              />
              <button type="button" onClick={handleComment} style={{
                padding: '8px 14px',
                background: 'var(--accent)',
                border: 'none', borderRadius: 6,
                color: '#fff', fontWeight: 700,
                fontSize: '0.84rem', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                שלח
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
/**
 * @param {object}   data           - public profile from /api/virtual-users/:username
 * @param {Array}    posts          - posts from /api/virtual-feed/user/:username
 * @param {Function} onClose        - back navigation callback
 * @param {string}   viewerUsername - logged-in user's username (for reactions)
 */
export default function VirtualUserProfile({ data, posts = [], onClose, viewerUsername = '' }) {
  const sideConf = SIDE_CONFIG[data.side] || SIDE_CONFIG.believer;

  return (
    <div
      className="cage-prof-root"
      style={{
        maxWidth: 560,
        margin: '0 auto',
        background: 'var(--bg)',
        minHeight: 'calc(100vh - var(--shell-top, 0px))',
        direction: 'rtl',
      }}
    >
      {/* ── Top bar ── */}
      <header style={{
        background: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        direction: 'rtl',
        borderBottom: '1px solid var(--border-strong)',
        position: 'sticky',
        top: 'var(--shell-top, 0px)',
        zIndex: 10,
      }}>
        <div style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-sans)', userSelect: 'none' }}>
          oh my GOD
        </div>
        <button
          type="button"
          aria-label="סגור דף פרופיל"
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.55)',
            fontSize: '0.82rem', fontWeight: 700,
            cursor: 'pointer', lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </header>

      {/* ── Hero ── */}
      <div style={{
        background: `linear-gradient(160deg, ${sideConf.color}22 0%, #111 100%)`,
        padding: '28px 20px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        direction: 'rtl',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Avatar emoji */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 80, height: 80,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${sideConf.color}44, #1a1a1a)`,
            border: `2.5px solid ${sideConf.color}88`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem',
            boxShadow: `0 0 18px ${sideConf.color}33`,
          }}>
            {data.avatarEmoji || '🤖'}
          </div>
          {/* Always-online green dot */}
          <span style={{
            position: 'absolute',
            bottom: 3, left: 3,
            width: 14, height: 14,
            borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid var(--bg)',
            boxShadow: '0 0 6px rgba(34,197,94,0.7)',
          }} title="תמיד מחובר/ת" />
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{
              margin: 0, fontSize: '1.18rem', fontWeight: 900,
              color: 'var(--text)', lineHeight: 1.2,
            }}>
              {data.displayName}
            </h1>
            {/* Side badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 9px', borderRadius: 20,
              background: sideConf.bg,
              border: `1px solid ${sideConf.border}`,
              color: sideConf.color,
              fontSize: '0.72rem', fontWeight: 800,
              whiteSpace: 'nowrap',
            }}>
              {sideConf.icon} {sideConf.label}
            </span>
          </div>

          {/* Username */}
          <div style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: '3px 0 6px' }}>
            @{data.username}
          </div>

          {/* Age / city / occupation */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px 12px',
            fontSize: '0.8rem', color: 'var(--text-secondary)',
          }}>
            {data.age ? <span>גיל {data.age}</span> : null}
            {data.city ? <span>📍 {data.city}</span> : null}
            {data.occupation ? <span>💼 {data.occupation}</span> : null}
          </div>

          {/* Always-online label */}
          <div style={{
            marginTop: 6,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(34,197,94,0.10)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 20,
            padding: '2px 9px',
            fontSize: '0.7rem', color: '#22c55e', fontWeight: 700,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            מחובר/ת תמיד
          </div>
        </div>
      </div>

      {/* ── AI badge ── */}
      <div style={{
        padding: '8px 16px',
        background: 'rgba(99,102,241,0.07)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
        direction: 'rtl',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>🤖</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
          דמות וירטואלית מבוססת AI — זמינה לשיחות ודיונים
        </span>
      </div>

      {/* ── Bio ── */}
      {data.bio ? (
        <section style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', direction: 'rtl' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 800,
            color: 'var(--muted)', marginBottom: 6,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            אודות
          </div>
          <p style={{
            margin: 0, color: 'var(--text-secondary)',
            fontSize: '0.88rem', lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}>
            {data.bio}
          </p>
        </section>
      ) : null}

      {/* ── Expertise areas ── */}
      {Array.isArray(data.expertiseAreas) && data.expertiseAreas.length > 0 ? (
        <section style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', direction: 'rtl' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 800,
            color: 'var(--muted)', marginBottom: 8,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            תחומי התמחות
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {data.expertiseAreas.map((area, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: 'var(--card2)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}>
                {area}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Personality ── */}
      {data.personality ? (
        <section style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', direction: 'rtl' }}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 800,
            color: 'var(--muted)', marginBottom: 5,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            אופי
          </div>
          <p style={{
            margin: 0, color: 'var(--muted)',
            fontSize: '0.82rem', lineHeight: 1.55,
            fontStyle: 'italic',
          }}>
            {data.personality}
          </p>
        </section>
      ) : null}

      {/* ── Blog posts ── */}
      <section>
        <div style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          padding: '10px 16px',
          fontWeight: 800,
          fontSize: '0.82rem',
          direction: 'rtl',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>פוסטים</span>
          {posts.length > 0 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>
              {posts.length} פוסטים
            </span>
          )}
        </div>

        {posts.length === 0 ? (
          <div style={{
            padding: '28px 16px',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: '0.88rem',
            direction: 'rtl',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✍️</div>
            <p style={{ margin: 0 }}>עדיין לא פורסמו פוסטים</p>
          </div>
        ) : (
          posts.map(post => (
            <VirtualPostCard
              key={post.id}
              post={post}
              viewerUsername={viewerUsername}
            />
          ))
        )}
      </section>

      {/* ── Bottom spacer ── */}
      <div style={{ height: 40 }} />
    </div>
  );
}
