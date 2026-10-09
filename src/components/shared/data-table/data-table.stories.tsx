import { faker } from '@faker-js/faker'
import type { FC } from 'react'
import type { Meta, StoryObj } from '@storybook/tanstack-react'
import { expect, screen } from 'storybook/test'
import {
  createAppColumnHelper,
  DataTableExpand,
  DataTableFrame,
  DataTableSelectAll,
  DataTableSelectRow,
  useAppTable,
} from '#/components/shared/data-table'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'

type DemoRow = {
  id: string
  pond: string
  feed: string
  grams: number
}

const demoRows: Array<DemoRow> = [
  { id: '1', pond: 'A6', feed: '781', grams: 100 },
  { id: '2', pond: 'A6', feed: '781', grams: 80 },
  { id: '3', pond: 'C6', feed: 'Safir', grams: 50 },
  { id: '4', pond: 'C6', feed: 'Safir', grams: 70 },
  { id: '5', pond: 'D3', feed: '781', grams: 40 },
  { id: '6', pond: 'D3', feed: 'Starter', grams: 30 },
]

faker.seed(7)

function createRows(count: number): Array<DemoRow> {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1).padStart(3, '0'),
    pond: faker.helpers.arrayElement(['A6', 'B2', 'C6', 'D3']),
    feed: faker.helpers.arrayElement(['781', 'Safir', 'Starter']),
    grams: faker.number.int({ min: 20, max: 400 }),
  }))
}

function rangeLabel(text: string) {
  return (_content: string, element: Element | null) =>
    element?.textContent === text &&
    Array.from(element.children).every((child) => child.textContent !== text)
}

const paginatedRows = createRows(87)
const virtualizedRows = createRows(240)

const column = createAppColumnHelper<DemoRow>()

const selectColumn = column.display({
  id: 'select',
  size: 40,
  minSize: 40,
  maxSize: 48,
  enableSorting: false,
  enableHiding: false,
  enableResizing: false,
  enablePinning: false,
  enableCellSelection: false,
  header: () => <DataTableSelectAll />,
  cell: ({ row }) => <DataTableSelectRow row={row} />,
})

const demoColumns = column.columns([
  selectColumn,
  column.accessor('pond', {
    header: 'Kolam',
    spanRows: true,
  }),
  column.accessor('feed', {
    header: 'Pakan',
    enableColumnFilter: true,
    aggregationFn: 'count',
  }),
  column.accessor('grams', {
    header: 'Gram',
    aggregationFn: 'sum',
    footer: ({ table }) => {
      const total = table.getFilteredRowModel().rows.reduce((sum, row) => {
        if (row.getIsGrouped() || typeof row.original.grams !== 'number') {
          return sum
        }
        return sum + row.original.grams
      }, 0)
      return `Total ${total}`
    },
  }),
])

const listColumns = column.columns([
  selectColumn,
  column.accessor('id', { header: 'No' }),
  column.accessor('pond', { header: 'Kolam' }),
  column.accessor('feed', { header: 'Pakan' }),
  column.accessor('grams', { header: 'Gram' }),
])

const clientInitialState = {
  pagination: { pageIndex: 0, pageSize: 4 },
  rowPinning: { top: ['1'], bottom: [] },
  columnPinning: { start: [], end: ['grams'] },
}

const paginatedInitialState = {
  pagination: { pageIndex: 0, pageSize: 10 },
}

const virtualInitialState = {
  pagination: { pageIndex: 0, pageSize: virtualizedRows.length },
}

interface TableFrameProps {
  rows: Array<DemoRow>
  columns: typeof demoColumns | typeof listColumns
  initialState:
    | typeof clientInitialState
    | typeof paginatedInitialState
    | typeof virtualInitialState
  isLoading?: boolean
  isFetching?: boolean
}

const TableFrame: FC<TableFrameProps> = ({
  rows,
  columns,
  initialState,
  isLoading = false,
  isFetching = false,
}) => {
  const table = useAppTable({
    data: rows,
    columns,
    getRowId: (row) => row.id,
    initialState,
  })

  return (
    <DataTableFrame>
      <table.AppTable>
        <table.Toolbar>
          <table.Search label="Cari" />
          <table.ViewOptions />
        </table.Toolbar>
        <table.Grid
          emptyLabel="Tidak ada data."
          isLoading={isLoading}
          isFetching={isFetching}
        />
        <table.Pagination />
      </table.AppTable>
    </DataTableFrame>
  )
}

