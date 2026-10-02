import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { usePreferencesStore  } from '#/stores/preferences-store'
import type {Theme} from '#/stores/preferences-store';

const nextTheme: Record<Theme, Theme> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

const labels: Record<Theme, string> = {
  light: 'Tema terang. Klik untuk gelap.',
  dark: 'Tema gelap. Klik untuk sistem.',
  system: 'Tema sistem. Klik untuk terang.',
}

export function ThemeToggle() {
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={labels[theme]}
      onClick={() => setTheme(nextTheme[theme])}
    >
      <Icon />
    </Button>
  )
}
