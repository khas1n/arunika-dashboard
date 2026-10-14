import type { FC, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Ellipsis } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'

interface DataTableActionsProps {
  children: ReactNode
}

export const DataTableActions: FC<DataTableActionsProps> = ({ children }) => {
  return <div className="flex items-center justify-end gap-1">{children}</div>
}

interface DataTableActionProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}

export const DataTableAction: FC<DataTableActionProps> = ({
  label,
  icon: Icon,
  onClick,
  disabled = false,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', disabled && 'cursor-not-allowed')}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            disabled={disabled}
            className={cn(disabled && 'pointer-events-none')}
            onClick={onClick}
          >
            <Icon />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

interface DataTableActionMenuItem {
  label: string
  icon: LucideIcon
  onSelect: () => void
  disabled?: boolean
  destructive?: boolean
}

interface DataTableActionMenuProps {
  label: string
  items: Array<DataTableActionMenuItem>
}

export const DataTableActionMenu: FC<DataTableActionMenuProps> = ({
  label,
  items,
}) => {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={label}
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {items.map((item) => {
            const Icon = item.icon
            return (
              <DropdownMenuItem
                key={item.label}
                disabled={item.disabled}
                variant={item.destructive ? 'destructive' : 'default'}
                onSelect={item.onSelect}
              >
                <Icon data-icon="inline-start" />
                {item.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
