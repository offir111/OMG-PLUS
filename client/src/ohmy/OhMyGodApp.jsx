import React, { useLayoutEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Pages (shared components)
import LoginPage from '../pages/LoginPage.jsx';
import LobbyPage from '../pages/LobbyPage.jsx';
import DebatePage from '../pages/DebatePage.jsx';
import ReligionFaithPage from '../pages/ReligionFaithPage.jsx';
import AiVoicePage from '../pages/AiVoicePage.jsx';
import RadioPage from '../pages/RadioPage.jsx';
import BlogPage from '../pages/BlogPage.jsx';
import LeaderboardPage from '../pages/LeaderboardPage.jsx';
import KnowledgeBasePage from '../pages/KnowledgeBasePage.jsx';
import DebateDetailPage from '../pages/DebateDetailPage.jsx';
import VideoLivePage from '../pages/VideoLivePage.jsx';
import PodcastPage from '../pages/PodcastPage.jsx';
import CageUserProfilePage from '../pages/CageUserProfilePage.jsx';
import RegisteredMembersPage from '../pages/RegisteredMembersPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import ArgumentsPage from '../pages/ArgumentsPage.jsx';

// ─── Auth helpers ────────────────────────────────────────────────────────────

/** OH MY GOD mode uses 'omg_user' key */
function getOmgUser() {
  try {
    const raw = localStorage.getItem('omg_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

// ─── Banner ──────────────────────────────────────────────────────────────────

function OmgBanner() {
  return (
    <div
      style={{
        width: '100%',
        background: 'linear-gradient(90deg, #1a0a14 0%, #2d0f22 50%, #1a0a14 100%)',
        borderBottom: '1px solid rgba(244,63,94,0.25)',
        padding: '5px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 12,
        color: '#f43f5e',
        fontFamily: 'Rubik, Segoe UI, sans-serif',
        letterSpacing: '0.02em',
        userSelect: 'none',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <span style={{ opacity: 0.7 }}>🔄</span>
      <span style={{ fontWeight: 600 }}>Oh My God</span>
      <span style={{ opacity: 0.5, fontSize: 11 }}>—</span>
      <span style={{ opacity: 0.75, fontWeight: 400 }}>גרסה מקורית</span>
    </div>
  );
}

// ─── Auth guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const user = getOmgUser();
  if (!user) {
    return <Navigate to="login" replace />;
  }
  return children;
}

function RootRedirect() {
  const user = getOmgUser();
  return <Navigate to={user ? 'lobby' : 'login'} replace />;
}

function ProfileMeRedirect() {
  const user = getOmgUser();
  const name = user?.username?.trim();
  if (!name) return <Navigate to="login" replace />;
  return <Navigate to={`profile/${encodeURIComponent(name)}`} replace />;
}

// ─── OhMyGodApp ──────────────────────────────────────────────────────────────

export default function OhMyGodApp() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#07070c',
      }}
    >
      <OmgBanner />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Parent route is /v2/* — all paths here are relative */}
        <Routes>
          {/* Root → lobby or login */}
          <Route index element={<RootRedirect />} />

          {/* Public — login */}
          <Route path="login" element={<LoginPage omgMode storageKey="omg_user" />} />

          {/* Admin — no auth guard */}
          <Route path="admin" element={<AdminPage />} />

          {/* Protected routes */}
          <Route
            path="lobby"
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="debate/:debateId"
            element={
              <ProtectedRoute>
                <DebatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="faith"
            element={
              <ProtectedRoute>
                <ReligionFaithPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="ai-voice"
            element={
              <ProtectedRoute>
                <AiVoicePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="radio"
            element={
              <ProtectedRoute>
                <RadioPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="blog"
            element={
              <ProtectedRoute>
                <BlogPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="knowledge"
            element={
              <ProtectedRoute>
                <KnowledgeBasePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="knowledge/:id"
            element={
              <ProtectedRoute>
                <DebateDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="video"
            element={
              <ProtectedRoute>
                <VideoLivePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="podcast"
            element={
              <ProtectedRoute>
                <PodcastPage />
              </ProtectedRoute>
            }
          />

          {/* /v2/profile/me → redirect to /v2/profile/:username */}
          <Route
            path="profile/me"
            element={
              <ProtectedRoute>
                <ProfileMeRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="profile/:username"
            element={
              <ProtectedRoute>
                <CageUserProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="registered"
            element={
              <ProtectedRoute>
                <RegisteredMembersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="arguments"
            element={
              <ProtectedRoute>
                <ArgumentsPage />
              </ProtectedRoute>
            }
          />

          {/* Aliases */}
          <Route path="video-live" element={<Navigate to="../video" replace />} />
          <Route path="knowledge-base" element={<Navigate to="../knowledge" replace />} />
          <Route path="live-events" element={<Navigate to="../lobby" replace />} />
          <Route path="profile" element={<Navigate to="profile/me" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  );
}