const meta = {
  title: 'Shared/DataTable',
  component: TableFrame,
  tags: ['autodocs'],
} satisfies Meta<typeof TableFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  args: {
    rows: [],
    columns: listColumns,
    initialState: paginatedInitialState,
    isLoading: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Memuat data')).toBeVisible()
    await expect(canvas.queryByText('Tidak ada data.')).not.toBeInTheDocument()
  },
}

export const Refreshing: Story = {
  args: {
    rows: demoRows,
    columns: demoColumns,
    initialState: clientInitialState,
    isFetching: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText('A6').length).toBeGreaterThan(0)
    await expect(canvas.getByRole('status', { name: 'Memuat' })).toBeVisible()
  },
}

export const Client: Story = {
  args: {
    rows: demoRows,
    columns: demoColumns,
    initialState: clientInitialState,
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Urutkan Kolam' }))
    await userEvent.type(canvas.getByLabelText('Cari'), 'Safir')
    await expect(canvas.getAllByText('Safir').length).toBeGreaterThan(0)
    await expect(canvas.queryByText('Starter')).not.toBeInTheDocument()
    await userEvent.click(
      canvas.getAllByRole('checkbox', { name: 'Pilih baris' })[0],
    )
    await expect(canvas.getByText(/1 dari/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Geser kolom Kolam' }),
    ).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Sematkan Kolam' }),
    )
    await screen.findByRole('menuitem', { name: 'Sematkan di kiri' })
    await expect(
      screen.queryByRole('menuitem', { name: 'Geser ke kiri' }),
    ).not.toBeInTheDocument()
  },
}

type Member = {
  name: string
  role: string
  email: string
  hireDate: string
  dob: string
}

type Team = {
  id: string
  teamName: string
  department: string
  location: string
  nextMilestone: string
  budget: number
  members: Array<Member>
}

const teams: Array<Team> = [
  {
    id: 'marketing',
    teamName: 'Digital Marketing',
    department: 'Marketing',
    location: 'London',
    nextMilestone: 'Launch New Campaign',
    budget: 30000,
    members: [
      {
        name: 'Alice Johnson',
        role: 'Lead Strategist',
        email: 'alice.johnson@example.com',
        hireDate: '2020-01-15',
        dob: '1990-01-01',
      },
      {
        name: 'Bob Smith',
        role: 'Content Creator',
        email: 'bob.smith@example.com',
        hireDate: '2021-03-22',
        dob: '1992-05-15',
      },
      {
        name: 'Charlie Brown',
        role: 'SEO Specialist',
        email: 'charlie.brown@example.com',
        hireDate: '2022-07-30',
        dob: '1995-11-20',
      },
    ],
  },
  {
    id: 'product',
    teamName: 'Product Development',
    department: 'Engineering',
    location: 'San Francisco',
    nextMilestone: 'Release Version 2.0',
    budget: 50000,
    members: [
      {
        name: 'David Wilson',
        role: 'Product Manager',
        email: 'david.wilson@example.com',
        hireDate: '2019-05-10',
        dob: '1988-02-25',
      },
      {
        name: 'Emma Johnson',
        role: 'UX Designer',
        email: 'emma.johnson@example.com',
        hireDate: '2020-08-15',
        dob: '1990-11-30',
      },
      {
        name: 'Frank Miller',
        role: 'QA Engineer',
        email: 'frank.miller@example.com',
        hireDate: '2021-01-20',
        dob: '1993-06-10',
      },
    ],
  },
  {
    id: 'sales',
    teamName: 'Sales Team',
    department: 'Sales',
    location: 'New York',
    nextMilestone: 'Close Q3 Deals',
    budget: 40000,
    members: [
      {
        name: 'Grace Lee',
        role: 'Sales Executive',
        email: 'grace.lee@example.com',
        hireDate: '2021-05-12',
        dob: '1995-03-22',
      },
    ],
  },
]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const teamColumn = createAppColumnHelper<Team>()

