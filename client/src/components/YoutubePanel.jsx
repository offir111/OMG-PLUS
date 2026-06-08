import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore.js';
import { YOUTUBE_PANEL_BY_KEY } from '../data/youtubePanelData.js';
import { youtubeEmbedIdFromClip } from '../lib/youtubeEmbedId.js';
import {
  loadYoutubePanelOverrides,
  mergeYoutubePanelWithOverrides,
  saveYoutubePanelOverrides,
} from '../utils/youtubePanelStorage.js';
import HomeLiveListenTransport from './HomeLiveListenTransport.jsx';
import './headerPodcastPanel.css';

const YT_PANEL_TAB_KEYS = ['faith-1', 'faith-2', 'faith-3', 'atheism-1', 'atheism-2', 'atheism-3'];

function entryHasListenSource(entry) {
  if (!entry) return false;
  if (String(entry.listenAudioUrl || '').trim()) return true;
  return Boolean(
    youtubeEmbedIdFromClip({
      youtubeId: entry.listenYoutubeId,
      watchUrl: entry.listenYoutubeUrl,
    }),
  );
}

export default function YoutubePanel() {
  const user        = useAppStore(s => s.user);
  const pendingUser = useAppStore(s => s.pendingUser);
  const panelOpen   = useAppStore(s => s.youtubePanelOpen);
  const closePanel  = useAppStore(s => s.closeYoutubePanel);
  const miniMediaBarOpen = useAppStore(s => s.miniMediaBarOpen);

  const [playingKey,       setPlayingKey]       = useState(null);
  const blockUntilRef                           = useRef(0);
  const [overrides,        setOverrides]        = useState(() => loadYoutubePanelOverrides());
  const [editDraft,        setEditDraft]        = useState({ audio: '', yid: '', yurl: '', tabLabel: '' });
  const [editorShellOpen,  setEditorShellOpen]  = useState(false);
  const [editorTabKey,     setEditorTabKey]     = useState('faith-1');
  const panelRef = useRef(null);

  const hasSession = Boolean(user || pendingUser);

  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;
    if (!hasSession || !panelOpen) {
      root.classList.remove('header-podcast-panel-open');
      root.style.removeProperty('--header-podcast-panel-reserved-h');
      return undefined;
    }
    const el = panelRef.current;
    if (!el) return undefined;
    root.classList.add('header-podcast-panel-open');
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      root.style.setProperty('--header-podcast-panel-reserved-h', `${h}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.classList.remove('header-podcast-panel-open');
      root.style.removeProperty('--header-podcast-panel-reserved-h');
    };
  }, [hasSession, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return undefined;
    blockUntilRef.current = Date.now() + 420;
    return undefined;
  }, [panelOpen]);

  useEffect(() => {
    if (!panelOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen, closePanel]);

  const mergedByKey = useMemo(
    () => mergeYoutubePanelWithOverrides(YOUTUBE_PANEL_BY_KEY, overrides),
    [overrides],
  );
  const mergedRef = useRef(mergedByKey);
  mergedRef.current = mergedByKey;

  const sessionNorm = user?.username?.trim().toLowerCase() || pendingUser?.username?.trim().toLowerCase() || '';
  const isOmgEditor = sessionNorm === 'omg';

  useEffect(() => {
    const e = mergedByKey[editorTabKey];
    if (!e) return;
    setEditDraft({
      audio:    String(e.listenAudioUrl   ?? ''),
      yid:      String(e.listenYoutubeId  ?? ''),
      yurl:     String(e.listenYoutubeUrl ?? ''),
      tabLabel: String(e.tabLabel         ?? ''),
    });
  }, [editorTabKey, mergedByKey]);

  useLayoutEffect(() => {
    if (!playingKey) return;
    if (!entryHasListenSource(mergedByKey[playingKey])) setPlayingKey(null);
  }, [playingKey, mergedByKey]);

  const transport = useMemo(() => {
    if (!playingKey) return { direct: '', youtubeVideoId: '' };
    const ent = mergedByKey[playingKey];
    if (!ent) return { direct: '', youtubeVideoId: '' };
    const direct = String(ent.listenAudioUrl || '').trim();
    if (direct) return { direct, youtubeVideoId: '' };
    const id = youtubeEmbedIdFromClip({ youtubeId: ent.listenYoutubeId, watchUrl: ent.listenYoutubeUrl });
    if (!id) return { direct: '', youtubeVideoId: '' };
    return { direct: '', youtubeVideoId: id };
  }, [playingKey, mergedByKey]);

  function toggleTabListen(tabKey) {
    setPlayingKey(prev => {
      if (prev === tabKey) return null;
      if (!entryHasListenSource(mergedRef.current[tabKey])) return prev;
      return tabKey;
    });
  }

  function handleTabPress(tabKey) {
    if (Date.now() < blockUntilRef.current) return;
    toggleTabListen(tabKey);
  }

  function persistEdit() {
    const tabKey = editorTabKey;
    const next = { ...overrides };
    const audio = editDraft.audio.trim();
    const yid   = editDraft.yid.trim();
    const yurl  = editDraft.yurl.trim();
    const tabLabel = editDraft.tabLabel.trim();
    if (!audio && !yid && !yurl) delete next[tabKey];
    else {
      next[tabKey] = {
        listenAudioUrl:   audio,
        listenYoutubeId:  yid,
        listenYoutubeUrl: yurl,
        ...(tabLabel ? { tabLabel } : {}),
      };
    }
    saveYoutubePanelOverrides(next);
    setOverrides(next);
    if (playingKey === tabKey) setPlayingKey(null);
    setEditorShellOpen(false);
  }

  function clearEdit() {
    const tabKey = editorTabKey;
    const next = { ...overrides };
    delete next[tabKey];
    saveYoutubePanelOverrides(next);
    setOverrides(next);
    setEditDraft({ audio: '', yid: '', yurl: '', tabLabel: '' });
    if (playingKey === tabKey) setPlayingKey(null);
  }

  const topOffset = miniMediaBarOpen
    ? 'calc(var(--shell-top) + var(--mini-media-bar-top-gap) + var(--mini-radio-h))'
    : 'var(--shell-top)';

  if (!hasSession || !panelOpen) return null;

  return (
    <div ref={panelRef} className="header-podcast-panel" style={{ top: topOffset }} role="region" aria-label="יוטיוב">
      <div className="header-podcast-panel__inner">
        <div className="home-live-broadcast-block">

          {isOmgEditor && editorShellOpen ? (
            <div className="home-live-omg-editor-shell">
              <div className="home-live-omg-editor-tab-row">
                <label htmlFor="yt-panel-tab-select">טאב לעריכה</label>
                <select
                  id="yt-panel-tab-select"
                  className="home-live-omg-editor-tab-select"
                  value={editorTabKey}
                  onChange={e => setEditorTabKey(e.target.value)}
                >
                  {YT_PANEL_TAB_KEYS.map(k => {
                    const m = mergedByKey[k];
                    const opt = (m?.tabLabel && String(m.tabLabel).trim()) || YOUTUBE_PANEL_BY_KEY[k]?.title || k;
                    return <option key={k} value={k}>{opt}</option>;
                  })}
                </select>
              </div>
              <div className="home-live-omg-editor">
                <p className="home-live-omg-editor-title">לינקי שמע / יוטיוב לטאב הנבחר</p>
                <p className="home-live-omg-editor-note">שמירה מקומית בלבד (localStorage).</p>
                <div className="home-live-omg-editor-field">
                  <label htmlFor="yt-panel-audio-url">קישור שמע ישיר (mp3, m4a…)</label>
                  <input id="yt-panel-audio-url" type="url" autoComplete="off"
                    placeholder="https://…/הרצאה.mp3"
                    value={editDraft.audio}
                    onChange={e => setEditDraft(d => ({ ...d, audio: e.target.value }))} />
                </div>
                <div className="home-live-omg-editor-field">
                  <label htmlFor="yt-panel-yt-id">מזהה YouTube (אופציונלי)</label>
                  <input id="yt-panel-yt-id" type="text" autoComplete="off"
                    placeholder="למשל dQw4w9WgXcQ"
                    value={editDraft.yid}
                    onChange={e => setEditDraft(d => ({ ...d, yid: e.target.value }))} />
                </div>
                <div className="home-live-omg-editor-field">
                  <label htmlFor="yt-panel-yt-url">או קישור YouTube מלא</label>
                  <input id="yt-panel-yt-url" type="url" autoComplete="off"
                    placeholder="https://www.youtube.com/watch?v=…"
                    value={editDraft.yurl}
                    onChange={e => setEditDraft(d => ({ ...d, yurl: e.target.value }))} />
                </div>
                {entryHasListenSource({ listenAudioUrl: editDraft.audio, listenYoutubeId: editDraft.yid, listenYoutubeUrl: editDraft.yurl }) ? (
                  <div className="home-live-omg-editor-field">
                    <label htmlFor="yt-panel-tab-label">שם על הטאב</label>
                    <input id="yt-panel-tab-label" type="text" autoComplete="off"
                      placeholder="שם הערוץ / הרצאה"
                      maxLength={48}
                      value={editDraft.tabLabel}
                      onChange={e => setEditDraft(d => ({ ...d, tabLabel: e.target.value }))} />
                  </div>
                ) : null}
                <div className="home-live-omg-editor-actions">
                  <button type="button" className="home-live-omg-save" onClick={persistEdit}>שמירה</button>
                  <button type="button" className="home-live-omg-danger" onClick={clearEdit}>ניקוי</button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="home-live-broadcast-grid" dir="rtl" aria-label="יוטיוב — האזנה">
            <div className="home-live-grid-header">
              <span className="home-live-broadcast-label">יוטיוב</span>
              {isOmgEditor ? (
                <button type="button" className="home-live-omg-edit-link"
                  onClick={() => setEditorShellOpen(v => !v)}
                  aria-expanded={editorShellOpen}>
                  {editorShellOpen ? 'סגירה' : 'עריכה'}
                </button>
              ) : null}
              <button
                type="button"
                className="header-podcast-panel__close header-podcast-panel__close--in-tab-row"
                onClick={closePanel}
                aria-label="סגור יוטיוב"
                title="סגור"
              >×</button>
            </div>

            {/* שורה 1 */}
            <div className="home-live-tabs-row" role="list">
              {[1, 2, 3].map(slot => {
                const tabKey = `faith-${slot}`;
                const ent    = mergedByKey[tabKey];
                const label  = String(ent?.tabLabel || '').trim() || (slot === 1 ? 'ערוץ 1' : `ערוץ ${slot}`);
                return (
                  <button key={tabKey} type="button" role="listitem"
                    className={`home-live-tab home-live-tab--faith${playingKey === tabKey ? ' home-live-tab--selected' : ''}`}
                    aria-pressed={playingKey === tabKey}
                    onClick={() => handleTabPress(tabKey)}>
                    {playingKey === tabKey ? '⏸ ' : '▶ '}{label}
                  </button>
                );
              })}
            </div>

            {/* שורה 2 */}
            <div className="home-live-tabs-row" role="list">
              {[1, 2, 3].map(slot => {
                const tabKey = `atheism-${slot}`;
                const ent    = mergedByKey[tabKey];
                const label  = String(ent?.tabLabel || '').trim() || (slot === 1 ? 'ערוץ 4' : `ערוץ ${slot + 3}`);
                return (
                  <button key={tabKey} type="button" role="listitem"
                    className={`home-live-tab home-live-tab--atheism${playingKey === tabKey ? ' home-live-tab--selected' : ''}`}
                    aria-pressed={playingKey === tabKey}
                    onClick={() => handleTabPress(tabKey)}>
                    {playingKey === tabKey ? '⏸ ' : '▶ '}{label}
                  </button>
                );
              })}
            </div>
          </div>

          {playingKey && (transport.direct || transport.youtubeVideoId) ? (
            <HomeLiveListenTransport
              key={playingKey}
              tabKey={playingKey}
              directUrl={transport.direct}
              youtubeVideoId={transport.youtubeVideoId}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
