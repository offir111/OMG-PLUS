import React from 'react';
import { useNavigate } from 'react-router-dom';
import FaithChatPanel from '../components/faith/FaithChatPanel.jsx';

export default function ReligionFaithPage() {
  const navigate = useNavigate();
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="סגירה וחזרה לדף הקודם"
        style={{
          position: 'absolute', top: 12, left: 12, zIndex: 20,
          width: 36, height: 36, borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--card2)',
          color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >
        ✕
      </button>
      <FaithChatPanel />
    </div>
  );
}
