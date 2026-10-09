import { useMemo } from 'react'
import type { FC } from 'react'
import { defineChart, dot, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import type { BiomassPoint } from '#/features/pakan/schemas/kolam'

const seriesStroke = 'var(--chart-1)'

interface BiomassChartProps {
  pondCode: string
  points: Array<BiomassPoint>
}

export const BiomassChart: FC<BiomassChartProps> = ({ pondCode, points }) => {
  const ordered = useMemo(
    () =>
      [...points].sort((left, right) =>
        left.date < right.date ? -1 : left.date > right.date ? 1 : 0,
      ),
    [points],
  )
  const definition = useMemo(() => {
    const mark =
      ordered.length >= 2
        ? lineY(ordered, {
            x: 'date',
            y: 'biomassGrams',
            stroke: seriesStroke,
            strokeWidth: 2,
          })
        : dot(ordered, {
            x: 'date',
            y: 'biomassGrams',
            fill: seriesStroke,
          })
    return defineChart({
      marks: [mark],
      scales: {
        x: { scale: scalePoint, axis: { label: 'Tanggal' } },
        y: { scale: scaleLinear, axis: { label: 'Biomassa (g)' } },
      },
    })
  }, [ordered])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Biomassa</CardTitle>
        <CardDescription>Seluruh siklus, dalam gram.</CardDescription>
      </CardHeader>
      <CardContent>
        {ordered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada biomassa.</p>
        ) : (
          <Chart
            definition={definition}
            height={288}
            initialWidth={640}
            className="w-full"
            ariaLabel={`Biomassa kolam ${pondCode} sepanjang siklus`}
            ariaDescription="Satu titik per hari yang punya biomassa. Angka tiap hari ada di catatan harian."
          />
        )}
      </CardContent>
    </Card>
  )
}
