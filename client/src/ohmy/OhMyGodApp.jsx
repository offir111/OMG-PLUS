import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { OHMY_API_URL, OHMY_USER_KEY } from './ohmyConfig.js';

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

// Activate Oh My God mode — overrides API base and user key
window.__OHMY_MODE__ = true;
window.__OHMY_API_URL__ = OHMY_API_URL;
window.__OHMY_USER_KEY__ = OHMY_USER_KEY;

function getOhmyUser() {
  try {
    const raw = localStorage.getItem(OHMY_USER_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p?.username ? p : null;
  } catch { return null; }
}

function Protected({ children }) {
  const user = getOhmyUser();
  if (!user) return <Navigate to="/v2/login" replace />;
  return children;
}

function Shell({ children }) {
  return (
    <>
      <AppHeader />
      <MiniRadioBar />
      <main id="main-content">{children}</main>
    </>
  );
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

export default function OhMyGodApp() {
  useEffect(() => {
    applyPreferencesToDocument(loadPreferences());
    return () => {
      // Clean up mode flag when leaving mode 2
      window.__OHMY_MODE__ = false;
    };
  }, []);

  return (
    <RadioAudioProvider>
      {/* Relative routes — parent already matched /v2/* */}
      <Routes>
        <Route index element={<RootRedirect />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="spectate/:debateId" element={<SpectatorPage />} />
        <Route path="admin" element={<AdminPage />} />

        <Route path="lobby" element={<Protected><Shell><LobbyPage /></Shell></Protected>} />
        <Route path="debate/:debateId" element={<Protected><Shell><DebatePage /></Shell></Protected>} />
        <Route path="faith" element={<Protected><Shell><ReligionFaithPage /></Shell></Protected>} />
        <Route path="ai-voice" element={<Protected><Shell><AiVoicePage /></Shell></Protected>} />
        <Route path="radio" element={<Protected><Shell><RadioPage /></Shell></Protected>} />
        <Route path="blog" element={<Protected><Shell><BlogPage /></Shell></Protected>} />
        <Route path="leaderboard" element={<Protected><Shell><LeaderboardPage /></Shell></Protected>} />
        <Route path="knowledge" element={<Protected><Shell><KnowledgeBasePage /></Shell></Protected>} />
        <Route path="knowledge/:id" element={<Protected><Shell><DebateDetailPage /></Shell></Protected>} />
        <Route path="video" element={<Protected><Shell><VideoLivePage /></Shell></Protected>} />
        <Route path="video-live" element={<Navigate to="/v2/video" replace />} />
        <Route path="podcast" element={<Protected><Shell><PodcastPage /></Shell></Protected>} />
        <Route path="profile/me" element={<Protected><ProfileMeRedirect /></Protected>} />
        <Route path="profile/:username" element={<Protected><Shell><CageUserProfilePage /></Shell></Protected>} />
        <Route path="registered" element={<Protected><Shell><RegisteredMembersPage /></Shell></Protected>} />
        <Route path="settings" element={<Protected><Shell><SettingsPage /></Shell></Protected>} />
        <Route path="arguments" element={<Protected><Shell><ArgumentsPage /></Shell></Protected>} />
        <Route path="*" element={<Navigate to="/v2" replace />} />
      </Routes>
    </RadioAudioProvider>
  );
}
