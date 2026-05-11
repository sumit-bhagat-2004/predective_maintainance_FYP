'use client'

import { useState, useEffect, useTransition } from 'react'
import { BarChart3, RefreshCw, Clock } from 'lucide-react'
import { api, type SensorReading, type SensorStats } from '@/lib/api'
import HistoryTable from '@/components/HistoryTable'
import LiveChart from '@/components/LiveChart'

const WINDOWS = [
  { label: '15 min', hours: 0.25 },
  { label: '1 hr',   hours: 1    },
  { label: '6 hr',   hours: 6    },
  { label: '24 hr',  hours: 24   },
  { label: '7 days', hours: 168  },
]

export default function HistoryPage() {
  const [windowIdx, setWindowIdx] = useState(1)   // default: 1 hr
  const [data,    setData]    = useState<SensorReading[]>([])
  const [stats,   setStats]   = useState<SensorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [, startTransition]   = useTransition()

  const hours = WINDOWS[windowIdx].hours

  const load = async () => {
    setLoading(true)
    try {
      const [rows, st] = await Promise.all([
        api.getHistory(hours, 1000),
        api.getStats(hours),
      ])
      setData(rows)
      setStats(st)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [windowIdx])

  // Convert rows to chart data (chronological)
  const chartData = [...data].reverse().map(r => ({
    ts:    new Date(r.timestamp).getTime(),
    value: r.accel_rms,
  }))
  const tempData = [...data].reverse().map(r => ({
    ts:    new Date(r.timestamp).getTime(),
    value: r.temperature ?? 0,
  }))
  const currData = [...data].reverse().map(r => ({
    ts:    new Date(r.timestamp).getTime(),
    value: r.current_ma ?? 0,
  }))

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-400" />
            Historical Data
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Sensor history stored from AWS IoT Core
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Time window selector */}
      <div className="flex gap-2">
        {WINDOWS.map(({ label }, i) => (
          <button
            key={i}
            onClick={() => setWindowIdx(i)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={i === windowIdx
              ? { background: '#4f46e5', color: 'white', boxShadow: '0 0 16px rgba(79,70,229,0.4)' }
              : { background: 'rgba(99,102,241,0.1)', color: 'var(--text-secondary)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Readings',     value: stats.sample_count.toLocaleString(), unit: '' },
            { label: 'Avg Temp',     value: stats.temperature.avg_c.toFixed(1),  unit: '°C' },
            { label: 'Max Vib RMS',  value: stats.vibration.max_rms.toFixed(3),  unit: 'm/s²' },
            { label: 'Avg Current',  value: stats.power.avg_current_ma.toFixed(0), unit: 'mA' },
          ].map(({ label, value, unit }) => (
            <div key={label} className="glass-card p-4">
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="font-mono text-2xl font-bold text-indigo-300">
                {value}
                <span className="text-sm ml-1" style={{ color: 'var(--text-secondary)' }}>{unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <LiveChart data={chartData} label="Vibration RMS" unit="m/s²" color="#6366f1" threshold={1.5} />
        <LiveChart data={tempData}  label="Temperature"   unit="°C"   color="#f97316" threshold={60}  />
        <LiveChart data={currData}  label="Current"       unit="mA"   color="#f59e0b" threshold={3000}/>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
          Loading…
        </div>
      ) : (
        <HistoryTable data={data} />
      )}
    </div>
  )
}
