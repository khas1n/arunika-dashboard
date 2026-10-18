import { useMemo } from 'react'
import type { FC, ReactNode } from 'react'
import { defineChart, dot, lineY } from '@tanstack/charts'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  formatCalendar,
  formatGrams,
} from '#/features/pakan/components/pond-log/format-pond'

const seriesStroke = 'var(--chart-1)'
const deathStroke = 'var(--chart-2)'

interface BiomassChartProps {
  pondCode: string
  points: Array<{ date: string; biomassGrams: number }>
}

interface MortalityChartProps {
  pondCode: string
  points: Array<{ date: string; deaths: number }>
}

function byDate<T extends { date: string }>(points: Array<T>) {
  return [...points].sort((left, right) =>
    left.date < right.date ? -1 : left.date > right.date ? 1 : 0,
  )
}

export const BiomassChart: FC<BiomassChartProps> = ({ pondCode, points }) => {
  const ordered = useMemo(() => byDate(points), [points])
  const definition = useMemo(() => {
    const mark =
      ordered.length >= 2
        ? lineY(ordered, {
            x: 'date',
            y: 'biomassGrams',
            stroke: seriesStroke,
            strokeWidth: 2,
            points: true,
          })
        : dot(ordered, {
            x: 'date',
            y: 'biomassGrams',
            fill: seriesStroke,
          })
    return defineSeries(
      mark,
      'Biomassa (g)',
      'Biomassa',
      (value) => `${formatGrams(value)} g`,
    )
  }, [ordered])

  return (
    <SeriesCard
      title="Biomassa"
      description="Gram. Hari tanpa biomassa tidak ikut."
      emptyLabel="Belum ada biomassa."
      empty={ordered.length === 0}
    >
      {ordered.length === 0 ? null : (
        <Chart
          definition={definition}
          height={288}
          initialWidth={640}
          className="w-full"
          ariaLabel={`Biomassa kolam ${pondCode} sepanjang siklus`}
          ariaDescription="Satu titik per hari yang punya biomassa."
        />
      )}
    </SeriesCard>
  )
}

export const MortalityChart: FC<MortalityChartProps> = ({
  pondCode,
  points,
}) => {
  const ordered = useMemo(() => byDate(points), [points])
  const definition = useMemo(() => {
    const mark =
      ordered.length >= 2
        ? lineY(ordered, {
            x: 'date',
            y: 'deaths',
            stroke: deathStroke,
            strokeWidth: 2,
            points: true,
          })
        : dot(ordered, {
            x: 'date',
            y: 'deaths',
            fill: deathStroke,
          })
    return defineSeries(mark, 'Kematian (ekor)', 'Kematian', (value) =>
      formatGrams(value),
    )
  }, [ordered])

  return (
    <SeriesCard
      title="Kematian"
      description="Ekor per hari, termasuk nol."
      emptyLabel="Belum ada catatan."
      empty={ordered.length === 0}
    >
      {ordered.length === 0 ? null : (
        <Chart
          definition={definition}
          height={288}
          initialWidth={640}
          className="w-full"
          ariaLabel={`Kematian kolam ${pondCode}`}
          ariaDescription="Jumlah kematian pada hari itu, bukan jumlah kumulatif."
        />
      )}
    </SeriesCard>
  )
}

function defineSeries(
  mark: ReturnType<typeof lineY> | ReturnType<typeof dot>,
  yLabel: string,
  seriesLabel: string,
  formatValue: (value: number) => string,
) {
  return defineChart({
    marks: [mark],
    scales: {
      x: {
        scale: scalePoint,
        axis: {
          label: 'Tanggal',
          ticks: { format: (value: string) => formatCalendar(value) },
        },
      },
      y: {
        scale: scaleLinear,
        axis: {
          label: yLabel,
          ticks: { format: (value: number) => formatGrams(value) },
        },
      },
    },
    focus: 'nearest-x',
    maxFocusDistance: Number.POSITIVE_INFINITY,
    tooltip: {
      use: tooltip,
      anchor: 'point',
      placement: 'auto',
      content: (focused) => ({
        title: formatCalendar(String(focused[0]?.xValue ?? '')),
        rows: focused.map((point) => ({
          label: seriesLabel,
          value: formatValue(Number(point.yValue)),
          color: point.color,
        })),
      }),
    },
  })
}

interface SeriesCardProps {
  title: string
  description: string
  emptyLabel: string
  empty: boolean
  children: ReactNode
}

const SeriesCard: FC<SeriesCardProps> = ({
  title,
  description,
  emptyLabel,
  empty,
  children,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
