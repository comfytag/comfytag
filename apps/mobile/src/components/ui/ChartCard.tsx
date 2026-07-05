import React from 'react'
import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import Svg, { Rect, Line, Text as SvgText, Path } from 'react-native-svg'
import { colors, sp, rd, fs } from '@comfytag/ui/tokens'
import { formatNaira } from '../../lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string
  value: number
}

export interface ChartCardProps {
  title: string
  data: ChartDataPoint[]
  type?: 'bar' | 'line'
  height?: number
  formatValue?: (v: number) => string
  accentColor?: string
  style?: ViewStyle
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({
  data,
  width,
  height,
  accentColor,
  formatValue,
}: {
  data: ChartDataPoint[]
  width: number
  height: number
  accentColor: string
  formatValue: (v: number) => string
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const barW = Math.max((width - sp[8]) / (data.length * 1.6), 8)
  const gap = (width - data.length * barW) / (data.length + 1)
  const chartH = height - 36

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const barH = Math.max((d.value / maxVal) * chartH, 2)
        const x = gap + i * (barW + gap)
        const y = chartH - barH

        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={accentColor}
              rx={4}
              opacity={i === data.length - 1 ? 1 : 0.5}
            />
            <SvgText
              x={x + barW / 2}
              y={height - 4}
              textAnchor="middle"
              fill={colors.mobile.textMuted}
              fontSize="10"
            >
              {d.label.slice(0, 3)}
            </SvgText>
          </React.Fragment>
        )
      })}
    </Svg>
  )
}

// ─── Line chart ───────────────────────────────────────────────────────────────

function LineChart({
  data,
  width,
  height,
  accentColor,
}: {
  data: ChartDataPoint[]
  width: number
  height: number
  accentColor: string
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const chartH = height - 36
  const step = (width - sp[8]) / Math.max(data.length - 1, 1)
  const pad = sp[4]

  const points = data.map((d, i) => ({
    x: pad + i * step,
    y: chartH - (d.value / maxVal) * chartH + sp[2],
  }))

  const pathD =
    points.length > 0
      ? `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
      : ''

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathD}
        stroke={accentColor}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Rect
            x={p.x - 3}
            y={p.y - 3}
            width={6}
            height={6}
            rx={3}
            fill={accentColor}
          />
          <SvgText
            x={p.x}
            y={height - 4}
            textAnchor="middle"
            fill={colors.mobile.textMuted}
            fontSize="10"
          >
            {data[i].label.slice(0, 3)}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  )
}

// ─── ChartCard ─────────────────────────────────────────────────────────────────

export function ChartCard({
  title,
  data,
  type = 'bar',
  height = 140,
  formatValue = (v) => formatNaira(v),
  accentColor = colors.brand.DEFAULT,
  style,
}: ChartCardProps) {
  const [containerWidth, setContainerWidth] = React.useState(280)

  if (data.length === 0) {
    return (
      <View style={[styles.card, { height: height + 60 }, style]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      </View>
    )
  }

  const maxVal = Math.max(...data.map((d) => d.value))
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <View
      style={[styles.card, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - sp[10])}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.total}>{formatValue(total)}</Text>
      </View>

      {type === 'bar' ? (
        <BarChart
          data={data}
          width={containerWidth}
          height={height}
          accentColor={accentColor}
          formatValue={formatValue}
        />
      ) : (
        <LineChart
          data={data}
          width={containerWidth}
          height={height}
          accentColor={accentColor}
        />
      )}
    </View>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.mobile.surface,
    borderRadius: rd.xl,
    padding: sp[5],
    borderWidth: 1,
    borderColor: colors.mobile.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sp[4],
  },
  title: {
    fontSize: fs.base,
    fontWeight: '700',
    color: colors.mobile.textPrimary,
  },
  total: {
    fontSize: fs.sm,
    color: colors.mobile.textSecondary,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.mobile.textMuted,
    fontSize: fs.sm,
  },
})
