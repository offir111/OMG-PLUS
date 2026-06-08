import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { useRadioAudioElement, useRadioState, proxyUrl } from '../context/RadioAudioContext.jsx';

// ─── Station definitions with emoji, genre, and real stream URLs ───────────────
const STATIONS = [
  {
    id: 'galgalatz',
    name: 'גלגלץ',
    emoji: '🎵',
    genre: 'פופ / היטס',
    streamUrl: 'https://radiokan.streamgates.net/kan88/mp3/icecast.audio',
  },
  {
    id: 'kan-gimmel',
    name: 'כאן גימל',
    emoji: '📻',
    genre: 'קלאסי / תרבות',
    streamUrl: 'https://kan24.streamgates.net/kangimmel/mp3/icecast.audio',
  },
  {
    id: 'radio103',
    name: '103FM',
    emoji: '🔥',
    genre: 'רוק / אלטרנטיב',
    streamUrl: 'https://cdn.cybercdn.live/103FM/Live/icecast.audio',
  },
  {
    id: 'telaviv102',
    name: 'רדיו תל אביב',
    emoji: '🌊',
    genre: 'ויבס תל אביב',
    streamUrl: 'https://102fm.streamgates.net/102fm/mp3/icecast.audio',
  },
  {
    id: 'kol-berama',
    name: 'קול ברמה',
    emoji: '🕍',
    genre: 'דתי / מסורתי',
    streamUrl: 'https://kolberama.streamgates.net/KolBerama/mp3/icecast.audio',
  },
  {
    id: 'radius100',
    name: '88FM',
    emoji: '🎶',
    genre: 'ורייטי',
    streamUrl: 'https://100fm.streamgates.net/100Fm/mp3/icecast.audio',
  },
  {
    id: 'radio-arab',
    name: 'רדיו ערב',
    emoji: '🌍',
    genre: 'מוזיקה ערבית',
    streamUrl: 'https://stream.zeno.fm/yn65dy0gevzuv',
  },
  {
    id: 'radio-gitara',
    name: 'רדיו גיטרה',
    emoji: '🎸',
    genre: 'רוק',
    streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
  },
  {
    id: 'radio90',
    name: 'רדיו 90',
    emoji: '💫',
    genre: 'שנות ה-90',
    streamUrl: 'https://stream.zeno.fm/6a0vkqkmdg8uv',
  },
  {
    id: 'jazz-fm',
    name: 'Jazz FM',
    emoji: '🎺',
    genre: 'ג\'אז',
    streamUrl: 'https://stream.zeno.fm/ymz2w0ekmdg8uv',
  },
  {
    id: 'radio-bait',
    name: 'רדיו בית',
    emoji: '🏠',
    genre: 'רדיו משפחתי',
    streamUrl: 'https://stream.zeno.fm/vy6asnekmdg8uv',
  },
  {
    id: 'eco99',
    name: 'ECO99FM',
    emoji: '⚡',
    genre: 'פופ',
    streamUrl: 'https://eco99fm.streamgates.net/Eco99fm/mp3/icecast.audio',
  },
  {
    id: 'kan-main',
    name: 'רדיו כאן',
    emoji: '🌺',
    genre: 'שידור ציבורי',
    streamUrl: 'https://radiokan.streamgates.net/kankan/mp3/icecast.audio',
  },
  {
    id: 'radio104',
    name: '104FM',
    emoji: '🎤',
    genre: 'היטס',
    streamUrl: 'https://stream.zeno.fm/r0uu6tq3g28uv',
  },
  {
    id: 'radio-layla',
    name: 'רדיו לילה',
    emoji: '🌙',
    genre: 'רדיו לילה',
    streamUrl: 'https://stream.zeno.fm/vp3ub1ekmdg8uv',
  },
];

const ALL_GENRES = ['הכל', ...Array.from(new Set(STATIONS.map(s => s.genre)))];
const LS_FAVS = 'omg_radio_favs_v2';

