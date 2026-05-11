'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, ChevronUp, ChevronDown } from 'lucide-react'
import type { SensorReading } from '@/lib/api'

interface HistoryTableProps {
  data: SensorReading[]
}

type SortKey = keyof SensorReading
type SortDir = 'asc' | 'desc'

function exportCSV(rows: SensorReading[]) {
  const headers = [
    'timestamp','accel_rms','temperature','humidity','pressure',
    'voltage','current_ma','power_w','load_g','audio_rms',
    'motor_pwm','motor_duty_pct'
  ]
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      r.timestamp, r.accel_rms, r.temperature, r.humidity, r.pressure,
      r.voltage, r.current_ma, r.power_w, r.load_g, r.audio_rms,
      r.motor_pwm, r.motor_duty_pct,
    ].join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `sensor_history_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const fmt = (v: number | null | undefined, d = 2) =>
  v == null ? '—' : v.toFixed(d)

export default function HistoryTable({ data }: HistoryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('timestamp')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] as any
    const bv = b[sortKey] as any
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
  })

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const Th = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(col)}
      className="px-3 py-2.5 text-left text-xs font-semibold cursor-pointer select-none hover:text-indigo-400 transition-colors whitespace-nowrap"
      style={{ color: sortKey === col ? '#818cf8' : 'var(--text-secondary)' }}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortKey === col
          ? (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)
          : <ChevronDown size={12} style={{ opacity: 0.3 }}/>
        }
      </span>
    </th>
  )

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-sm font-semibold">{data.length} readings</span>
        <button
          onClick={() => exportCSV(data)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
        >
          <Download size={12}/> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead style={{ background: 'rgba(99,102,241,0.05)' }}>
            <tr>
              <Th col="timestamp"   label="Timestamp"    />
              <Th col="accel_rms"   label="Vib RMS"      />
              <Th col="temperature" label="Temp °C"      />
              <Th col="humidity"    label="Humid %"      />
              <Th col="pressure"    label="Press hPa"    />
              <Th col="voltage"     label="Voltage V"    />
              <Th col="current_ma"  label="Current mA"   />
              <Th col="power_w"     label="Power W"      />
              <Th col="load_g"      label="Load g"       />
              <Th col="audio_rms"   label="Audio RMS"    />
              <Th col="motor_duty_pct" label="Motor %"   />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr
                key={r.id}
                className="border-t hover:bg-indigo-500/5 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                  {format(new Date(r.timestamp), 'MMM d, HH:mm:ss')}
                </td>
                <td className="px-3 py-2" style={{ color: r.accel_rms > 2 ? '#ef4444' : '#22c55e' }}>
                  {fmt(r.accel_rms, 3)}
                </td>
                <td className="px-3 py-2" style={{ color: (r.temperature ?? 0) > 55 ? '#ef4444' : 'var(--text-primary)' }}>
                  {fmt(r.temperature, 1)}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                  {fmt(r.humidity, 1)}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                  {fmt(r.pressure, 1)}
                </td>
                <td className="px-3 py-2" style={{ color: (r.voltage ?? 12) < 10.5 ? '#ef4444' : '#22c55e' }}>
                  {fmt(r.voltage, 2)}
                </td>
                <td className="px-3 py-2" style={{ color: (r.current_ma ?? 0) > 3000 ? '#ef4444' : 'var(--text-primary)' }}>
                  {fmt(r.current_ma, 1)}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                  {fmt(r.power_w, 2)}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                  {fmt(r.load_g, 1)}
                </td>
                <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                  {fmt(r.audio_rms, 1)}
                </td>
                <td className="px-3 py-2">
                  <div
                    className="w-16 h-4 rounded-full overflow-hidden"
                    style={{ background: 'rgba(99,102,241,0.15)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${r.motor_duty_pct}%`,
                        background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                      }}
                    />
                  </div>
                  <span style={{ color: 'var(--text-secondary)' }}>{r.motor_duty_pct}%</span>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  No data in selected range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
