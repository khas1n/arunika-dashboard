import type { FC, ReactNode } from 'react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Toaster } from '#/components/ui/sonner'
import { useApplyTheme } from '#/hooks/use-apply-theme'
import type { RouterContext } from '#/router'
import appCss from '../styles.css?url'

const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem('arunika-preferences');var theme='system';if(raw){var parsed=JSON.parse(raw);var stored=parsed&&parsed.state&&parsed.state.theme;if(stored==='light'||stored==='dark'||stored==='system'){theme=stored}}var dark=matchMedia('(prefers-color-scheme: dark)').matches;var resolved=theme==='system'?(dark?'dark':'light'):theme;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`

const RootComponent: FC = () => {
  useApplyTheme()

  return (
    <>
      <Outlet />
      <Toaster />
      {import.meta.env.DEV ? (
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
      ) : null}
    </>
  )
}

interface RootDocumentProps {
  children: ReactNode
}

const RootDocument: FC<RootDocumentProps> = ({ children }) => {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased selection:bg-primary/20">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRouteWithContext<RouterContext>()({
  ssr: 'data-only',
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Arunika Dashboard' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: (props) => <RootDocument {...props} />,
  component: RootComponent,
})
