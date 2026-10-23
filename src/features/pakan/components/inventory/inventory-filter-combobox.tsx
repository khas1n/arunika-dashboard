import type { FC } from 'react'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '#/components/ui/combobox'

export interface FilterOption {
  value: string
  label: string
}

interface InventoryFilterComboboxProps {
  label: string
  value: string | null
  options: Array<FilterOption>
  allLabel: string
  onChange: (value: string | null) => void
}

export const InventoryFilterCombobox: FC<InventoryFilterComboboxProps> = ({
  label,
  value,
  options,
  allLabel,
  onChange,
}) => {
  const items = [{ value: '', label: allLabel }, ...options]
  const selected =
    items.find((item) => item.value === (value ?? '')) ?? items[0]

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(next) => {
        if (!next || next.value === '') onChange(null)
        else onChange(next.value)
      }}
      isItemEqualToValue={(item, current) => item.value === current.value}
    >
      <ComboboxTrigger
        aria-label={label}
        className="flex h-9 w-56 items-center justify-between gap-2 rounded-md border bg-background px-3 text-sm shadow-xs"
      >
        <span className="truncate">{selected.label}</span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxEmpty>Tidak ada.</ComboboxEmpty>
        <ComboboxList>
          {(item: FilterOption) => (
            <ComboboxItem key={item.value || 'all'} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
