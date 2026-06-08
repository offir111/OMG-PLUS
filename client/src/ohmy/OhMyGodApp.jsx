import React, { useEffect, useRef, useState } from 'react';

const OHMY_URL = 'https://client-offir1.vercel.app';

export default function OhMyGodApp() {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return () => {
      window.__OHMY_MODE__ = false;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 500,
      background: '#07070c',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07070c',
          flexDirection: 'column',
          gap: 16,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid rgba(244,63,94,0.2)',
            borderTopColor: '#f43f5e',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{
            color: '#94a3b8',
            fontSize: 14,
            fontFamily: 'Rubik, Segoe UI, sans-serif',
          }}>
            טוען Oh My God...
          </p>
        </div>
      )}

      {/* The real Oh My God app */}
      <iframe
        ref={iframeRef}
        src={OHMY_URL}
        title="Oh My God"
        onLoad={() => setLoading(false)}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="microphone; autoplay; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
