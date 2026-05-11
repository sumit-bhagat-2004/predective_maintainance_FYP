'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  ts:    number   // epoch ms
  value: number
}

interface LiveChartProps {
  data:        DataPoint[]
  label:       string
  unit:        string
  color?:      string
  maxPoints?:  number
  threshold?:  number    // Optional alarm threshold line
  height?:     number
  yDomain?:    [number | 'auto', number | 'auto']
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-bright)',
        borderRadius: 8, padding: '6px 12px', fontSize: 12,
      }}
    >
      <p style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>
        {format(new Date(label), 'HH:mm:ss')}
      </p>
      <p style={{ color: payload[0].color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
        {payload[0].value?.toFixed(3)} {unit}
      </p>
    </div>
  )
}

export default function LiveChart({
  data, label, unit,
  color     = '#6366f1',
  maxPoints = 60,
  threshold,
  height    = 180,
  yDomain   = ['auto', 'auto'],
}: LiveChartProps) {
  const visible = data.slice(-maxPoints)

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span className="text-xs font-mono" style={{ color }}>
          {visible.at(-1)?.value?.toFixed(3) ?? '—'} {unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={visible} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={['dataMin', 'dataMax']}
            scale="time"
            tickFormatter={(v) => format(new Date(v), 'HH:mm:ss')}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          {threshold !== undefined && (
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{ value: 'Alarm', fill: '#ef4444', fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}  // disable for perf on live data
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
