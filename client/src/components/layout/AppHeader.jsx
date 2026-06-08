import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Inline styles (no external CSS dependency) ────────────────────────────

const COLORS = {
  bg: '#0f0f14',
  bgPanel: '#16161e',
  border: '#2a2a3a',
  accent1: '#a855f7', // purple
  accent2: '#ec4899', // pink
  accent3: '#f97316', // orange
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  hover: '#1e1e2e',
  overlay: 'rgba(0,0,0,0.7)',
};

const gradientText = {
  background: `linear-gradient(135deg, ${COLORS.accent1} 0%, ${COLORS.accent2} 50%, ${COLORS.accent3} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const baseStyles = {
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '58px',
    background: COLORS.bg,
    borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    zIndex: 1000,
    direction: 'rtl',
    transition: 'box-shadow 0.3s ease',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  headerScrolled: {
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
  },

  // Logo
  logo: {
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '-0.5px',
    cursor: 'pointer',
    userSelect: 'none',
    flexShrink: 0,
    ...gradientText,
  },

  // Center user info
  centerSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  username: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sideBadge: {
    padding: '1px 7px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${COLORS.accent1}, ${COLORS.accent2})`,
    color: '#fff',
    letterSpacing: '0.3px',
  },
  scoreBadge: {
    padding: '1px 7px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${COLORS.accent3}, ${COLORS.accent2})`,
    color: '#fff',
  },

  // Hamburger button
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  hamburgerLine: {
    width: '22px',
    height: '2px',
    borderRadius: '2px',
    background: COLORS.text,
    transition: 'all 0.3s ease',
  },

  // Overlay backdrop
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: COLORS.overlay,
    zIndex: 1001,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  backdropVisible: {
    opacity: 1,
  },

  // Slide-in panel
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: '320px',
    background: COLORS.bgPanel,
    borderLeft: `1px solid ${COLORS.border}`,
    zIndex: 1002,
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(100%)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    overflowY: 'auto',
    direction: 'rtl',
  },
  panelOpen: {
    transform: 'translateX(0)',
  },

  // Panel header
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 20px',
    borderBottom: `1px solid ${COLORS.border}`,
  },
  panelTitle: {
    fontSize: '18px',
    fontWeight: 700,
    ...gradientText,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: COLORS.textMuted,
    fontSize: '22px',
    lineHeight: 1,
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'color 0.2s, background 0.2s',
  },

  // User card in panel
  userCard: {
    margin: '16px 20px',
    padding: '14px 16px',
    background: 'rgba(168,85,247,0.08)',
    border: `1px solid rgba(168,85,247,0.2)`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${COLORS.accent1}, ${COLORS.accent2})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
  },
  userCardInfo: {
    flex: 1,
  },
  userCardName: {
    color: COLORS.text,
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  userCardBadges: {
    display: 'flex',
    gap: '6px',
  },

  // Nav section
  navSection: {
    padding: '8px 12px',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    padding: '8px 8px 4px 8px',
  },

  // Category header (clickable expand)
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 10px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    userSelect: 'none',
  },
  categoryEmoji: {
    fontSize: '18px',
    marginLeft: '8px',
    flexShrink: 0,
  },
  categoryLabel: {
    flex: 1,
    fontSize: '15px',
    fontWeight: 600,
    color: COLORS.text,
  },
  chevron: {
    fontSize: '12px',
    color: COLORS.textMuted,
    transition: 'transform 0.25s ease',
  },
  chevronOpen: {
    transform: 'rotate(90deg)',
  },

  // Sub items
  subItems: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 12px 9px 28px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s',
    color: COLORS.textMuted,
    fontSize: '14px',
    gap: '8px',
    margin: '1px 0',
  },
  navItemHover: {
    background: COLORS.hover,
    color: COLORS.text,
  },

  // Bottom actions
  bottomActions: {
    marginTop: 'auto',
    borderTop: `1px solid ${COLORS.border}`,
    padding: '12px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.18s',
    color: COLORS.textMuted,
    fontSize: '14px',
    fontWeight: 500,
    width: '100%',
    border: 'none',
    background: 'none',
    direction: 'rtl',
    textAlign: 'right',
  },
  logoutBtn: {
    color: '#f87171',
  },
};

// ─── Nav data ──────────────────────────────────────────────────────────────

const NAV_CATEGORIES = [
  {
    id: 'debate',
    emoji: '⚔️',
    label: 'ויכוח',
    items: [
      { label: 'לובי', path: '/lobby' },
      { label: 'ויכוחים חיים', path: '/live-debates' },
      { label: 'ארכיב', path: '/archive' },
    ],
  },
  {
    id: 'faith',
    emoji: '🙏',
    label: 'אמונה',
    items: [
      { label: "צ'אט אמונה", path: '/faith-chat' },
      { label: 'תנ"ך ושאלות', path: '/bible' },
    ],
  },
  {
    id: 'ai',
    emoji: '🤖',
    label: 'AI',
    items: [
      { label: 'ויכוח עם AI', path: '/ai-debate' },
      { label: 'סימולטור קולי', path: '/voice-simulator' },
    ],
  },
  {
    id: 'media',
    emoji: '📻',
    label: 'מדיה',
    items: [
      { label: 'רדיו', path: '/radio' },
      { label: 'פודקאסט', path: '/podcast' },
      { label: 'טלוויזיה', path: '/tv' },
    ],
  },
  {
    id: 'community',
    emoji: '👥',
    label: 'קהילה',
    items: [
      { label: 'בלוג', path: '/blog' },
      { label: 'לוח מובילים', path: '/leaderboard' },
      { label: 'חברים', path: '/friends' },
    ],
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────

function HamburgerIcon({ open }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <span
        style={{
          ...baseStyles.hamburgerLine,
          transform: open ? 'rotate(45deg) translate(5px, 5px)' : 'none',
        }}
      />
      <span
        style={{
          ...baseStyles.hamburgerLine,
          opacity: open ? 0 : 1,
          transform: open ? 'translateX(-10px)' : 'none',
        }}
      />
      <span
        style={{
          ...baseStyles.hamburgerLine,
          transform: open ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
        }}
      />
    </div>
  );
}

function NavItem({ label, path, onNavigate }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        ...baseStyles.navItem,
        ...(hovered ? baseStyles.navItemHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onNavigate && onNavigate(path)}
      role="menuitem"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate && onNavigate(path)}
    >
      <span style={{ fontSize: '13px', color: hovered ? COLORS.accent1 : COLORS.textMuted }}>›</span>
      <span>{label}</span>
    </div>
  );
}

