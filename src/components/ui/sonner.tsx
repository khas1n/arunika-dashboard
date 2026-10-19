import type { FC } from 'react'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'
import { usePreferencesStore } from '#/stores/preferences-store'

export const Toaster: FC<ToasterProps> = (props) => {
  const theme = usePreferencesStore((state) => state.theme)

  return (
    <Sonner
      className="toaster group"
      expand
      richColors
      position="top-right"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
      theme={theme}
    />
  )
}
