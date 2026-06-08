import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loadPreferences,
  savePreferences,
  applyPreferencesToDocument,
  DEFAULT_PREFERENCES,
} from '../lib/appPreferences.js';

function ToggleRow({ id, label, description, checked, onChange, disabled }) {
  return (
    <label
      htmlFor={id}
      className="settings-row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '16px 18px',
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.03)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 4 }}>{label}</span>
        {description && (
          <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45 }}>{description}</span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="settings-toggle"
        style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2, accentColor: 'var(--accent)' }}
      />
    </label>
  );
}

function SliderRow({ label, description, value, min, max, step, unit, onChange }) {
  return (
    <div style={{
      padding: '16px 18px',
      borderRadius: 14,
      border: '1px solid var(--border)',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent)', minWidth: 48, textAlign: 'left', direction: 'ltr' }}>
          {value}{unit}
        </span>
      </div>
      {description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45, margin: '0 0 10px' }}>{description}</p>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  // savedPrefs = what's actually persisted; draft = live preview state
  const savedPrefsRef = useRef(loadPreferences());
  const [draft, setDraft] = useState(() => ({
    ...savedPrefsRef.current,
    fontSize: savedPrefsRef.current.fontSize ?? 16,
    bgIntensity: savedPrefsRef.current.bgIntensity ?? 100,
  }));
  const [isDirty, setIsDirty] = useState(false);
  const [savedConfirm, setSavedConfirm] = useState(false);
  const confirmTimerRef = useRef(null);

  // Apply live preview whenever draft changes
  useEffect(() => {
    applyPreferencesToDocument(draft);
    // Live font size preview
    document.documentElement.style.fontSize = draft.fontSize + 'px';
    // Live background intensity preview
    document.documentElement.style.setProperty('--bg-intensity', draft.bgIntensity / 100);
  }, [draft]);

  function patch(partial) {
    setDraft(prev => ({ ...prev, ...partial }));
    setIsDirty(true);
  }

  function handleSave() {
    const toSave = { ...draft };
    savedPrefsRef.current = toSave;
    savePreferences(toSave);
    setIsDirty(false);
    setSavedConfirm(true);
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => setSavedConfirm(false), 2800);
  }

  function handleCancel() {
    const reverted = {
      ...savedPrefsRef.current,
      fontSize: savedPrefsRef.current.fontSize ?? 16,
      bgIntensity: savedPrefsRef.current.bgIntensity ?? 100,
    };
    setDraft(reverted);
    setIsDirty(false);
  }

  function resetAll() {
    const defaults = {
      ...DEFAULT_PREFERENCES,
      fontSize: 16,
      bgIntensity: 100,
    };
    setDraft(defaults);
    setIsDirty(true);
  }

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  return (
    <div className="page page-no-nav" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="סגירה וחזרה לדף הקודם"
        style={{
          position: 'absolute', top: 14, left: 12, zIndex: 10,
          width: 36, height: 36, borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--card2)',
          color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, transition: 'background 0.2s, color 0.2s, border-color 0.2s',
        }}
      >✕</button>
      <style>{`
        .settings-page h2 {
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin: 28px 0 8px;
        }
        .settings-page h2:first-of-type { margin-top: 8px; }
        .settings-page .section-desc {
          font-size: 0.82rem;
          color: var(--muted);
          margin: 0 0 12px;
          line-height: 1.5;
        }
        .settings-seg {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 4px 0 8px;
        }
        .settings-seg button {
          flex: 1;
          min-width: 88px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.88rem;
          font-family: var(--font-sans);
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .settings-seg button[aria-pressed="true"] {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--text);
        }
        .settings-seg button:hover:not([aria-pressed="true"]) {
          background: rgba(255,255,255,0.08);
          color: var(--text);
        }
        .settings-save-bar {
          position: sticky;
          bottom: 0;
          z-index: 20;
          background: var(--bg, #0f0f13);
          border-top: 1px solid var(--border);
          padding: 14px 0 16px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .settings-save-bar .btn-save {
          flex: 1;
          padding: 12px 20px;
          border-radius: 12px;
          border: none;
          background: var(--accent, #6c63ff);
          color: #fff;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
        }
        .settings-save-bar .btn-save:disabled {
          opacity: 0.35;
          cursor: default;
        }
        .settings-save-bar .btn-save:not(:disabled):active { transform: scale(0.97); }
        .settings-save-bar .btn-cancel {
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .settings-save-bar .btn-cancel:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text);
        }
        .settings-save-bar .btn-cancel:disabled {
          opacity: 0.35;
          cursor: default;
        }
        .save-confirm {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4caf50;
          font-weight: 700;
          font-size: 0.92rem;
          animation: fadeInUp 0.3s ease;
          white-space: nowrap;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="container settings-page" style={{ maxWidth: 520, paddingBottom: 20 }}>
        <p style={{ marginBottom: 20 }}>
          <button type="button" className="ui-back-button" onClick={() => navigate('/')}>
            ← חזרה
          </button>
        </p>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, letterSpacing: '0.02em' }}>הגדרות</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8, fontSize: '0.95rem' }}>
          התאמות נפוצות לנוחות, נגישות ומראה. השינויים מוצגים בזמן אמת — לחץ <strong>שמור</strong> כדי לשמור אותם לצמיתות.
        </p>

        {/* ─── נגישות ─── */}
        <h2>נגישות</h2>
        <p className="section-desc">הגדרות שמסייעות לשימוש נוח יותר ומפחיתות עומס חזותי.</p>
        <ToggleRow
          id="pref-motion"
          label="הפחתת תנועה ואנימציה"
          description="מקצר מעברים ומבטל אנימציות — מומלץ לרגישות לתנועה או למכשירים חלשים."
          checked={draft.reduceMotion}
          onChange={v => patch({ reduceMotion: v })}
        />

        {/* ─── תצוגה ─── */}
        <h2>תצוגה</h2>
        <p className="section-desc">שלוט על גודל הטקסט, עוצמת הרקע ומראה כללי של הממשק.</p>

        <div style={{ marginBottom: 12 }}>
          <SliderRow
            label="גודל טקסט"
            description="גרור לשינוי מיידי — תראה את ההשפעה ישירות בדף זה."
            value={draft.fontSize}
            min={12}
            max={22}
            step={1}
            unit="px"
            onChange={v => patch({ fontSize: v })}
          />
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 8 }}>סגנון גודל טקסט מהיר</p>
        <div className="settings-seg" role="group" aria-label="גודל טקסט">
          {[
            { id: 'normal', label: 'רגיל' },
            { id: 'large', label: 'גדול' },
            { id: 'xlarge', label: 'גדול מאוד' },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={draft.fontScale === id}
              onClick={() => patch({ fontScale: id })}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <SliderRow
            label="עוצמת רקע"
            description="מפחית את עוצמת הגרדיאנטים ברקע לחוויה שקטה יותר."
            value={draft.bgIntensity}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={v => patch({ bgIntensity: v })}
          />
        </div>

        <ToggleRow
          id="pref-calm"
          label="רקע נקי יותר"
          description="מחליש גרדיאנטים ברקע לשקט ויזואלי ולקריאות טובה יותר."
          checked={draft.calmBackground}
          onChange={v => patch({ calmBackground: v })}
        />

        {/* ─── סאונד ─── */}
        <h2>סאונד</h2>
        <p className="section-desc">שליטה על אפקטים קוליים של הממשק (כשיהיו זמינים בעתיד).</p>
        <ToggleRow
          id="pref-sound"
          label="צלילי ממשק"
          description="כשיופעלו אפקטים קוליים קלים בפעולות — ההעדפה כבר נשמרת."
          checked={draft.uiSounds}
          onChange={v => patch({ uiSounds: v })}
        />

        {/* ─── איפוס ─── */}
        <h2>איפוס</h2>
        <p className="section-desc">מחזיר את כל ההגדרות לערכי ברירת המחדל המקוריים.</p>
        <button type="button" className="btn btn-ghost" onClick={resetAll} style={{ marginTop: 4 }}>
          איפוס כל ההגדרות לברירת מחדל
        </button>

        {/* ─── שורת שמירה קבועה ─── */}
        <div className="settings-save-bar">
          {savedConfirm && (
            <span className="save-confirm">
              <span style={{ fontSize: '1.1rem' }}>✓</span>
              הגדרות נשמרו!
            </span>
          )}
          <button
            type="button"
            className="btn-cancel"
            onClick={handleCancel}
            disabled={!isDirty}
            aria-label="בטל שינויים וחזור להגדרות השמורות"
          >
            בטל
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleSave}
            disabled={!isDirty}
            aria-label="שמור את כל ההגדרות"
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}
