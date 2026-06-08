import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { OHMY_API_URL, OHMY_USER_KEY } from './ohmyConfig.js';

// Pages — same code, different server
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
import SpectatorPage from '../pages/SpectatorPage.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import ArgumentsPage from '../pages/ArgumentsPage.jsx';
import AppHeader from '../components/layout/AppHeader.jsx';
import MiniRadioBar from '../components/layout/MiniRadioBar.jsx';
import { RadioAudioProvider } from '../context/RadioAudioContext.jsx';
import { applyPreferencesToDocument, loadPreferences } from '../lib/appPreferences.js';

// Override VITE_API_URL for mode 2
if (typeof window !== 'undefined') {
  window.__OHMY_MODE__ = true;
  window.__OHMY_API_URL__ = OHMY_API_URL;
  window.__OHMY_USER_KEY__ = OHMY_USER_KEY;
}

function getOhmyUser() {
  try {
    const raw = localStorage.getItem(OHMY_USER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.username ? p : null;
  } catch { return null; }
}

function ProtectedRoute({ children }) {
  const user = getOhmyUser();
  if (!user) return <Navigate to="/v2/login" replace />;
  return children;
}

function RootRedirect() {
  const user = getOhmyUser();
  return <Navigate to={user ? '/v2/lobby' : '/v2/login'} replace />;
}

function ProfileMeRedirect() {
  const user = getOhmyUser();
  if (!user?.username) return <Navigate to="/v2/login" replace />;
  return <Navigate to={`/v2/profile/${encodeURIComponent(user.username)}`} replace />;
}

function Shell({ children }) {
  return (
    <>
      <AppHeader />
      <MiniRadioBar />
      <main id="main-content" style={{ paddingTop: 0 }}>
        {children}
      </main>
    </>
  );
}

export default function OhMyGodApp() {
  useEffect(() => {
    applyPreferencesToDocument(loadPreferences());
  }, []);

  return (
    <RadioAudioProvider>
      <Routes>
        <Route path="/v2" element={<RootRedirect />} />
        <Route path="/v2/login" element={<LoginPage />} />
        <Route path="/v2/spectate/:debateId" element={<SpectatorPage />} />
        <Route path="/v2/admin" element={<AdminPage />} />

        <Route path="/v2/lobby" element={<ProtectedRoute><Shell><LobbyPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/debate/:debateId" element={<ProtectedRoute><Shell><DebatePage /></Shell></ProtectedRoute>} />
        <Route path="/v2/faith" element={<ProtectedRoute><Shell><ReligionFaithPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/ai-voice" element={<ProtectedRoute><Shell><AiVoicePage /></Shell></ProtectedRoute>} />
        <Route path="/v2/radio" element={<ProtectedRoute><Shell><RadioPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/blog" element={<ProtectedRoute><Shell><BlogPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/leaderboard" element={<ProtectedRoute><Shell><LeaderboardPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/knowledge" element={<ProtectedRoute><Shell><KnowledgeBasePage /></Shell></ProtectedRoute>} />
        <Route path="/v2/knowledge/:id" element={<ProtectedRoute><Shell><DebateDetailPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/video" element={<ProtectedRoute><Shell><VideoLivePage /></Shell></ProtectedRoute>} />
        <Route path="/v2/video-live" element={<Navigate to="/v2/video" replace />} />
        <Route path="/v2/podcast" element={<ProtectedRoute><Shell><PodcastPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/profile/me" element={<ProtectedRoute><ProfileMeRedirect /></ProtectedRoute>} />
        <Route path="/v2/profile/:username" element={<ProtectedRoute><Shell><CageUserProfilePage /></Shell></ProtectedRoute>} />
        <Route path="/v2/registered" element={<ProtectedRoute><Shell><RegisteredMembersPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/settings" element={<ProtectedRoute><Shell><SettingsPage /></Shell></ProtectedRoute>} />
        <Route path="/v2/arguments" element={<ProtectedRoute><Shell><ArgumentsPage /></Shell></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </RadioAudioProvider>
  );
}
