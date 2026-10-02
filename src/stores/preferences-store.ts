import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface PreferencesState {
  theme: Theme
  sidebarOpen: boolean
  setTheme: (theme: Theme) => void
  setSidebarOpen: (open: boolean) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: 'arunika-preferences', version: 1 },
  ),
)
