import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ensureYoutubeIframeAPI } from '../../lib/youtubeIframeApi.js';
import { applyYoutubeEmbedPlaybackParams } from '../../lib/ytStationsLocal.js';

export function youtubeEmbedVideoId(ytTvUrl) {
  if (!ytTvUrl || typeof ytTvUrl !== 'string') return null;
  try {
    const u = new URL(ytTvUrl);
    if (u.pathname.includes('live_stream')) return null;
    const m = u.pathname.match(/\/embed\/([^/?]+)/);
    return m?.[1] || null;
  } catch {
    return null;
  }
}

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';

function FallbackIframe({ src, className, style }) {
  return (
    <iframe
      className={className}
      style={style}
      src={applyYoutubeEmbedPlaybackParams(src)}
      title="YouTube"
      allow={IFRAME_ALLOW}
      allowFullScreen
    />
  );
}

/* בר פקדים — overlay תחתון */
function ControlBar({ playing, muted, onTogglePlay, onUnmute,
                      currentSec, durationSec, scrubVal,
                      onScrubDown, onScrub,
                      volume, onVolume }) {
  const isLive = durationSec <= 0;

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 15,
      background: 'linear-gradient(transparent, rgba(0,0,0,0.88) 60%)',
      padding: '28px 12px 10px',
      display: 'flex', flexDirection: 'column', gap: 5,
      direction: 'ltr',
    }}>
      {/* שורה 1: ▶ + seek + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={muted ? onUnmute : onTogglePlay}
          aria-label={muted ? 'הפעל שמע' : playing ? 'השהה' : 'נגן'}
          style={{
            background: 'none', border: 'none', color: '#fff',
            fontSize: '1rem', cursor: 'pointer', padding: '0 4px',
            flexShrink: 0, lineHeight: 1,
          }}
        >
          {muted ? '🔇' : playing ? '❚❚' : '▶'}
        </button>

        <input
          type="range"
          min={0} max={Math.max(durationSec, 0.01)} step={0.25}
          value={scrubVal}
          onPointerDown={onScrubDown}
          onChange={onScrub}
          disabled={isLive || muted}
          aria-label="מיקום בקטע"
          style={{
            flex: 1, accentColor: '#ef4444',
            cursor: isLive || muted ? 'default' : 'pointer',
            height: 4, direction: 'ltr',
          }}
        />

        <span style={{
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)',
          fontWeight: 600, flexShrink: 0, minWidth: isLive ? 28 : 82,
          textAlign: 'center', fontVariantNumeric: 'tabular-nums',
        }}>
          {isLive ? <span style={{ color: '#ef4444', fontWeight: 800 }}>● LIVE</span>
                  : `${formatTime(scrubVal)} / ${formatTime(durationSec)}`}
        </span>
      </div>

      {/* שורה 2: 🔊 volume */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          onClick={muted ? onUnmute : undefined}
          style={{ fontSize: '0.88rem', flexShrink: 0, cursor: muted ? 'pointer' : 'default' }}
        >
          {muted ? '🔇' : volume === 0 ? '🔈' : '🔊'}
        </span>
        <input
          type="range"
          min={0} max={100} step={1}
          value={muted ? 0 : volume}
          onChange={muted ? undefined : onVolume}
          disabled={muted}
          aria-label="עוצמת שמע"
          style={{
            flex: 1, accentColor: '#ef4444',
            cursor: muted ? 'not-allowed' : 'pointer',
            height: 4, direction: 'ltr', opacity: muted ? 0.4 : 1,
          }}
        />
        <span style={{
          fontSize: '0.7rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.7)',
          flexShrink: 0, minWidth: 32, textAlign: 'center',
        }}>
          {muted ? '—' : `${volume}%`}
        </span>
      </div>

      {/* כפתור אנמוט מפורש אם עדיין מושתק */}
      {muted && (
        <button
          type="button"
          onClick={onUnmute}
          style={{
            alignSelf: 'center', marginTop: 2,
            padding: '5px 16px', borderRadius: 20,
            border: '1.5px solid rgba(251,191,36,0.7)',
            background: 'rgba(0,0,0,0.7)',
            color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          🔊 הפעל שמע
        </button>
      )}
    </div>
  );
}

export default function YoutubeTvPlayer({ ytTvUrl, className, style }) {
  const hostRef      = useRef(null);
  const playerRef    = useRef(null);
  const pollRef      = useRef(null);
  const scrubbingRef = useRef(false);

  const [apiFailed,     setApiFailed]     = useState(false);
  const [embedBlocked,  setEmbedBlocked]  = useState(false);
  const [muted,         setMuted]         = useState(true);
  const [playing,       setPlaying]       = useState(false);
  const [currentSec,    setCurrentSec]    = useState(0);
  const [durationSec,   setDurationSec]   = useState(0);
  const [scrubOverride, setScrubOverride] = useState(null);
  const [volume,        setVolume]        = useState(85);

  const videoId = youtubeEmbedVideoId(ytTvUrl);

  const stopPoll = useCallback(() => {
    if (pollRef.current != null) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPoll = useCallback(() => {
    stopPoll();
    pollRef.current = setInterval(() => {
      if (scrubbingRef.current) return;
      const pl = playerRef.current;
      if (!pl?.getCurrentTime) return;
      try {
        const c = pl.getCurrentTime();
        const d = pl.getDuration();
        if (Number.isFinite(c)) setCurrentSec(c);
        if (Number.isFinite(d) && d > 0) setDurationSec(d);
      } catch { /* ignore */ }
    }, 250);
  }, [stopPoll]);

  /* pointer-up → end scrub */
  useEffect(() => {
    const end = () => {
      if (!scrubbingRef.current) return;
      scrubbingRef.current = false;
      setScrubOverride(null);
    };
    window.addEventListener('pointerup',     end, true);
    window.addEventListener('pointercancel', end, true);
    return () => {
      window.removeEventListener('pointerup',     end, true);
      window.removeEventListener('pointercancel', end, true);
    };
  }, []);

  /* init player */
  useLayoutEffect(() => {
    if (!ytTvUrl || !videoId) {
      setApiFailed(false); setEmbedBlocked(false);
      setMuted(true); setPlaying(false);
      setCurrentSec(0); setDurationSec(0); setScrubOverride(null);
      stopPoll();
      return undefined;
    }

    const el = hostRef.current;
    if (!el) return undefined;

    let cancelled = false;
    setApiFailed(false); setEmbedBlocked(false);
    setMuted(true); setPlaying(false);
    setCurrentSec(0); setDurationSec(0); setScrubOverride(null);
    stopPoll();

    ensureYoutubeIframeAPI()
      .then(() => {
        if (cancelled || !hostRef.current) return;
        if (!window.YT?.Player) { setApiFailed(true); return; }
        try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
        playerRef.current = null;
        el.innerHTML = '';

        const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
        playerRef.current = new window.YT.Player(el, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1, mute: 1, playsinline: 1, enablejsapi: 1,
            rel: 0, modestbranding: 1, controls: 0,
            ...(origin ? { origin } : {}),
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              try { e.target.playVideo(); } catch { /* ignore */ }
              try {
                const d = e.target.getDuration();
                if (Number.isFinite(d) && d > 0) setDurationSec(d);
              } catch { /* ignore */ }
              if (!cancelled) startPoll();
            },
            onStateChange: (e) => {
              if (cancelled) return;
              const YT = window.YT;
              if (!YT) return;
              setPlaying(e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING);
            },
            onError: (e) => {
              if (cancelled) return;
              /* 101/150 = הטמעה חסומה ע"י הבעלים */
              if (e.data === 101 || e.data === 150) setEmbedBlocked(true);
              else setApiFailed(true);
            },
          },
        });
      })
      .catch(() => { if (!cancelled) setApiFailed(true); });

    return () => {
      cancelled = true;
      stopPoll();
      try { playerRef.current?.destroy?.(); } catch { /* ignore */ }
      playerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = '';
    };
  }, [ytTvUrl, videoId, startPoll, stopPoll]);

  const handleUnmute = useCallback(() => {
    const pl = playerRef.current;
    if (!pl) return;
    try { pl.unMute(); pl.setVolume(volume); setMuted(false); } catch { /* ignore */ }
  }, [volume]);

  const togglePlay = useCallback(() => {
    const pl = playerRef.current;
    if (!pl?.getPlayerState) return;
    const YT = window.YT;
    if (!YT) return;
    const st = pl.getPlayerState();
    if (st === YT.PlayerState.PLAYING) pl.pauseVideo();
    else pl.playVideo();
  }, []);

  const onScrubDown = useCallback(() => {
    scrubbingRef.current = true;
    setScrubOverride(currentSec);
  }, [currentSec]);

  const onScrub = useCallback((e) => {
    const pl = playerRef.current;
    if (!pl?.seekTo) return;
    const v = Number(e.target.value);
    if (!Number.isFinite(v)) return;
    setScrubOverride(v);
    try { pl.seekTo(Math.max(0, v), true); } catch { /* ignore */ }
  }, []);

  const onVolume = useCallback((e) => {
    const v = Number(e.target.value);
    if (!Number.isFinite(v)) return;
    setVolume(v);
    try { playerRef.current?.setVolume?.(v); } catch { /* ignore */ }
  }, []);

  if (!ytTvUrl) return null;

  /* הטמעה חסומה — הצג הודעה עם קישור לצפייה ישירה */
  if (embedBlocked) {
    const watchUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : ytTvUrl;
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#000', gap: 12, padding: 20, textAlign: 'center',
        ...style,
      }} className={className}>
        <span style={{ fontSize: '2rem' }}>🚫</span>
        <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.9rem' }}>
          הסרטון חסום להטמעה
        </span>
        <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
          הבעלים אינם מאפשרים הפעלה מוטמעת
        </span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginTop: 4, padding: '8px 20px', borderRadius: 10,
            background: 'rgba(251,191,36,0.15)',
            border: '1.5px solid rgba(251,191,36,0.55)',
            color: '#fbbf24', fontSize: '0.82rem', fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          ▶ פתח ב-YouTube ↗
        </a>
      </div>
    );
  }

  if (!videoId || apiFailed) {
    return <FallbackIframe src={ytTvUrl} className={className} style={style} />;
  }

  const rangeMax = Math.max(durationSec, 0.01);
  const baseVal  = Math.min(Math.max(0, currentSec), rangeMax);
  const scrubVal = scrubOverride != null ? Math.min(Math.max(0, scrubOverride), rangeMax) : baseVal;

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#000', ...style }}
      className={className}
    >
      {/* נגן */}
      <div ref={hostRef} style={{ width: '100%', height: '100%' }} />

      {/* overlay unmute (לפני אינטרקציה ראשונה) */}
      {muted && !playing && (
        <div
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 18, background: 'rgba(0,0,0,0.4)', cursor: 'pointer',
          }}
          onClick={handleUnmute}
        >
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            padding: '18px 32px', background: 'rgba(0,0,0,0.82)',
            border: '2px solid rgba(251,191,36,0.7)', borderRadius: 16,
            color: '#fff', direction: 'rtl',
          }}>
            <span style={{ fontSize: '2.2rem' }}>🔊</span>
            <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1rem' }}>לחץ להפעלת שמע</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>הדפדפן מחייב אישור ראשוני</span>
          </div>
        </div>
      )}

      {/* סרגל פקדים — תמיד גלוי בתחתית */}
      <ControlBar
        playing={playing}
        muted={muted}
        onTogglePlay={togglePlay}
        onUnmute={handleUnmute}
        currentSec={currentSec}
        durationSec={durationSec}
        scrubVal={scrubVal}
        onScrubDown={onScrubDown}
        onScrub={onScrub}
        volume={volume}
        onVolume={onVolume}
      />
    </div>
  );
}
