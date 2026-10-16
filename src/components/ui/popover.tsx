import type { ComponentProps, FC } from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cn } from '#/lib/utils'

interface PopoverProps extends ComponentProps<typeof PopoverPrimitive.Root> {}

const Popover: FC<PopoverProps> = (props) => {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

interface PopoverTriggerProps extends ComponentProps<
  typeof PopoverPrimitive.Trigger
> {}

const PopoverTrigger: FC<PopoverTriggerProps> = (props) => {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

interface PopoverContentProps extends ComponentProps<
  typeof PopoverPrimitive.Content
> {}

const PopoverContent: FC<PopoverContentProps> = ({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

interface PopoverAnchorProps extends ComponentProps<
  typeof PopoverPrimitive.Anchor
> {}

const PopoverAnchor: FC<PopoverAnchorProps> = (props) => {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

interface PopoverHeaderProps extends ComponentProps<'div'> {}

const PopoverHeader: FC<PopoverHeaderProps> = ({ className, ...props }) => {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-1 text-sm', className)}
      {...props}
    />
  )
}

interface PopoverTitleProps extends ComponentProps<'h2'> {}

const PopoverTitle: FC<PopoverTitleProps> = ({ className, ...props }) => {
  return (
    <h2
      data-slot="popover-title"
      className={cn('font-medium', className)}
      {...props}
    />
  )
}

interface PopoverDescriptionProps extends ComponentProps<'p'> {}

const PopoverDescription: FC<PopoverDescriptionProps> = ({
  className,
  ...props
}) => {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
}