function CategorySection({ category, onNavigate }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div style={{ marginBottom: '2px' }}>
      <div
        style={{
          ...baseStyles.categoryHeader,
          background: hovered || expanded ? COLORS.hover : 'transparent',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span style={baseStyles.categoryEmoji}>{category.emoji}</span>
        <span style={baseStyles.categoryLabel}>{category.label}</span>
        <span
          style={{
            ...baseStyles.chevron,
            ...(expanded ? baseStyles.chevronOpen : {}),
          }}
        >
          ❯
        </span>
      </div>

      <div
        ref={contentRef}
        style={{
          ...baseStyles.subItems,
          maxHeight: expanded ? `${contentHeight || 200}px` : '0px',
        }}
      >
        {category.items.map((item) => (
          <NavItem key={item.path} label={item.label} path={item.path} onNavigate={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function ActionButton({ emoji, label, onClick, danger }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={{
        ...baseStyles.actionBtn,
        ...(danger ? baseStyles.logoutBtn : {}),
        background: hovered ? COLORS.hover : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <span style={{ fontSize: '18px' }}>{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function AppHeader({ user, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const panelRef = useRef(null);

  // Resolve user from prop or localStorage
  const resolvedUser = user || (() => {
    try {
      return JSON.parse(localStorage.getItem('omg_user') || '{}');
    } catch {
      return {};
    }
  })();

  const username = resolvedUser?.username || resolvedUser?.name || 'אורח';
  const side = resolvedUser?.side || resolvedUser?.team || null;
  const score = resolvedUser?.score ?? resolvedUser?.points ?? null;

  // Scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [menuOpen]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavigate = useCallback((path) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      // fallback: native navigation
      window.location.hash = path;
    }
  }, [onNavigate]);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    localStorage.removeItem('omg_user');
    localStorage.removeItem('token');
    if (onNavigate) {
      onNavigate('/login');
    } else {
      window.location.hash = '/login';
    }
  }, [onNavigate]);

  const avatarLetter = username.charAt(0).toUpperCase();

  const panelWidth = isMobile ? '100%' : '320px';

  return (
    <>
      {/* ── Header bar ── */}
      <header
        style={{
          ...baseStyles.header,
          ...(scrolled ? baseStyles.headerScrolled : {}),
        }}
        role="banner"
      >
        {/* Right: Hamburger (RTL — hamburger on right = visual left for LTR, but logically right in RTL) */}
        <button
          style={baseStyles.hamburger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="תפריט ניווט"
          aria-expanded={menuOpen}
          aria-controls="app-nav-panel"
        >
          <HamburgerIcon open={menuOpen} />
        </button>

        {/* Center: user info */}
        <div style={baseStyles.centerSection}>
          <span style={baseStyles.username}>{username}</span>
          {(side !== null || score !== null) && (
            <div style={baseStyles.badgeRow}>
              {side && <span style={baseStyles.sideBadge}>{side}</span>}
              {score !== null && (
                <span style={baseStyles.scoreBadge}>⭐ {score}</span>
              )}
            </div>
          )}
        </div>

        {/* Left: Logo (RTL — logo on left = end side) */}
        <div
          style={baseStyles.logo}
          onClick={() => handleNavigate('/')}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/')}
          aria-label="OMG-PLUS דף הבית"
        >
          OMG+
        </div>
      </header>

      {/* ── Backdrop ── */}
      <div
        style={{
          ...baseStyles.backdrop,
          ...(menuOpen ? baseStyles.backdropVisible : {}),
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Slide-in panel ── */}
      <nav
        id="app-nav-panel"
        ref={panelRef}
        style={{
          ...baseStyles.panel,
          width: panelWidth,
          ...(menuOpen ? baseStyles.panelOpen : {}),
        }}
        aria-label="תפריט ראשי"
        role="navigation"
      >
        {/* Panel header */}
        <div style={baseStyles.panelHeader}>
          <span style={baseStyles.panelTitle}>OMG-PLUS</span>
          <button
            style={baseStyles.closeBtn}
            onClick={() => setMenuOpen(false)}
            aria-label="סגור תפריט"
          >
            ✕
          </button>
        </div>

        {/* User card */}
        {username && username !== 'אורח' && (
          <div style={baseStyles.userCard}>
            <div style={baseStyles.avatar}>{avatarLetter}</div>
            <div style={baseStyles.userCardInfo}>
              <div style={baseStyles.userCardName}>{username}</div>
              <div style={baseStyles.userCardBadges}>
                {side && <span style={baseStyles.sideBadge}>{side}</span>}
                {score !== null && (
                  <span style={baseStyles.scoreBadge}>⭐ {score}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Nav categories */}
        <div style={baseStyles.navSection}>
          <div style={baseStyles.sectionLabel}>ניווט</div>
          {NAV_CATEGORIES.map((cat) => (
            <CategorySection
              key={cat.id}
              category={cat}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {/* Bottom actions */}
        <div style={baseStyles.bottomActions}>
          <ActionButton
            emoji="👤"
            label="פרופיל"
            onClick={() => handleNavigate('/profile')}
          />
          <ActionButton
            emoji="⚙️"
            label="הגדרות"
            onClick={() => handleNavigate('/settings')}
          />
          <ActionButton
            emoji="🚪"
            label="התנתק"
            onClick={handleLogout}
            danger
          />
        </div>
      </nav>

      {/* ── Spacer so content doesn't hide behind fixed header ── */}
      <div style={{ height: '58px' }} aria-hidden="true" />
    </>
  );
}
