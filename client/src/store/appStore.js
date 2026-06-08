import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set) => ({
      // State
      user: null,
      isLoggedIn: false,
      onlineCount: 0,
      currentDebate: null,
      radioStation: null,
      radioPlaying: false,

      // Actions
      setUser: (user) => set({ user, isLoggedIn: !!user }),

      logout: () => set({ user: null, isLoggedIn: false, currentDebate: null }),

      setOnlineCount: (onlineCount) => set({ onlineCount }),

      setCurrentDebate: (currentDebate) => set({ currentDebate }),

      setRadioStation: (radioStation) => set({ radioStation }),

      setRadioPlaying: (radioPlaying) => set({ radioPlaying })
    }),
    {
      name: 'omg-plus-storage',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn })
    }
  )
)

export default useAppStore
