import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore, rehydrateUserIfNeeded } from './store/appStore.js';
import { connectSocket, disconnectSocket } from './socket.js';
import AppHeader from './components/layout/AppHeader.jsx';
import MiniRadioBar from './components/layout/MiniRadioBar.jsx';
import { RadioAudioProvider } from './context/RadioAudioContext.jsx';
import { applyPreferencesToDocument, loadPreferences } from './lib/appPreferences.js';

// Pages
import LoginPage from './pages/LoginPage.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import DebatePage from './pages/DebatePage.jsx';
import ReligionFaithPage from './pages/ReligionFaithPage.jsx';
import AiVoicePage from './pages/AiVoicePage.jsx';
import RadioPage from './pages/RadioPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import KnowledgeBasePage from './pages/KnowledgeBasePage.jsx';
import DebateDetailPage from './pages/DebateDetailPage.jsx';
import VideoLivePage from './pages/VideoLivePage.jsx';
import PodcastPage from './pages/PodcastPage.jsx';
import CageUserProfilePage from './pages/CageUserProfilePage.jsx';
import RegisteredMembersPage from './pages/RegisteredMembersPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import SpectatorPage from './pages/SpectatorPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

// ─── helpers ────────────────────────────────────────────────────────────────

/** Read user from localStorage directly — single source of truth for auth guards */
function getStoredUser() {
  try {
    const raw = localStorage.getItem('omgplus_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// ─── Error boundary ──────────────────────────────────────────────────────────

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: '28px 18px',
            textAlign: 'center',
            fontFamily: 'var(--font-sans, Rubik, Segoe UI, sans-serif)',
            background: '#07070c',
            color: '#e8e8ef',
            lineHeight: 1.65,
          }}
        >
          <p style={{ marginBottom: 12, fontWeight: 800, fontSize: '1.05rem' }}>
            משהו השתבש בטעינת האפליקציה.
          </p>
          <pre
            style={{
              marginBottom: 18,
              color: '#f87171',
              fontSize: '0.8rem',
              maxWidth: 600,
              marginInline: 'auto',
              textAlign: 'left',
              background: '#1e1e2e',
              padding: '12px',
              borderRadius: 8,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {this.state.error?.message}{'\n'}{this.state.error?.stack}
          </pre>
          <p
            style={{
              marginBottom: 18,
              color: '#94a3b8',
              fontSize: '0.92rem',
              maxWidth: 420,
              marginInline: 'auto',
            }}
          >
            אפשר לרענן את הדף או לחזור לדף ראשי.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              cursor: 'pointer',
              padding: '10px 18px',
              borderRadius: 10,
              border: '1px solid #475569',
              background: '#1e293b',
              color: '#fff',
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            רענון דף
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Auth guards ─────────────────────────────────────────────────────────────

/**
 * ProtectedRoute — checks localStorage for 'omgplus_user'.
 * Falls back to Zustand store rehydration for compatibility.
 */
function ProtectedRoute({ children }) {
  useLayoutEffect(() => {
    rehydrateUserIfNeeded();
  }, []);

  // Primary: localStorage check (fast, synchronous)
  const localUser = getStoredUser();
  // Secondary: Zustand store (set by LoginPage after successful auth)
  const storeUser = useAppStore(s => s.user);

  if (!localUser && !storeUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * RootRedirect — / → /lobby if logged in, else /login
 */
function RootRedirect() {
  const localUser = getStoredUser();
  const storeUser = useAppStore(s => s.user);
  const user = localUser || storeUser;
  return <Navigate to={user ? '/lobby' : '/login'} replace />;
}

/**
 * ProfileMeRedirect — /profile/me → /profile/:username
 */
function ProfileMeRedirect() {
  const localUser = getStoredUser();
  const storeUser = useAppStore(s => s.user);
  const user = localUser || storeUser;
  const name = user?.username?.trim();
  if (!name) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${encodeURIComponent(name)}`} replace />;
}

// ─── Layout wrapper for protected pages ──────────────────────────────────────

/**
 * ProtectedShell — wraps a protected page with AppHeader + MiniRadioBar.
 * AppHeader and MiniRadioBar are shown on all authenticated pages.
 */
function ProtectedShell({ children }) {
  return (
    <>
      <AppHeader />
      <MiniRadioBar />
      <main id="main-content" className="app-main" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  // Zustand store — kept for socket connection logic and backward compat
  const user = useAppStore(s => s.user);
  const socketUsername = user?.username;
  const socketSide = user?.side;

  // Apply saved display preferences on mount
  useEffect(() => {
    applyPreferencesToDocument(loadPreferences());
  }, []);

  // Rehydrate Zustand store from localStorage on boot
  useEffect(() => {
    rehydrateUserIfNeeded();
  }, []);

  // Browser shell class for consistent column layout
  useEffect(() => {
    document.documentElement.classList.add('app-shell-browser');
    return () => document.documentElement.classList.remove('app-shell-browser');
  }, []);

  // Reconnect socket only when identity actually changes
  useEffect(() => {
    if (!socketUsername || !socketSide) {
      disconnectSocket();
      return;
    }
    connectSocket(socketUsername, socketSide);
  }, [socketUsername, socketSide]);

  return (
    <BrowserRouter>
      <RadioAudioProvider>
        <AppErrorBoundary>
          <Routes>
            {/* Public root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* Public — login (no shell) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Spectate — no auth required, no shell header */}
            <Route
              path="/spectate/:debateId"
              element={<SpectatorPage />}
            />

            {/* Admin — no auth guard, no shell */}
            <Route path="/admin" element={<AdminPage />} />

            {/* ── Protected routes — all wrapped in ProtectedShell ── */}

            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <LobbyPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/debate/:debateId"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <DebatePage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/faith"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <ReligionFaithPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-voice"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <AiVoicePage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/radio"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <RadioPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/blog"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <BlogPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <LeaderboardPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <KnowledgeBasePage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/knowledge/:id"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <DebateDetailPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/video"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <VideoLivePage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/podcast"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <PodcastPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            {/* /profile/me → redirect to /profile/:username */}
            <Route
              path="/profile/me"
              element={
                <ProtectedRoute>
                  <ProfileMeRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/:username"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <CageUserProfilePage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/registered"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <RegisteredMembersPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProtectedShell>
                    <SettingsPage />
                  </ProtectedShell>
                </ProtectedRoute>
              }
            />

            {/* Route aliases */}
            <Route path="/video-live" element={<Navigate to="/video" replace />} />
            <Route path="/knowledge-base" element={<Navigate to="/knowledge" replace />} />
            <Route path="/arguments" element={<Navigate to="/knowledge" replace />} />
            <Route path="/live-events" element={<Navigate to="/lobby" replace />} />
            <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
            <Route path="/profile/me" element={
              <ProtectedRoute><ProfileMeRedirect /></ProtectedRoute>
            } />

            {/* Catch-all → root (which redirects to /login or /lobby) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppErrorBoundary>
      </RadioAudioProvider>
    </BrowserRouter>
  );
}
