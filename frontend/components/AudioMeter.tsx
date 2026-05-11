'use client'

import { Mic } from 'lucide-react'

interface AudioMeterProps {
  rms:  number | null
  peak: number | null
}

const MAX_LEVEL = 32768  // 16-bit PCM max

export default function AudioMeter({ rms, peak }: AudioMeterProps) {
  const rmsPct  = Math.min(((rms  ?? 0) / MAX_LEVEL) * 100, 100)
  const peakPct = Math.min(((peak ?? 0) / MAX_LEVEL) * 100, 100)

  const barColor = rmsPct > 70
    ? '#ef4444'
    : rmsPct > 40
    ? '#eab308'
    : '#22c55e'

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(168,85,247,0.15)' }}>
          <Mic size={16} style={{ color: '#a855f7' }} />
        </div>
        <div>
          <p className="text-sm font-semibold">INMP441 Acoustic</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>16 kHz I2S Microphone</p>
        </div>
      </div>

      {/* RMS bar */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text-secondary)' }}>RMS Level</span>
            <span className="font-mono" style={{ color: barColor }}>{rms?.toFixed(0) ?? '—'}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${rmsPct}%`, background: barColor, boxShadow: `0 0 8px ${barColor}88` }}
            />
          </div>
        </div>

        {/* Peak bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: 'var(--text-secondary)' }}>Peak Level</span>
            <span className="font-mono" style={{ color: '#a855f7' }}>{peak?.toFixed(0) ?? '—'}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{ width: `${peakPct}%`, background: 'linear-gradient(90deg,#a855f7,#7c3aed)' }}
            />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        <span>Bearing squeak @ 3-8 kHz</span>
        <span>{rmsPct > 60 ? '⚠ High noise' : rmsPct > 0 ? '✓ Normal' : '— No data'}</span>
      </div>
    </div>
  )
}
