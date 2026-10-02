import { useEffect } from 'react'

import { usePreferencesStore } from '#/stores/preferences-store'

export function useApplyTheme() {
  const theme = usePreferencesStore((state) => state.theme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const resolved =
        theme === 'system' ? (media.matches ? 'dark' : 'light') : theme
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(resolved)
      document.documentElement.style.colorScheme = resolved
    }

    apply()

    if (theme !== 'system') {
      return
    }

    media.addEventListener('change', apply)
    return () => {
      media.removeEventListener('change', apply)
    }
  }, [theme])
}
