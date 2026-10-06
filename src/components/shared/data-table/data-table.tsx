import type { CSSProperties, FC, MouseEvent, ReactNode, RefObject } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDndContext,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Columns3,
  Ellipsis,
  GripVertical,
  PinOff,
  RefreshCcw,
  Search,
} from 'lucide-react'
import type { Header, Row, RowData } from '@tanstack/react-table'
import { createTableHook } from '@tanstack/react-table'
import { Button } from '#/components/ui/button'
import { Spinner } from '#/components/ui/spinner'
import { Checkbox } from '#/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '#/components/ui/empty'
import { Field, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { TooltipProvider } from '#/components/ui/tooltip'
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { cn } from '#/lib/utils'
import { dataTableFeatures } from '#/components/shared/data-table/features'

/**
 * Pixel width and sticky offsets come from the table, so they cannot be
 * Tailwind tokens. Everything else stays on utility classes.
 */
function columnBox(column: {
  id: string
  getSize: () => number
  getIsPinned: () => false | 'start' | 'end'
  getStart: (position?: 'start') => number
  getAfter: (position?: 'end') => number
}): CSSProperties {
  const pinned = column.getIsPinned()
  if (!pinned && column.id !== 'select') return {}
  return {
    position: pinned ? 'sticky' : undefined,
    width: column.id === 'select' ? column.getSize() : undefined,
    left: pinned === 'start' ? column.getStart('start') : undefined,
    right: pinned === 'end' ? column.getAfter('end') : undefined,
  }
}

const fixedColumnIds = new Set(['expander', 'select', 'actions'])

function canReorderColumn(column: {
  id: string
  getIsPinned: () => false | 'start' | 'end'
}) {
  return !fixedColumnIds.has(column.id) && !column.getIsPinned()
}

type ColumnDragVisual = {
  style: CSSProperties
  isDragging: boolean
}

const columnDragStyles = createContext<RefObject<
  Map<string, ColumnDragVisual>
> | null>(null)

type RowExpandControl = {
  overrides: Record<string, boolean>
  setOpen: (id: string, open: boolean) => void
}

const rowExpandControl = createContext<RowExpandControl | null>(null)

function resolveExpanded(
  row: { id: string; getIsExpanded: () => boolean },
  control: RowExpandControl | null,
) {
  if (control && Object.hasOwn(control.overrides, row.id)) {
    return control.overrides[row.id] === true
  }
  return row.getIsExpanded()
}

function dragStyle(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
  transition: string | undefined,
  isDragging: boolean,
): CSSProperties {
  const moving = isDragging || transform != null
  return {
    opacity: isDragging ? 0.8 : 1,
    position: moving ? 'relative' : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 40 : undefined,
  }
}

interface DataTableSearchProps {
  label?: string
}

const DataTableSearch: FC<DataTableSearchProps> = ({ label = 'Cari' }) => {
  const table = useTableContext()
  const id = useId()

  return (
    <table.Subscribe selector={(state) => state.globalFilter}>
      {(globalFilter) => (
        <Field className="w-full max-w-sm">
          <FieldLabel htmlFor={id} className="sr-only">
            {label}
          </FieldLabel>
          <Input
            id={id}
            value={typeof globalFilter === 'string' ? globalFilter : ''}
            placeholder={label}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
          />
        </Field>
      )}
    </table.Subscribe>
  )
}

interface DataTableToolbarProps {
  children: ReactNode
}

const DataTableToolbar: FC<DataTableToolbarProps> = ({ children }) => {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

const DataTableViewOptions: FC = () => {
  const table = useTableContext()
  const [search, setSearch] = useState('')

  return (
    <table.Subscribe selector={(state) => state.columnVisibility}>
      {() => {
        const columns = table
          .getAllLeafColumns()
          .filter((column) => column.getCanHide())
        if (columns.length === 0) return null
        const query = search.trim().toLowerCase()

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto w-full max-w-xs justify-between"
              >
                <span className="flex items-center gap-2">
                  <Columns3 data-icon="inline-start" />
                  Kolom
                </span>
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="relative">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-8"
                  placeholder="Cari"
                  aria-label="Cari kolom"
                  onKeyDown={(event) => event.stopPropagation()}
                />
                <Search className="pointer-events-none absolute inset-y-0 left-2 my-auto size-4 text-muted-foreground" />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {columns.map((column) => {
                  const label = columnLabel(column)
                  if (
                    query &&
                    !label.toLowerCase().includes(query) &&
                    !column.id.toLowerCase().includes(query)
                  ) {
                    return null
                  }
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                      onSelect={(event) => event.preventDefault()}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => {
                    table.resetColumnVisibility()
                    setSearch('')
                  }}
                >
                  <RefreshCcw />
                  Atur ulang
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }}
    </table.Subscribe>
  )
}

const DataTablePagination: FC = () => {
  const table = useTableContext()

  return (
    <table.Subscribe
      selector={(state) => ({
        pagination: state.pagination,
        rowSelection: state.rowSelection,
      })}
    >
      {({ pagination, rowSelection }) => (
        <DataTablePaginationBar
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          selectedCount={Object.keys(rowSelection).length}
        />
      )}
    </table.Subscribe>
  )
}

interface DataTablePaginationBarProps {
  pageIndex: number
  pageSize: number
  selectedCount: number
}

const pageSizeOptions = [10, 25, 50]

const DataTablePaginationBar: FC<DataTablePaginationBarProps> = ({
  pageIndex,
  pageSize,
  selectedCount,
}) => {
  const table = useTableContext()
  const rowCount = table.getRowCount()
  const pageCount = Math.max(table.getPageCount(), 1)
  const from = rowCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(rowCount, pageIndex * pageSize + pageSize)
  const sizes = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [pageSize, ...pageSizeOptions].sort((left, right) => left - right)
  const atStart = pageIndex <= 0
  const atEnd = pageIndex + 1 >= pageCount

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {selectedCount} dari {rowCount} baris dipilih.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Baris per halaman
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-16">
                {pageSize}
                <ChevronDown data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {sizes.map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() =>
                      table.setPagination({ pageIndex: 0, pageSize: size })
                    }
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm whitespace-nowrap text-muted-foreground">
          <span className="text-foreground">
            {from}-{to}
          </span>{' '}
          dari <span className="text-foreground">{rowCount}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Halaman pertama"
            onClick={() => table.setPageIndex(0)}
            disabled={atStart}
          >
            <ChevronFirst />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Sebelumnya"
            onClick={() => table.previousPage()}
            disabled={atStart}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Berikutnya"
            onClick={() => table.nextPage()}
            disabled={atEnd}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Halaman terakhir"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={atEnd}
          >
            <ChevronLast />
          </Button>
        </div>
      </div>
    </div>
  )
}

const DataTableSortButton: FC<{ children?: ReactNode }> = ({ children }) => {
  const table = useTableContext()
  const header = useHeaderContext()
  const column = header.column

  return (
    <table.Subscribe selector={(state) => state.sorting}>
      {(sorting) => {
        const current = sorting.find((sort) => sort.id === column.id)
        const sorted = current == null ? false : current.desc ? 'desc' : 'asc'
        return (
          <Button
            type="button"
            variant="ghost"
            className="h-full min-w-0 grow shrink justify-between px-2 font-medium"
            aria-label={`Urutkan ${columnLabel(column)}`}
            aria-sort={
              sorted === 'asc'
                ? 'ascending'
                : sorted === 'desc'
                  ? 'descending'
                  : 'none'
            }
            onClick={column.getToggleSortingHandler()}
          >
            <span className="truncate">{children}</span>
            {sorted === 'asc' ? (
              <ArrowUp className="opacity-60" />
            ) : sorted === 'desc' ? (
              <ArrowDown className="opacity-60" />
            ) : (
              <ArrowUpDown className="opacity-60" />
            )}
          </Button>
        )
      }}
    </table.Subscribe>
  )
}

const DataTableResizeHandle: FC = () => {
  const header = useHeaderContext()
  if (!header.column.getCanResize()) return null

  return (
    <button
      type="button"
      aria-label={`Ubah lebar ${columnLabel(header.column)}`}
      className="absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none opacity-0 hover:bg-border hover:opacity-100"
      onMouseDown={header.getResizeHandler()}
      onTouchStart={header.getResizeHandler()}
      onDoubleClick={() => header.column.resetSize()}
    />
  )
}

const DataTableColumnMenu: FC = () => {
  const header = useHeaderContext()
  const table = useTableContext()
  const column = header.column
  if (column.id === 'select') return null
  const canPin = column.getCanPin()
  const canHide = column.getCanHide()
  const canFilter = column.getCanFilter()
  if (!canPin && !canHide && !canFilter) return null

  const label = columnLabel(column)
  const facets = canFilter
    ? [...column.getFacetedUniqueValues().entries()].slice(0, 8)
    : []
  const range = canFilter ? column.getFacetedMinMaxValues() : undefined

  if (column.getIsPinned()) {
    if (!canPin) return null
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="-mr-1"
        aria-label={`Lepas sematan ${label}`}
        onClick={() => pinColumn(table, column.id, false)}
      >
        <PinOff className="opacity-60" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-mr-1"
          aria-label={`Sematkan ${label}`}
        >
          <Ellipsis className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canPin ? (
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={() => pinColumn(table, column.id, 'start')}
            >
              <ArrowLeftFromLine
                data-icon="inline-start"
                className="opacity-60"
              />
              Sematkan di kiri
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => pinColumn(table, column.id, 'end')}
            >
              <ArrowRightFromLine
                data-icon="inline-start"
                className="opacity-60"
              />
              Sematkan di kanan
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
        {canHide ? (
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.toggleVisibility(false)}>
              Sembunyikan
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : null}
        {canFilter ? (
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Filter</DropdownMenuLabel>
            <div className="px-2 py-1">
              <Input
                aria-label={`Filter ${columnLabel(column)}`}
                value={String(column.getFilterValue() ?? '')}
                onChange={(event) => column.setFilterValue(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
              />
            </div>
            {range ? (
              <DropdownMenuLabel>
                {range[0]} – {range[1]}
              </DropdownMenuLabel>
            ) : null}
            {facets.map(([value, count]) => (
              <DropdownMenuItem
                key={String(value)}
                onSelect={() => column.setFilterValue(String(value))}
              >
                {String(value)} ({count})
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface DataTableGridProps {
  emptyLabel: string
  /** No rows yet. Shows the spinner instead of the empty message. */
  isLoading?: boolean
  /** A later request is in flight and previous rows are still on screen. */
  isFetching?: boolean
  renderSubComponent?: (
    row: Row<typeof dataTableFeatures, RowData>,
  ) => ReactNode
}

const DataTableGrid: FC<DataTableGridProps> = ({
  emptyLabel,
  isLoading = false,
  isFetching = false,
  renderSubComponent,
}) => {
  const table = useTableContext()

  return (
    <table.Subscribe selector={(state) => state}>
      {() => (
        <DataTableGridBody
          emptyLabel={emptyLabel}
          isLoading={isLoading}
          isFetching={isFetching}
          renderSubComponent={renderSubComponent}
        />
      )}
    </table.Subscribe>
  )
}

interface DataTableGridBodyProps {
  emptyLabel: string
  isLoading: boolean
  isFetching: boolean
  renderSubComponent?: DataTableGridProps['renderSubComponent']
}

const DataTableGridBody: FC<DataTableGridBodyProps> = ({
  emptyLabel,
  isLoading,
  isFetching,
  renderSubComponent,
}) => {
  const table = useTableContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageIndex = table.state.pagination.pageIndex
  const topRows = table.getTopRows()
  const centerRows = table.getCenterRows()
  const bottomRows = table.getBottomRows()
  const columnCount =
    table.getStartVisibleLeafColumns().length +
    table.getCenterVisibleLeafColumns().length +
    table.getEndVisibleLeafColumns().length
  const spansVertically =
    table.state.grouping.length === 0 && hasVerticalSpan(table)
  const showAllRows = spansVertically || renderSubComponent != null
  const virtualizer = useVirtualizer({
    count: showAllRows ? 0 : centerRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 48,
    overscan: 8,
    getItemKey: (index) => centerRows[index]?.id ?? index,
  })
  const virtualRows = spansVertically ? [] : virtualizer.getVirtualItems()
  const paddingTop = virtualRows[0]?.start ?? 0
  const paddingBottom = showAllRows
    ? 0
    : Math.max(0, virtualizer.getTotalSize() - (virtualRows.at(-1)?.end ?? 0))
  const isEmpty =
    topRows.length === 0 && centerRows.length === 0 && bottomRows.length === 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [pageIndex])

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )
  const sortableIds = reorderableColumnIds(table)
  const dndId = useId()
  const dragStyles = useRef(new Map<string, ColumnDragVisual>())
  const [expandOverrides, setExpandOverrides] = useState<
    Record<string, boolean>
  >({})
  const setRowOpen = useCallback((id: string, open: boolean) => {
    setExpandOverrides((current) => ({ ...current, [id]: open }))
  }, [])

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const order =
      table.state.columnOrder.length > 0
        ? table.state.columnOrder
        : table.getAllLeafColumns().map((column) => column.id)
    const oldIndex = order.indexOf(String(active.id))
    const newIndex = order.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    table.setColumnOrder(arrayMove(order, oldIndex, newIndex))
  }

  const refreshing = isFetching && !isEmpty

  return (
    <div className="relative">
      {refreshing ? (
        <div className="pointer-events-none absolute top-3 right-3 z-30">
          <Spinner />
        </div>
      ) : null}
      <div
        ref={scrollRef}
        aria-busy={isLoading || refreshing || undefined}
        className={cn(
          'max-h-96 overflow-auto rounded-md border transition-opacity',
          refreshing && 'opacity-60',
        )}
      >
        <DndContext
          id={dndId}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          sensors={sensors}
          onDragEnd={onDragEnd}
        >
          <columnDragStyles.Provider value={dragStyles}>
            <rowExpandControl.Provider
              value={{ overrides: expandOverrides, setOpen: setRowOpen }}
            >
              <table className="w-full caption-bottom border-separate border-spacing-0 text-sm [&_tbody_td]:border-b [&_tbody_td]:border-border [&_th]:border-b [&_th]:border-border [&_tr]:border-b-0">
                <TableHeader className="sticky top-0 z-20 bg-muted">
                  {headerRows(table).map((headers) => (
                    <TableRow
                      key={headers.map((header) => header.id).join(':')}
                      className="bg-muted hover:bg-transparent"
                    >
                      <SortableContext
                        items={sortableIds}
                        strategy={horizontalListSortingStrategy}
                      >
                        {headers.map((header) =>
                          header.rowSpan === 0 ? null : (
                            <table.AppHeader key={header.id} header={header}>
                              {(bound) => (
                                <DataTableColumnHead
                                  sortable={sortableIds.includes(
                                    bound.column.id,
                                  )}
                                  resize={<bound.ResizeHandle />}
                                >
                                  {bound.column.getCanSort() ? (
                                    <bound.SortButton>
                                      {bound.isPlaceholder ? null : (
                                        <table.FlexRender header={bound} />
                                      )}
                                    </bound.SortButton>
                                  ) : (
                                    <span className="min-w-0 grow truncate">
                                      {bound.isPlaceholder ? null : (
                                        <table.FlexRender header={bound} />
                                      )}
                                    </span>
                                  )}
                                  <bound.ColumnMenu />
                                </DataTableColumnHead>
                              )}
                            </table.AppHeader>
                          ),
                        )}
                      </SortableContext>
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isEmpty ? (
                    <TableRow>
                      <TableCell colSpan={columnCount}>
                        {isLoading ? (
                          <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                            <Spinner className="size-5" />
                            <p className="text-sm">Memuat data</p>
                          </div>
                        ) : (
                          <Empty className="border-0">
                            <EmptyHeader>
                              <EmptyTitle>{emptyLabel}</EmptyTitle>
                              <EmptyDescription>
                                Ubah pencarian atau filter untuk melihat baris
                                lain.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {topRows.map((row) => (
                        <DataTableRow
                          key={row.id}
                          row={row}
                          sortableIds={sortableIds}
                          renderSubComponent={renderSubComponent}
                        />
                      ))}
                      {paddingTop > 0 ? (
                        <tr>
                          <td
                            colSpan={columnCount}
                            style={{ height: paddingTop }}
                          />
                        </tr>
                      ) : null}
                      {showAllRows
                        ? centerRows.map((row) => (
                            <DataTableRow
                              key={row.id}
                              row={row}
                              sortableIds={sortableIds}
                              renderSubComponent={renderSubComponent}
                            />
                          ))
                        : virtualRows.map((virtualRow) => {
                            const row = centerRows.at(virtualRow.index)
                            if (!row) return null
                            return (
                              <DataTableRow
                                key={row.id}
                                row={row}
                                sortableIds={sortableIds}
                                dataIndex={virtualRow.index}
                                measureRef={virtualizer.measureElement}
                              />
                            )
                          })}
                      {paddingBottom > 0 ? (
                        <tr>
                          <td
                            colSpan={columnCount}
                            style={{ height: paddingBottom }}
                          />
                        </tr>
                      ) : null}
                      {bottomRows.map((row) => (
                        <DataTableRow
                          key={row.id}
                          row={row}
                          sortableIds={sortableIds}
                          renderSubComponent={renderSubComponent}
                        />
                      ))}
                    </>
                  )}
                </TableBody>
                <DataTableFooter />
              </table>
            </rowExpandControl.Provider>
          </columnDragStyles.Provider>
        </DndContext>
      </div>
    </div>
  )
}

interface DataTableColumnHeadProps {
  children: ReactNode
  resize: ReactNode
  sortable: boolean
}

const DataTableColumnHead: FC<DataTableColumnHeadProps> = ({
  sortable,
  ...props
}) => {
  if (sortable) return <DataTableSortableHead {...props} />
  return <DataTableStaticHead {...props} />
}

const DataTableSortableHead: FC<Omit<DataTableColumnHeadProps, 'sortable'>> = ({
  children,
  resize,
}) => {
  const header = useHeaderContext()
  const column = header.column
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id })
  const styles = useContext(columnDragStyles)
  const publishedStyle = dragStyle(transform, transition, isDragging)
  if (styles) {
    styles.current.set(column.id, { style: publishedStyle, isDragging })
  }

  return (
    <TableHead
      ref={setNodeRef}
      colSpan={header.colSpan}
      rowSpan={header.rowSpan}
      className={cn(
        'sticky top-0 z-20 overflow-hidden bg-muted before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border first:before:bg-transparent',
        isDragging && 'z-40 bg-muted',
      )}
      style={publishedStyle}
    >
      <div className="flex h-full w-full items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="-ml-2 cursor-grab touch-none active:cursor-grabbing"
          aria-label={`Geser kolom ${columnLabel(column)}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="opacity-60" />
        </Button>
        {children}
      </div>
      {resize}
    </TableHead>
  )
}

const DataTableStaticHead: FC<Omit<DataTableColumnHeadProps, 'sortable'>> = ({
  children,
  resize,
}) => {
  const table = useTableContext()
  const header = useHeaderContext()
  const column = header.column
  const pinned = column.getIsPinned()
  const edge = pinEdge(table, column)

  return (
    <TableHead
      colSpan={header.colSpan}
      rowSpan={header.rowSpan}
      data-pinned={pinned || undefined}
      data-last-col={edge}
      className={cn(
        'sticky top-0 z-20 overflow-hidden bg-muted before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border first:before:bg-transparent data-pinned:bg-muted',
        pinned && 'z-30',
        edge === 'start' && 'border-r',
        edge === 'end' && 'border-l',
      )}
      style={columnBox(column)}
    >
      <div className="flex h-full w-full items-center gap-2">{children}</div>
      {resize}
    </TableHead>
  )
}

const DataTableFooter: FC = () => {
  const table = useTableContext()
  const groups = footerRows(table)
  const hasFooter = groups.some((headers) =>
    headers.some((header) => header.column.columnDef.footer != null),
  )
  if (!hasFooter) return null

  return (
    <tfoot className="border-t bg-muted/50 font-medium">
      {groups.map((headers) => (
        <TableRow key={headers.map((header) => header.id).join(':')}>
          {headers.map((header) =>
            header.rowSpan === 0 || header.isPlaceholder ? null : (
              <TableCell
                key={header.id}
                colSpan={header.colSpan}
                style={columnBox(header.column)}
              >
                <table.FlexRender footer={header} />
              </TableCell>
            ),
          )}
        </TableRow>
      ))}
    </tfoot>
  )
}

interface DataTableRowProps {
  row: Row<typeof dataTableFeatures, RowData>
  sortableIds: Array<string>
  renderSubComponent?: DataTableGridProps['renderSubComponent']
  dataIndex?: number
  measureRef?: (node: HTMLTableRowElement | null) => void
}

const DataTableRow: FC<DataTableRowProps> = ({
  row,
  sortableIds,
  renderSubComponent,
  dataIndex,
  measureRef,
}) => {
  const table = useTableContext()
  const cells = [
    ...row.getStartVisibleCells(),
    ...row.getCenterVisibleCells(),
    ...row.getEndVisibleCells(),
  ]
  const grouped = table.state.grouping.length > 0
  const expand = useContext(rowExpandControl)
  const expanded = resolveExpanded(row, expand)

  return (
    <>
      <TableRow
        ref={measureRef}
        data-index={dataIndex}
        data-state={row.getIsSelected() ? 'selected' : undefined}
        className={cn(expanded && renderSubComponent && 'bg-muted/50')}
      >
        {cells.map((cell) => {
          if (!grouped && cell.getIsCovered()) return null
          const edges = cell.getSelectionEdges()
          const pinned = cell.column.getIsPinned()
          const placeholder = cell.getIsPlaceholder()
          const showExpand =
            !placeholder && cell.getIsGrouped() && row.getCanExpand()
          return (
            <table.AppCell key={cell.id} cell={cell}>
              {(bound) => {
                const rowSpan = grouped ? undefined : bound.getRowSpan()
                const spansRows = (rowSpan ?? 1) > 1
                const content = (
                  <div
                    className={cn(
                      'flex gap-2',
                      spansRows ? 'items-start' : 'items-center',
                      showExpand && row.depth > 0 && 'pl-6',
                    )}
                  >
                    {showExpand ? <DataTableExpand row={row} /> : null}
                    {placeholder ? null : <bound.FlexRender />}
                  </div>
                )
                const shared = {
                  rowSpan,
                  colSpan: bound.getColSpan(),
                  className: cn(
                    spansRows
                      ? 'align-top whitespace-normal'
                      : 'overflow-hidden',
                    pinned &&
                      'sticky z-10 bg-background data-pinned:bg-background',
                    bound.getIsSelected() && 'bg-accent',
                    edges.left && 'border-l border-l-primary',
                    edges.right && 'border-r border-r-primary',
                    edges.top && 'border-t border-t-primary',
                    edges.bottom && 'border-b border-b-primary',
                  ),
                  onMouseDown: (event: MouseEvent<HTMLTableCellElement>) => {
                    if (shouldIgnoreSelection(event.target)) return
                    bound.getSelectionStartHandler()(event)
                  },
                  onMouseEnter: (event: MouseEvent<HTMLTableCellElement>) =>
                    bound.getSelectionExtendHandler()(event),
                  children: content,
                }
                if (sortableIds.includes(bound.column.id)) {
                  return <DataTableDragCell column={bound.column} {...shared} />
                }
                const edge = pinEdge(table, bound.column)
                return (
                  <TableCell
                    rowSpan={shared.rowSpan}
                    colSpan={shared.colSpan}
                    data-pinned={pinned || undefined}
                    data-last-col={edge}
                    className={cn(
                      shared.className,
                      edge === 'start' && 'border-r',
                      edge === 'end' && 'border-l',
                    )}
                    style={columnBox(bound.column)}
                    onMouseDown={shared.onMouseDown}
                    onMouseEnter={shared.onMouseEnter}
                  >
                    {content}
                  </TableCell>
                )
              }}
            </table.AppCell>
          )
        })}
      </TableRow>
      {expanded && renderSubComponent ? (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={cells.length} className="p-0 whitespace-normal">
            <div className="overflow-x-auto">{renderSubComponent(row)}</div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}

interface DataTableDragCellProps {
  column: Parameters<typeof columnBox>[0]
  rowSpan?: number
  colSpan?: number
  className?: string
  onMouseDown: (event: MouseEvent<HTMLTableCellElement>) => void
  onMouseEnter: (event: MouseEvent<HTMLTableCellElement>) => void
  children: ReactNode
}

const DataTableDragCell: FC<DataTableDragCellProps> = ({
  column,
  rowSpan,
  colSpan,
  className,
  onMouseDown,
  onMouseEnter,
  children,
}) => {
  useDndContext()
  const styles = useContext(columnDragStyles)
  const visual = styles?.current.get(column.id)

  return (
    <TableCell
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={cn(
        className,
        (rowSpan ?? 1) > 1 ? 'align-top' : 'truncate',
        visual?.isDragging && 'z-10 bg-background',
      )}
      style={visual?.style}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      {children}
    </TableCell>
  )
}

function headerRows(table: {
  getStartHeaderGroups: () => Array<{
    headers: Array<Header<typeof dataTableFeatures, RowData>>
  }>
  getCenterHeaderGroups: () => Array<{
    headers: Array<Header<typeof dataTableFeatures, RowData>>
  }>
  getEndHeaderGroups: () => Array<{
    headers: Array<Header<typeof dataTableFeatures, RowData>>
  }>
}) {
  const regions = [
    table.getStartHeaderGroups(),
    table.getCenterHeaderGroups(),
    table.getEndHeaderGroups(),
  ]
  const depth = Math.max(0, ...regions.map((groups) => groups.length))
  return Array.from({ length: depth }, (_, index) =>
    regions.flatMap((groups) => groups[index]?.headers ?? []),
  )
}

function footerRows(table: {
  getStartFooterGroups: () => Array<{
    headers: Array<Header<typeof dataTableFeatures, RowData>>
  }>
  getCenterFooterGroups: () => Array<{
    headers: Array<Header<typeof dataTableFeatures, RowData>>
  }>
  getEndFooterGroups: () => Array<{
    headers: Array<Header<typeof dataTableFeatures, RowData>>
  }>
}) {
  const regions = [
    table.getStartFooterGroups(),
    table.getCenterFooterGroups(),
    table.getEndFooterGroups(),
  ]
  const depth = Math.max(0, ...regions.map((groups) => groups.length))
  return Array.from({ length: depth }, (_, index) =>
    regions.flatMap((groups) => groups[index]?.headers ?? []),
  )
}

function hasVerticalSpan(table: {
  getCellSpanIndex: () => { rowSpans: Record<string, ArrayLike<number>> }
}) {
  return Object.values(table.getCellSpanIndex().rowSpans).some((spans) =>
    Array.from(spans).some((span) => span > 1),
  )
}

function columnLabel(column: { id: string; columnDef: { header?: unknown } }) {
  return typeof column.columnDef.header === 'string'
    ? column.columnDef.header
    : column.id
}

function fixedStartIds(table: { getColumn: (id: string) => unknown }) {
  return ['expander', 'select'].filter((id) => table.getColumn(id))
}

function pinEdge(
  table: {
    getStartVisibleLeafColumns: () => Array<{ id: string }>
    getEndVisibleLeafColumns: () => Array<{ id: string }>
  },
  column: { id: string; getIsPinned: () => false | 'start' | 'end' },
) {
  const pinned = column.getIsPinned()
  if (pinned === 'start') {
    const columns = table.getStartVisibleLeafColumns()
    if (columns.at(-1)?.id === column.id) return 'start'
  }
  if (pinned === 'end') {
    const columns = table.getEndVisibleLeafColumns()
    if (columns[0]?.id === column.id) return 'end'
  }
  return undefined
}

function reorderableColumnIds(table: {
  state: { columnOrder: Array<string> }
  getAllLeafColumns: () => Array<{
    id: string
    getIsPinned: () => false | 'start' | 'end'
  }>
}) {
  const columns = table.getAllLeafColumns()
  const byId = new Map(columns.map((column) => [column.id, column]))
  const order =
    table.state.columnOrder.length > 0
      ? table.state.columnOrder
      : columns.map((column) => column.id)
  return order.filter((id) => {
    const column = byId.get(id)
    return column ? canReorderColumn(column) && column.id !== '' : false
  })
}

function pinColumn(
  table: {
    state: { columnPinning: { start?: Array<string>; end?: Array<string> } }
    getColumn: (id: string) => unknown
    setColumnPinning: (pinning: {
      start: Array<string>
      end: Array<string>
    }) => void
  },
  columnId: string,
  position: 'start' | 'end' | false,
) {
  const lockedStart = fixedStartIds(table)
  const start = (table.state.columnPinning.start ?? []).filter(
    (id) => id !== columnId && !lockedStart.includes(id),
  )
  const end = (table.state.columnPinning.end ?? []).filter(
    (id) => id !== columnId && id !== 'actions',
  )
  if (position === 'start') start.push(columnId)
  if (position === 'end') end.push(columnId)
  table.setColumnPinning({
    start: [...lockedStart, ...start],
    end: table.getColumn('actions') ? [...end, 'actions'] : end,
  })
}

function readRowExpanded(row: {
  id: string
  table: {
    options: {
      state?: {
        expanded?: true | Record<string, boolean>
      }
    }
    atoms: {
      expanded?: { get: () => true | Record<string, boolean> | undefined }
    }
  }
}) {
  const controlled = row.table.options.state?.expanded
  if (controlled == null) {
    const expanded = row.table.atoms.expanded?.get() ?? {}
    if (expanded === true) return true
    return expanded[row.id] === true
  }
  if (controlled === true) return true
  return controlled[row.id] === true
}

function shouldIgnoreSelection(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest('button, input, a, [role="checkbox"]') != null
  )
}

const dataTable = createTableHook({
  features: dataTableFeatures,
  defaultColumn: {
    size: 160,
    minSize: 80,
    maxSize: 480,
    filterFn: 'includesString',
    sortFn: 'alphanumeric',
    enableColumnFilter: false,
  },
  columnResizeMode: 'onChange',
  tableComponents: {
    Toolbar: DataTableToolbar,
    Search: DataTableSearch,
    ViewOptions: DataTableViewOptions,
    Pagination: DataTablePagination,
    Grid: DataTableGrid,
  },
  headerComponents: {
    SortButton: DataTableSortButton,
    ResizeHandle: DataTableResizeHandle,
    ColumnMenu: DataTableColumnMenu,
  },
})

function withPinnedUtilityColumns<
  T extends {
    columnPinning?: { start?: Array<string>; end?: Array<string> }
  },
>(initialState: T | undefined, columns: ReadonlyArray<{ id?: string }>) {
  const ids = new Set(columns.map((column) => column.id))
  const lockedStart = ['expander', 'select'].filter((id) => ids.has(id))
  const hasActions = ids.has('actions')
  if (lockedStart.length === 0 && !hasActions) return initialState
  const start = initialState?.columnPinning?.start ?? []
  const end = initialState?.columnPinning?.end ?? []
  return {
    ...initialState,
    columnPinning: {
      start: [
        ...lockedStart,
        ...start.filter((id) => !lockedStart.includes(id)),
      ],
      end: hasActions
        ? [
            ...end.filter(
              (id) => id !== 'actions' && !lockedStart.includes(id),
            ),
            'actions',
          ]
        : end.filter((id) => !lockedStart.includes(id)),
    },
  }
}

export const useAppTable: typeof dataTable.useAppTable = (options) => {
  return dataTable.useAppTable({
    autoResetExpanded: false,
    enableRowSelection: true,
    ...options,
    getIsRowExpanded:
      options.getIsRowExpanded ?? ((row) => readRowExpanded(row)),
    initialState: withPinnedUtilityColumns(
      options.initialState,
      options.columns as ReadonlyArray<{ id?: string }>,
    ),
  })
}
export const createAppColumnHelper = dataTable.createAppColumnHelper
const useTableContext = dataTable.useTableContext
const useHeaderContext = dataTable.useHeaderContext

function visiblePageRows(table: {
  getTopRows: () => Array<{ id: string; getCanSelect: () => boolean }>
  getCenterRows: () => Array<{ id: string; getCanSelect: () => boolean }>
  getBottomRows: () => Array<{ id: string; getCanSelect: () => boolean }>
}) {
  return [
    ...table.getTopRows(),
    ...table.getCenterRows(),
    ...table.getBottomRows(),
  ].filter((row) => row.getCanSelect())
}

export const DataTableSelectAll: FC = () => {
  const table = useTableContext()

  return (
    <table.Subscribe
      selector={(state) => ({
        pageIndex: state.pagination.pageIndex,
        pageSize: state.pagination.pageSize,
        rowSelection: state.rowSelection,
      })}
    >
      {({ rowSelection }) => {
        const pageRows = visiblePageRows(table)
        const selectedCount = pageRows.filter(
          (row) => rowSelection[row.id],
        ).length
        const all = pageRows.length > 0 && selectedCount === pageRows.length
        const some = selectedCount > 0 && !all
        return (
          <Checkbox
            aria-label="Pilih semua baris"
            checked={all ? true : some ? 'indeterminate' : false}
            onCheckedChange={(value) => {
              const selected = !!value
              table.setRowSelection((current) => {
                const next = { ...current }
                for (const row of visiblePageRows(table)) {
                  if (selected) next[row.id] = true
                  else delete next[row.id]
                }
                return next
              })
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          />
        )
      }}
    </table.Subscribe>
  )
}

interface DataTableSelectRowProps {
  row: {
    id: string
    getIsSelected: () => boolean
    getIsSomeSelected: () => boolean
    getIsAllSubRowsSelected: () => boolean
    getCanSelect: () => boolean
    toggleSelected: (value?: boolean) => void
  }
  label?: string
}

export const DataTableSelectRow: FC<DataTableSelectRowProps> = ({
  row,
  label = 'Pilih baris',
}) => {
  const table = useTableContext()

  return (
    <table.Subscribe selector={(state) => state.rowSelection[row.id]}>
      {() => (
        <Checkbox
          aria-label={label}
          checked={
            row.getIsAllSubRowsSelected()
              ? true
              : row.getIsSomeSelected()
                ? 'indeterminate'
                : row.getIsSelected()
          }
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        />
      )}
    </table.Subscribe>
  )
}

interface DataTableExpandProps {
  row: {
    id: string
    getIsExpanded: () => boolean
    toggleExpanded: (expanded?: boolean) => void
  }
  label?: string
}

export const DataTableExpand: FC<DataTableExpandProps> = ({ row, label }) => {
  const control = useContext(rowExpandControl)
  const expanded = resolveExpanded(row, control)
  const text = label
    ? `${expanded ? 'Ciutkan' : 'Bentangkan'} ${label}`
    : expanded
      ? 'Ciutkan baris'
      : 'Bentangkan baris'
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground"
      aria-label={text}
      aria-expanded={expanded}
      onClick={(event) => {
        event.stopPropagation()
        const next = !expanded
        control?.setOpen(row.id, next)
        row.toggleExpanded(next)
      }}
    >
      {expanded ? (
        <ChevronUp className="opacity-60" />
      ) : (
        <ChevronDown className="opacity-60" />
      )}
    </Button>
  )
}

interface DataTableFrameProps {
  children: ReactNode
}

export const DataTableFrame: FC<DataTableFrameProps> = ({ children }) => {
  return (
    <TooltipProvider>
      <div className="grid gap-4">{children}</div>
    </TooltipProvider>
  )
}
