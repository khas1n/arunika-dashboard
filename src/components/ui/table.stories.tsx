import type { Meta, StoryObj } from '@storybook/tanstack-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'

function TableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama</TableHead>
          <TableHead>Jumlah</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>781</TableCell>
          <TableCell>12</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

const meta = {
  title: 'UI/Table',
  component: TableDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof TableDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