function readFavs() {
  try {
    const v = localStorage.getItem(LS_FAVS);
    if (v) return new Set(JSON.parse(v));
  } catch {}
  return new Set();
}
function saveFavs(set) {
  try { localStorage.setItem(LS_FAVS, JSON.stringify([...set])); } catch {}
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function RadioPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const audioEl = useRadioAudioElement();
  const radioCtx = useRadioState();
  const {
    stationId: ctxStationId,
    setStationId: ctxSetStationId,
    volume,
    setVolume,
    apiLoading,
    setRadioActive,
  } = radioCtx ?? {};

  // Local state — which station is active in this page's UI
  const [activeId, setActiveId]     = useState(ctxStationId ?? STATIONS[0].id);
  const [playing, setPlaying]       = useState(false);
  const [streamError, setStreamError] = useState('');
  const [genre, setGenre]           = useState('הכל');
  const [favs, setFavs]             = useState(readFavs);
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const playGenRef = useRef(0);
  const radioAutoplayConsumedRef = useRef(false);

  // Keep playing state in sync with the global audio element
  const syncPlaying = useCallback(() => {
    setPlaying(Boolean(audioEl && !audioEl.paused));
  }, [audioEl]);

  useEffect(() => {
    if (!audioEl) return;
    setPlaying(!audioEl.paused);
  }, [audioEl]);

  useEffect(() => {
    const a = audioEl;
    if (!a) return;
    const onErr = () => {
      if (!a.getAttribute('data-radio-src')) return;
      setStreamError('לא ניתן לטעון את הזרם — נסו תחנה אחרת.');
    };
    a.addEventListener('play',  syncPlaying);
    a.addEventListener('pause', syncPlaying);
    a.addEventListener('error', onErr);
    return () => {
      a.removeEventListener('play',  syncPlaying);
      a.removeEventListener('pause', syncPlaying);
      a.removeEventListener('error', onErr);
    };
  }, [audioEl, syncPlaying]);

  // ── Play a station ──────────────────────────────────────────────────
  const playStation = useCallback((station) => {
    const a = audioEl;
    if (!a || !station?.streamUrl) return;
    setStreamError('');
    setActiveId(station.id);
    ctxSetStationId?.(station.id, { fromUserPick: true });

    const gen = ++playGenRef.current;
    const src = proxyUrl(station.streamUrl);
    a.pause();
    a.src = src;
    a.setAttribute('data-radio-src', src);
    a.load();

    const fail = () => {
      if (gen !== playGenRef.current) return;
      setStreamError('לא ניתן לטעון את הזרם — נסו תחנה אחרת.');
    };

    const tryPlay = () => {
      if (gen !== playGenRef.current) return;
      a.play().catch(err => {
        if (import.meta.env.DEV) console.warn('[radio] play()', err?.name, err?.message);
        if (gen === playGenRef.current) fail();
      });
    };

    if (a.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      tryPlay();
      return;
    }

    let settled = false;
    const tid = window.setTimeout(() => {
      if (gen !== playGenRef.current || settled) return;
      settled = true; cleanup(); tryPlay();
    }, 14000);

    function cleanup() {
      clearTimeout(tid);
      a.removeEventListener('canplay',    onReady);
      a.removeEventListener('loadeddata', onReady);
      a.removeEventListener('error',      onErr2);
    }
    function onReady() {
      if (gen !== playGenRef.current || settled) return;
      settled = true; cleanup(); tryPlay();
    }
    function onErr2() {
      if (gen !== playGenRef.current || settled) return;
      settled = true; cleanup(); fail();
    }
    a.addEventListener('canplay',    onReady, { once: true });
    a.addEventListener('loadeddata', onReady, { once: true });
    a.addEventListener('error',      onErr2,  { once: true });
  }, [audioEl, ctxSetStationId]);

  const togglePlay = useCallback(() => {
    const a = audioEl;
    const station = STATIONS.find(s => s.id === activeId) ?? STATIONS[0];
    if (!a || !station?.streamUrl) return;
    setStreamError('');

    if (!a.paused) {
      playGenRef.current += 1;
      a.pause();
      return;
    }
    playStation(station);
  }, [audioEl, activeId, playStation]);

  // Autoplay from ?play=1 param
  useEffect(() => {
    if (searchParams.get('play') !== '1') {
      radioAutoplayConsumedRef.current = false;
      return;
    }
    if (!audioEl || apiLoading) return;
    if (radioAutoplayConsumedRef.current) return;
    radioAutoplayConsumedRef.current = true;
    const stripPlay = () => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('play');
        return next;
      }, { replace: true });
    };
    if (!audioEl.paused) { stripPlay(); return; }
    togglePlay();
    stripPlay();
  }, [searchParams, audioEl, apiLoading, togglePlay, setSearchParams]);

  // ── Favorites ───────────────────────────────────────────────────────
  const toggleFav = useCallback((id, e) => {
    e.stopPropagation();
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavs(next);
      return next;
    });
  }, []);

  // ── Filtered stations ───────────────────────────────────────────────
  const filteredStations = useMemo(() => {
    let list = STATIONS;
    if (showFavsOnly) list = list.filter(s => favs.has(s.id));
    if (genre !== 'הכל') list = list.filter(s => s.genre === genre);
    return list;
  }, [genre, favs, showFavsOnly]);

  const activeStation = STATIONS.find(s => s.id === activeId) ?? STATIONS[0];

  // ── Navigate back ───────────────────────────────────────────────────
  function handleClose() {
    if (audioEl) {
      audioEl.pause();
      setRadioActive?.(false);
    }
    const sessionUser = useAppStore.getState().user;
    const hasFullSession =
      Boolean(sessionUser?.username) &&
      (sessionUser.side === 'believer' || sessionUser.side === 'atheist');
    navigate(hasFullSession ? '/login?logo=nav' : '/login');
  }

  function handleMinimize() {
    setRadioActive?.(true);
    useAppStore.getState().openMiniMediaBar?.('radio');
  }

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .rp { direction:rtl; text-align:right; background:#0d0d14; min-height:100vh; padding:0 0 120px; box-sizing:border-box; font-family:inherit; }

        /* ── Header ── */
        .rp__header { display:flex; align-items:center; justify-content:space-between; padding:16px 18px 12px; background:rgba(13,13,20,.96); border-bottom:1px solid rgba(255,255,255,.08); position:sticky; top:0; z-index:20; backdrop-filter:blur(12px); }
        .rp__header-title { font-size:1.15rem; font-weight:900; color:#f4f4f8; display:flex; align-items:center; gap:8px; margin:0; }
        .rp__header-actions { display:flex; gap:8px; }
        .rp__icon-btn { width:36px; height:36px; border-radius:10px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:#c4c4d4; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:inherit; transition:background .15s,border-color .15s; }
        .rp__icon-btn:hover { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.28); color:#f1f5f9; }
        .rp__icon-btn--close:hover { background:rgba(248,113,113,.18); border-color:rgba(248,113,113,.4); color:#fecaca; }

        /* ── Genre chips ── */
        .rp__chips { display:flex; flex-wrap:nowrap; overflow-x:auto; gap:8px; padding:14px 18px 10px; scrollbar-width:none; }
        .rp__chips::-webkit-scrollbar { display:none; }
        .rp__chip { flex-shrink:0; padding:6px 14px; border-radius:20px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); color:#b4b4c0; font-size:.8rem; font-weight:700; cursor:pointer; font-family:inherit; transition:background .15s,border-color .15s,color .15s; white-space:nowrap; }
        .rp__chip:hover { background:rgba(255,255,255,.12); color:#e4e4f0; }
        .rp__chip--active { background:rgba(99,102,241,.28); border-color:rgba(99,102,241,.6); color:#c7d2fe; }
        .rp__chip--fav { background:rgba(251,191,36,.14); border-color:rgba(251,191,36,.4); color:#fde68a; }
        .rp__chip--fav.rp__chip--active { background:rgba(251,191,36,.28); border-color:rgba(251,191,36,.7); color:#fef08a; }

        /* ── Volume bar ── */
        .rp__vol-bar { display:flex; align-items:center; gap:12px; padding:0 18px 14px; }
        .rp__vol-label { font-size:.78rem; font-weight:800; color:#8a8a9a; white-space:nowrap; }
        .rp__vol-bar input[type=range] { flex:1; accent-color:#fbbf24; height:4px; cursor:pointer; }
        .rp__vol-pct { font-size:.82rem; font-weight:800; color:#fbbf24; min-width:34px; text-align:left; font-variant-numeric:tabular-nums; }

        /* ── Error ── */
        .rp__error { margin:0 18px 14px; padding:11px 14px; border-radius:10px; background:rgba(248,113,113,.12); border:1px solid rgba(248,113,113,.35); color:#fecaca; font-size:.85rem; font-weight:700; }

        /* ── Grid ── */
        .rp__grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; padding:4px 14px 6px; }
        @media (max-width:480px) { .rp__grid { grid-template-columns:repeat(2, 1fr); gap:10px; padding:4px 10px 6px; } }

        /* ── Station card ── */
        .rp__card { position:relative; border-radius:14px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.05); padding:14px 10px 12px; cursor:pointer; text-align:center; transition:background .18s,border-color .18s,transform .12s; overflow:hidden; display:flex; flex-direction:column; align-items:center; gap:6px; }
        .rp__card:hover { background:rgba(255,255,255,.1); border-color:rgba(255,255,255,.22); transform:translateY(-2px); }
        .rp__card--active { background:rgba(99,102,241,.18); border-color:rgba(99,102,241,.55); }
        .rp__card--active:hover { background:rgba(99,102,241,.26); }

        /* Playing pulse ring */
        .rp__card--active::before { content:''; position:absolute; inset:-1px; border-radius:15px; border:2px solid rgba(99,102,241,.7); animation:rp-pulse 1.8s ease-in-out infinite; pointer-events:none; }
        @keyframes rp-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(1.03); } }

        .rp__card-emoji { font-size:2rem; line-height:1; }
        .rp__card-name { font-size:.82rem; font-weight:800; color:#e4e4f0; line-height:1.3; word-break:break-word; }
        .rp__card--active .rp__card-name { color:#c7d2fe; }
        .rp__card-genre { font-size:.68rem; color:#7a7a8a; font-weight:700; }
        .rp__card--active .rp__card-genre { color:#a5b4fc; }

        /* Fav star */
        .rp__card-fav { position:absolute; top:7px; left:7px; background:none; border:none; font-size:.95rem; cursor:pointer; padding:2px; line-height:1; opacity:.45; transition:opacity .15s,transform .15s; }
        .rp__card-fav:hover { opacity:1; transform:scale(1.2); }
        .rp__card-fav--active { opacity:1; }

        /* Playing badge */
        .rp__card-badge { font-size:.6rem; font-weight:900; background:rgba(99,102,241,.8); color:#fff; border-radius:6px; padding:2px 6px; letter-spacing:.04em; }

        /* ── Empty state ── */
        .rp__empty { text-align:center; color:#5a5a6a; font-size:.9rem; padding:40px 20px; grid-column:1/-1; }

        /* ── Now Playing bar ── */
        .rp__nowplaying { position:fixed; bottom:0; left:0; right:0; z-index:50; background:rgba(13,13,20,.97); border-top:1px solid rgba(99,102,241,.35); backdrop-filter:blur(14px); padding:10px 16px 12px; display:flex; align-items:center; gap:12px; box-shadow:0 -4px 24px rgba(0,0,0,.5); }
        .rp__nowplaying-emoji { font-size:1.6rem; line-height:1; flex-shrink:0; }
        .rp__nowplaying-info { flex:1; min-width:0; }
        .rp__nowplaying-name { font-size:.9rem; font-weight:900; color:#e4e4f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .rp__nowplaying-genre { font-size:.72rem; color:#7a7a8a; font-weight:700; margin-top:1px; }
        .rp__nowplaying-status { display:flex; align-items:center; gap:6px; margin-top:2px; }
        .rp__nowplaying-dot { width:7px; height:7px; border-radius:50%; background:#6366f1; flex-shrink:0; }
        .rp__nowplaying-dot--live { animation:rp-dot-pulse 1.2s ease-in-out infinite; }
        @keyframes rp-dot-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.35; transform:scale(.7); } }
        .rp__nowplaying-live { font-size:.68rem; font-weight:900; color:#a5b4fc; letter-spacing:.08em; }
        .rp__nowplaying-ctrl { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .rp__play-btn { width:44px; height:44px; border-radius:50%; border:2px solid rgba(99,102,241,.6); background:rgba(99,102,241,.22); color:#c7d2fe; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:inherit; transition:background .15s,transform .12s; }
        .rp__play-btn:hover { background:rgba(99,102,241,.42); transform:scale(1.08); }
        .rp__play-btn:active { transform:scale(.95); }

        /* ── Section label ── */
        .rp__section-label { font-size:.72rem; font-weight:900; color:#5a5a6a; letter-spacing:.08em; text-transform:uppercase; padding:8px 18px 4px; }

        /* ── Divider ── */
        .rp__divider { height:1px; background:rgba(255,255,255,.07); margin:10px 18px; }
      `}</style>

      <div className="rp" aria-label="רדיו ישראל">

        {/* Header */}
        <header className="rp__header">
          <h1 className="rp__header-title">
            <span aria-hidden>📻</span> רדיו ישראל
          </h1>
          <div className="rp__header-actions">
            <button
              type="button"
              className="rp__icon-btn"
              onClick={handleMinimize}
              aria-label="מזעור — הרדיו ממשיך לנגן"
              title="מזעור"
            >−</button>
            <button
              type="button"
              className="rp__icon-btn rp__icon-btn--close"
              onClick={handleClose}
              aria-label="סגירה"
              title="סגירה"
            >×</button>
          </div>
        </header>

        {/* Genre filter chips */}
        <div className="rp__chips" role="group" aria-label="סינון לפי ז'אנר">
          <button
            type="button"
            className={`rp__chip rp__chip--fav${showFavsOnly ? ' rp__chip--active' : ''}`}
            onClick={() => setShowFavsOnly(v => !v)}
            aria-pressed={showFavsOnly}
          >
            ⭐ מועדפים
          </button>
          {ALL_GENRES.map(g => (
            <button
              key={g}
              type="button"
              className={`rp__chip${genre === g ? ' rp__chip--active' : ''}`}
              onClick={() => { setGenre(g); setShowFavsOnly(false); }}
              aria-pressed={genre === g}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="rp__divider" />

        {/* Volume control */}
        <div className="rp__vol-bar">
          <span className="rp__vol-label">🔊 עוצמה</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume ?? 0.85}
            onChange={e => setVolume?.(Number(e.target.value))}
            aria-label="עוצמת שמע"
          />
          <span className="rp__vol-pct" aria-live="polite">
            {Math.round((volume ?? 0.85) * 100)}%
          </span>
        </div>

        {/* Stream error */}
        {streamError && (
          <p className="rp__error" role="alert">{streamError}</p>
        )}

        {/* Section label */}
        <div className="rp__section-label">
          {showFavsOnly ? 'מועדפים' : genre === 'הכל' ? `כל התחנות — ${filteredStations.length}` : genre}
        </div>

        {/* Station grid */}
        <div className="rp__grid" role="list" aria-label="תחנות רדיו">
          {filteredStations.length === 0 && (
            <p className="rp__empty">
              {showFavsOnly ? 'אין מועדפים עדיין — לחצו ⭐ על תחנה' : 'אין תחנות בקטגוריה זו'}
            </p>
          )}
          {filteredStations.map(station => {
            const isActive = station.id === activeId && playing;
            const isFav = favs.has(station.id);
            return (
              <div
                key={station.id}
                className={`rp__card${isActive ? ' rp__card--active' : ''}`}
                role="listitem"
                onClick={() => {
                  if (station.id === activeId && playing) {
                    // pause current
                    playGenRef.current += 1;
                    audioEl?.pause();
                  } else {
                    playStation(station);
                  }
                }}
                aria-label={`${station.emoji} ${station.name}${isActive ? ' — מנגן' : ''}`}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click(); }}
              >
                {/* Fav button */}
                <button
                  type="button"
                  className={`rp__card-fav${isFav ? ' rp__card-fav--active' : ''}`}
                  onClick={e => toggleFav(station.id, e)}
                  aria-label={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                  title={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
                >
                  {isFav ? '⭐' : '☆'}
                </button>

                <span className="rp__card-emoji" aria-hidden>{station.emoji}</span>
                <span className="rp__card-name">{station.name}</span>
                <span className="rp__card-genre">{station.genre}</span>
                {isActive && <span className="rp__card-badge">LIVE</span>}
              </div>
            );
          })}
        </div>

      </div>

      {/* Now Playing bar — always shown at bottom */}
      <div className="rp__nowplaying" aria-live="polite" aria-label="נגן כעת">
        <span className="rp__nowplaying-emoji" aria-hidden>{activeStation.emoji}</span>
        <div className="rp__nowplaying-info">
          <div className="rp__nowplaying-name">{activeStation.name}</div>
          <div className="rp__nowplaying-genre">{activeStation.genre}</div>
          {playing && (
            <div className="rp__nowplaying-status">
              <span className={`rp__nowplaying-dot${playing ? ' rp__nowplaying-dot--live' : ''}`} aria-hidden />
              <span className="rp__nowplaying-live">LIVE</span>
            </div>
          )}
        </div>
        <div className="rp__nowplaying-ctrl">
          <button
            type="button"
            className="rp__play-btn"
            onClick={togglePlay}
            aria-label={playing ? 'השהה' : 'נגן'}
            title={playing ? 'השהה' : 'נגן'}
          >
            {playing ? '⏸' : '▶'}
          </button>
        </div>
      </div>
    </>
  );
}
