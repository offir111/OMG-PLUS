import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      onlineCount: 0,
      currentDebate: null,
      radioStation: null,
      radioPlaying: false,

      setUser: (user) => set({ user, isLoggedIn: !!user }),
      logout: () => {
        localStorage.removeItem('omgplus_user');
        set({ user: null, isLoggedIn: false, currentDebate: null });
      },
      setOnlineCount: (onlineCount) => set({ onlineCount }),
      setCurrentDebate: (currentDebate) => set({ currentDebate }),
      setRadioStation: (radioStation) => set({ radioStation }),
      setRadioPlaying: (radioPlaying) => set({ radioPlaying }),
    }),
    {
      name: 'omgplus_user',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
)

export function rehydrateUserIfNeeded() {
  try {
    const raw = localStorage.getItem('omgplus_user');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const user = parsed?.state?.user ?? parsed;
    if (user && typeof user === 'object' && user.username) {
      useAppStore.setState({ user, isLoggedIn: true });
    }
  } catch {}
}

export default useAppStore;
