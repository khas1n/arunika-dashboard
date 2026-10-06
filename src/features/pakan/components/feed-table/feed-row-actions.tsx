import { createContext, useContext } from 'react'
import type { FeedItem } from '#/features/pakan/schemas/feed'

export interface FeedRowActions {
  edit: (feed: FeedItem) => void
  askDelete: (feed: FeedItem) => void
}

const FeedRowActionsContext = createContext<FeedRowActions | null>(null)

export function useFeedRowActions() {
  const actions = useContext(FeedRowActionsContext)
  if (!actions) {
    throw new Error('Feed row actions are only available inside FeedTable.')
  }
  return actions
}

export const FeedRowActionsProvider = FeedRowActionsContext.Provider
