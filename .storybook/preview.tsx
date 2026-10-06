import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { withThemeByClassName } from '@storybook/addon-themes'

import { usePreferencesStore } from '../src/stores/preferences-store'

import type { Preview } from '@storybook/tanstack-react'
import { mswLoader } from 'msw-storybook-addon/csf3'

import '../src/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
})

const preview: Preview = {
  loaders: [mswLoader()],
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <div className="bg-background p-6 text-foreground">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    tanstack: {
      router: {
        context: { queryClient },
      },
    },
  },
  beforeEach: () => {
    queryClient.clear()
    usePreferencesStore.setState({
      theme: 'system',
      sidebarOpen: true,
    })
  },
}

export default preview