const teamColumns = teamColumn.columns([
  teamColumn.display({
    id: 'expander',
    size: 40,
    minSize: 40,
    maxSize: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enablePinning: false,
    header: () => null,
    cell: ({ row }) => (
      <DataTableExpand row={row} label={row.original.teamName} />
    ),
  }),
  teamColumn.display({
    id: 'select',
    size: 40,
    minSize: 40,
    maxSize: 48,
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    enablePinning: false,
    enableCellSelection: false,
    header: () => <DataTableSelectAll />,
    cell: ({ row }) => <DataTableSelectRow row={row} />,
  }),
  teamColumn.accessor('teamName', {
    header: 'Team Name',
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  teamColumn.accessor('department', { header: 'Department' }),
  teamColumn.accessor('location', { header: 'Location' }),
  teamColumn.accessor('nextMilestone', { header: 'Next Milestone' }),
  teamColumn.accessor('budget', {
    header: 'Budget',
    cell: ({ getValue }) => money.format(getValue()),
  }),
])

const MemberTable: FC<{ members: Array<Member> }> = ({ members }) => {
  return (
    <table className="w-full text-sm">
      <TableHeader className="border-b">
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableHead className="w-24" />
          <TableHead>Member Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Hire Date</TableHead>
          <TableHead>Date of Birth</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.email} className="hover:bg-transparent">
            <TableCell />
            <TableCell>{member.name}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell>{member.email}</TableCell>
            <TableCell>{member.hireDate}</TableCell>
            <TableCell>{member.dob}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </table>
  )
}

const ExpandedTeams: FC = () => {
  const table = useAppTable({
    data: teams,
    columns: teamColumns,
    getRowId: (row) => row.id,
    getRowCanExpand: (row) => row.original.members.length > 0,
    initialState: {
      expanded: { marketing: true, product: true },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  })

  return (
    <DataTableFrame>
      <table.AppTable>
        <table.Grid
          emptyLabel="Tidak ada data."
          renderSubComponent={(row) => (
            <MemberTable members={(row.original as Team).members} />
          )}
        />
      </table.AppTable>
    </DataTableFrame>
  )
}

export const Grouped: Story = {
  args: {
    rows: demoRows,
    columns: demoColumns,
    initialState: clientInitialState,
  },
  render: () => <ExpandedTeams />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('Alice Johnson')).toBeVisible()
    await expect(canvas.getAllByText('Member Name').length).toBe(2)
    await expect(canvas.queryByText('Grace Lee')).not.toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Bentangkan Sales Team' }),
    )
    await expect(await canvas.findByText('Grace Lee')).toBeVisible()
    await expect(canvas.getByText('Sales Executive')).toBeVisible()
  },
}

export const Paginated: Story = {
  args: {
    rows: paginatedRows,
    columns: listColumns,
    initialState: paginatedInitialState,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('001')).toBeVisible()
    await expect(canvas.getByText(rangeLabel('1-10 dari 87'))).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: 'Sebelumnya' }),
    ).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Berikutnya' }))
    await expect(canvas.getByText(rangeLabel('11-20 dari 87'))).toBeVisible()
    await expect(canvas.queryByText('001')).not.toBeInTheDocument()
    await expect(canvas.getByText('011')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Sebelumnya' }))
    await expect(canvas.getByText('001')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'Pilih semua baris' }),
    )
    await expect(canvas.getByText('10 dari 87 baris dipilih.')).toBeVisible()
    await expect(canvas.getByText('10 dipilih')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Berikutnya' }))
    await expect(
      canvas.getByRole('checkbox', { name: 'Pilih semua baris' }),
    ).not.toBeChecked()
    await userEvent.click(
      canvas.getByRole('checkbox', { name: 'Pilih semua baris' }),
    )
    await expect(canvas.getByText('20 dari 87 baris dipilih.')).toBeVisible()
  },
}

export const Virtualized: Story = {
  args: {
    rows: virtualizedRows,
    columns: listColumns,
    initialState: virtualInitialState,
  },
  play: async ({ canvas }) => {
    const header = canvas.getByRole('button', { name: 'Urutkan Kolam' })
    await expect(header.closest('th')?.className).toContain('sticky')
    const renderedRows = canvas.getAllByRole('row')
    await expect(renderedRows.length).toBeGreaterThan(2)
    await expect(canvas.getByText('001')).toBeVisible()
    await expect(renderedRows.length).toBeLessThan(40)
  },
}
