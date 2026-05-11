'use client'

import { type LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export type StatusLevel = 'normal' | 'warning' | 'alarm' | 'offline'

interface SensorCardProps {
  title:    string
  value:    number | null | undefined
  unit:     string
  icon:     LucideIcon
  status?:  StatusLevel
  subtitle?: string
  decimals?: number
  color?:   string   // CSS color override for icon + value
}

const statusStyles: Record<StatusLevel, { border: string; glow: string; badge: string; label: string }> = {
  normal:  { border: 'rgba(34,197,94,0.3)',   glow: 'rgba(34,197,94,0.06)',    badge: 'badge-green',  label: 'Normal'  },
  warning: { border: 'rgba(234,179,8,0.4)',   glow: 'rgba(234,179,8,0.08)',    badge: 'badge-yellow', label: 'Warning' },
  alarm:   { border: 'rgba(239,68,68,0.5)',   glow: 'rgba(239,68,68,0.1)',     badge: 'badge-red',    label: 'Alarm'   },
  offline: { border: 'rgba(99,102,241,0.15)', glow: 'rgba(0,0,0,0)',           badge: 'badge-blue',   label: 'Offline' },
}

export default function SensorCard({
  title, value, unit, icon: Icon,
  status = 'normal', subtitle, decimals = 2, color,
}: SensorCardProps) {
  const st  = statusStyles[status]
  const fmt = (v: number | null | undefined) =>
    v == null ? '—' : v.toFixed(decimals)

  return (
    <div
      className="glass-card p-5 flex flex-col gap-3 animate-fade-in"
      style={{ borderColor: st.border, boxShadow: `0 0 30px ${st.glow}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color || '#6366f1'}22` }}
          >
            <Icon size={16} style={{ color: color || '#6366f1' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </span>
        </div>
        <span className={st.badge}>{st.label}</span>
      </div>

      {/* Value */}
      <div className="flex items-end gap-1">
        <span
          className="metric-value"
          style={{ color: color || 'var(--text-primary)' }}
        >
          {fmt(value)}
        </span>
        <span className="metric-unit pb-1">{unit}</span>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
