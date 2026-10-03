import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

// Server functions are same-origin RPC endpoints. Reject cross-site callers
// before any handler, including the write functions, runs.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  defaultSsr: false,
  requestMiddleware: [csrfMiddleware],
}))
