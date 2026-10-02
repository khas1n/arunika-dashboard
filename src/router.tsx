import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { PageLoader } from '#/components/shared/page-loader'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
  queryClient: QueryClient
}

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    defaultPendingComponent: PageLoader,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
