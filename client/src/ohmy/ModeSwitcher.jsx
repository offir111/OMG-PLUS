import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const MODE_KEY = 'omgplus_mode';

export function getMode() {
  return localStorage.getItem(MODE_KEY) || '1';
}

export function setMode(m) {
  localStorage.setItem(MODE_KEY, m);
}

export default function ModeSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentMode = location.pathname.startsWith('/v2') ? '2' : '1';
  const [hovered, setHovered] = useState(null);

  function switchTo(mode) {
    setMode(mode);
    if (mode === '1') {
      navigate('/lobby');
    } else {
      navigate('/v2/lobby');
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      background: 'rgba(10,10,20,0.95)',
      border: '1px solid rgba(168,85,247,0.3)',
      borderRadius: 40,
      padding: '4px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>
      {/* Mode 1 */}
      <button
        onClick={() => switchTo('1')}
        onMouseEnter={() => setHovered('1')}
        onMouseLeave={() => setHovered(null)}
        title="OMG-PLUS — הגרסה החדשה"
        style={{
          padding: '8px 20px',
          borderRadius: 36,
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 0.5,
          transition: 'all 0.2s',
          background: currentMode === '1'
            ? 'linear-gradient(135deg, #a855f7, #ec4899)'
            : hovered === '1' ? 'rgba(168,85,247,0.15)' : 'transparent',
          color: currentMode === '1' ? '#fff' : '#94a3b8',
          boxShadow: currentMode === '1' ? '0 2px 12px rgba(168,85,247,0.4)' : 'none',
        }}
      >
        1 · OMG-PLUS
      </button>

      {/* Divider */}
      <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

      {/* Mode 2 */}
      <button
        onClick={() => switchTo('2')}
        onMouseEnter={() => setHovered('2')}
        onMouseLeave={() => setHovered(null)}
        title="Oh My God — הגרסה המקורית"
        style={{
          padding: '8px 20px',
          borderRadius: 36,
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: 0.5,
          transition: 'all 0.2s',
          background: currentMode === '2'
            ? 'linear-gradient(135deg, #f43f5e, #f97316)'
            : hovered === '2' ? 'rgba(244,63,94,0.15)' : 'transparent',
          color: currentMode === '2' ? '#fff' : '#94a3b8',
          boxShadow: currentMode === '2' ? '0 2px 12px rgba(244,63,94,0.4)' : 'none',
        }}
      >
        2 · Oh My God
      </button>
    </div>
  );
}
