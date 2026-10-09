import type { ComponentProps, FC } from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import {
  CircleCheck,
  CircleDashed,
  Clock,
  Timer,
  TriangleAlert,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import { cn } from '#/lib/utils'

const tinted = {
  success: 'bg-success/50 text-success-foreground dark:bg-success/80',
  info: 'bg-info/50 text-info-foreground dark:bg-info/80',
  warning: 'bg-warning/50 text-warning-foreground dark:bg-warning/80',
  accent: 'bg-accent/50 text-accent-foreground dark:bg-accent/80',
} as const

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        destructive:
          'bg-destructive/50 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/50 dark:text-destructive-foreground dark:focus-visible:ring-destructive/40',
        outline:
          'border bg-background shadow-xs [a&]:hover:bg-secondary [a&]:hover:text-secondary-foreground dark:border-input dark:bg-input/30 dark:[a&]:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80',
        ghost: '[a&]:hover:bg-secondary [a&]:hover:text-secondary-foreground',
        link: 'text-primary underline-offset-4 [a&]:hover:underline',
        success: tinted.success,
        info: tinted.info,
        warning: tinted.warning,
        neutral: 'bg-neutral text-neutral-foreground',
        accent: tinted.accent,
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface BadgeProps
  extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

const Badge: FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

const statusIcons = {
  warning: Clock,
  info: TriangleAlert,
  success: CircleCheck,
  neutral: CircleDashed,
  destructive: X,
  accent: Timer,
} as const

interface StatusBadgeProps extends Pick<
  BadgeProps,
  'size' | 'className' | 'children'
> {
  variant: keyof typeof statusIcons
  icon?: LucideIcon
}

const StatusBadge: FC<StatusBadgeProps> = ({
  variant,
  size = 'xs',
  icon,
  children,
  className,
}) => {
  const Icon = icon ?? statusIcons[variant]
  return (
    <Badge variant={variant} size={size} className={className}>
      <Icon />
      {children}
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants }
