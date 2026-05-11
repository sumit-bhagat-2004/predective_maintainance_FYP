'use client'

import { useState } from 'react'
import { Zap, RotateCcw, Square, Play } from 'lucide-react'
import { api } from '@/lib/api'

interface MotorControlProps {
  currentPWM:    number
  currentFwd:    boolean
  dutyPct:       number
  voltageMV:     number | null
  currentMA:     number | null
  powerW:        number | null
}

export default function MotorControl({
  currentPWM, currentFwd, dutyPct, voltageMV, currentMA, powerW
}: MotorControlProps) {
  const [pwm,     setPwm]     = useState(currentPWM)
  const [forward, setForward] = useState(currentFwd)
  const [loading, setLoading] = useState(false)
  const [msg,     setMsg]     = useState<string | null>(null)

  const sendCmd = async (p: number, fwd: boolean) => {
    setLoading(true)
    setMsg(null)
    try {
      await api.controlMotor(p, fwd)
      setMsg(`✓ Command sent: ${Math.round((p / 255) * 100)}% ${fwd ? 'FWD' : 'REV'}`)
    } catch (e: any) {
      setMsg(`✗ ${e.message}`)
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  const duty = Math.round((pwm / 255) * 100)

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-indigo-400" />
        <h2 className="text-base font-semibold">Motor Control (L298N)</h2>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Voltage',  value: voltageMV?.toFixed(2) ?? '—',   unit: 'V',   color: '#22c55e' },
          { label: 'Current',  value: currentMA?.toFixed(0) ?? '—',   unit: 'mA',  color: '#f59e0b' },
          { label: 'Power',    value: powerW?.toFixed(2)    ?? '—',   unit: 'W',   color: '#6366f1' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} className="rounded-lg p-3 text-center"
            style={{ background: 'rgba(99,102,241,0.07)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="font-mono text-lg font-bold" style={{ color }}>
              {value}<span className="text-xs ml-0.5" style={{ color: 'var(--text-secondary)' }}>{unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Speed slider */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Speed</span>
          <span className="text-sm font-mono font-bold text-indigo-400">{duty}%</span>
        </div>
        <input
          type="range" min={0} max={255} value={pwm}
          onChange={e => setPwm(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>

      {/* Direction toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setForward(true)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            forward ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : ''
          }`}
          style={!forward ? { background: 'rgba(99,102,241,0.1)', color: 'var(--text-secondary)' } : {}}
        >
          <Play size={14}/> Forward
        </button>
        <button
          onClick={() => setForward(false)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            !forward ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : ''
          }`}
          style={forward ? { background: 'rgba(99,102,241,0.1)', color: 'var(--text-secondary)' } : {}}
        >
          <RotateCcw size={14}/> Reverse
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => sendCmd(pwm, forward)}
          disabled={loading}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
        >
          <Zap size={14}/>
          {loading ? 'Sending…' : 'Apply'}
        </button>
        <button
          onClick={() => { setPwm(0); sendCmd(0, true) }}
          disabled={loading}
          className="btn-danger flex items-center justify-center gap-2 px-4"
        >
          <Square size={14}/> Stop
        </button>
      </div>

      {/* Feedback message */}
      {msg && (
        <p
          className="text-xs text-center py-2 rounded-lg animate-fade-in"
          style={{
            color:      msg.startsWith('✓') ? '#22c55e' : '#ef4444',
            background: msg.startsWith('✓') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          }}
        >
          {msg}
        </p>
      )}

      {/* Current state from ESP32 */}
      <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        ESP32 reports: {Math.round((currentPWM / 255) * 100)}% &nbsp;•&nbsp;
        {currentFwd ? 'Forward' : 'Reverse'}
      </div>
    </div>
  )
}
