import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, fn } from 'storybook/test'
import { useServerTableControls } from '#/components/shared/data-table'
import { useDebouncedValue } from '#/hooks/use-debounced-value'
import { listFeedsFn } from '#/features/pakan/api/feed.functions'
import {
  feedsQueryOptions,
  toFeedListQuery,
} from '#/features/pakan/api/feed.queries'
import { FeedTable } from '#/features/pakan/components/feed-table'
import {
  feedListHandler,
  feedListLoadingHandler,
  feedListUrl,
} from '#/features/pakan/components/feed-table/feed-list.msw'
import { feedListSchema } from '#/features/pakan/schemas/feed'
import type { FeedList, FeedListQuery } from '#/features/pakan/schemas/feed'

function rangeLabel(text: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent === text &&
    Array.from(element.children).every((child) => child.textContent !== text)
}

const createdAt = new Date('2026-10-01T00:00:00Z')

const meta = {
  title: 'Pakan/FeedTable',
  component: FeedTable,
  tags: ['autodocs'],
  args: {
    rows: [
      { id: 'feed-1', name: '781', createdAt, usageCount: 0 },
      { id: 'feed-2', name: 'Safir', createdAt, usageCount: 4 },
    ],
    onUpdate: fn(async () => {}),
    onDelete: fn(async () => {}),
  },
} satisfies Meta<typeof FeedTable>

export default meta
type Story = StoryObj<typeof meta>

export const Client: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('Cari jenis pakan'), 'Safir')
    await expect(canvas.getByText('Safir')).toBeVisible()
    await expect(canvas.queryByText('781')).not.toBeInTheDocument()
  },
}

export const Empty: Story = {
  args: { rows: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Belum ada jenis pakan.')).toBeVisible()
  },
}

function installFeedListMock() {
  const mocked = listFeedsFn as typeof listFeedsFn & {
    mockImplementation: (
      impl: (input: { data: FeedListQuery }) => Promise<FeedList>,
    ) => void
  }
  mocked.mockImplementation(async ({ data }) => {
    const response = await fetch(feedListUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Gagal memuat jenis pakan.')
    return feedListSchema.parse(await response.json())
  })
}

const ServerFeedTable: FC = () => {
  const table = useServerTableControls()
  const search = useDebouncedValue(table.state.globalFilter, 300)
  const query = toFeedListQuery(table.state, search)
  const feeds = useQuery(feedsQueryOptions(query))

  return (
    <FeedTable
      rows={feeds.data?.rows ?? []}
      rowCount={feeds.data?.rowCount ?? 0}
      server={table}
      isLoading={feeds.isPending}
      isFetching={feeds.isFetching && !feeds.isPending}
      onUpdate={fn(async () => {})}
      onDelete={fn(async () => {})}
    />
  )
}

export const Server: Story = {
  render: () => <ServerFeedTable />,
  parameters: {
    msw: { handlers: [feedListHandler] },
  },
  beforeEach: () => {
    installFeedListMock()
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      await canvas.findByText('781', {}, { timeout: 3000 }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Berikutnya' }))
    await expect(canvas.getByRole('status', { name: 'Memuat' })).toBeVisible()
    await expect(
      await canvas.findByText(
        rangeLabel('11-20 dari 36'),
        {},
        { timeout: 3000 },
      ),
    ).toBeVisible()
    await userEvent.type(canvas.getByLabelText('Cari jenis pakan'), 'Safir')
    await expect(
      await canvas.findByText('Safir', {}, { timeout: 4000 }),
    ).toBeVisible()
    await expect(canvas.queryByText('781')).not.toBeInTheDocument()
  },
}

export const ServerLoading: Story = {
  render: () => <ServerFeedTable />,
  parameters: {
    msw: { handlers: [feedListLoadingHandler] },
  },
  beforeEach: () => {
    installFeedListMock()
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Memuat data')).toBeVisible()
    await expect(canvas.queryByText('781')).not.toBeInTheDocument()
    await expect(
      canvas.queryByText('Belum ada jenis pakan.'),
    ).not.toBeInTheDocument()
  },
}
