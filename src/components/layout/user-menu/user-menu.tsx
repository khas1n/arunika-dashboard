import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

export function UserMenu({
  name,
  email,
  image,
  onSignOut,
}: {
  name: string
  email: string
  image: string | null
  onSignOut: () => void
}) {
  const initial = name.slice(0, 1).toUpperCase() || 'A'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar size="sm">
            {image ? <AvatarImage src={image} alt="" /> : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate sm:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}>Keluar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
