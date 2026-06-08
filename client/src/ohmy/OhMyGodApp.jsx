import React, { useState, useEffect } from 'react';

const OHMY_URL = 'https://client-offir1.vercel.app';

export default function OhMyGodApp() {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#07070c', display: 'flex', flexDirection: 'column' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070c', flexDirection: 'column', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#94a3b8', fontSize: 14, fontFamily: 'Rubik, Segoe UI, sans-serif' }}>טוען Oh My God...</p>
        </div>
      )}
      <iframe
        src={OHMY_URL}
        title="Oh My God"
        onLoad={() => setLoading(false)}
        style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
        allow="microphone; autoplay; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
