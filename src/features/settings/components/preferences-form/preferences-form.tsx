import { Label } from '#/components/ui/label'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import { Switch } from '#/components/ui/switch'
import { usePreferencesStore  } from '#/stores/preferences-store'
import type {Theme} from '#/stores/preferences-store';

const themes: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
  { value: 'system', label: 'Sistem' },
]

export function PreferencesForm() {
  const theme = usePreferencesStore((state) => state.theme)
  const setTheme = usePreferencesStore((state) => state.setTheme)
  const sidebarOpen = usePreferencesStore((state) => state.sidebarOpen)
  const setSidebarOpen = usePreferencesStore((state) => state.setSidebarOpen)

  return (
    <div className="grid max-w-md gap-8">
      <fieldset className="grid gap-3">
        <legend className="text-sm font-medium">Tema</legend>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {themes.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                id={`theme-${option.value}`}
                value={option.value}
              />
              <Label htmlFor={`theme-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="sidebar-open">Sidebar terbuka</Label>
        <Switch
          id="sidebar-open"
          checked={sidebarOpen}
          onCheckedChange={setSidebarOpen}
        />
      </div>
    </div>
  )
}
