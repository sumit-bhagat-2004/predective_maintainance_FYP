'use client'

import { useLiveSensorData } from '@/lib/websocket'
import MotorControl from '@/components/MotorControl'
import LiveChart from '@/components/LiveChart'
import { useEffect, useRef, useState } from 'react'
import { Zap, Activity, Thermometer } from 'lucide-react'

interface Pt { ts: number; value: number }

export default function MotorPage() {
  const { data } = useLiveSensorData()

  const pwmHistory  = useRef<Pt[]>([])
  const currHistory = useRef<Pt[]>([])
  const voltHistory = useRef<Pt[]>([])
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!data) return
    const ts = Date.now()
    const push = (buf: React.MutableRefObject<Pt[]>, val: number | null | undefined) => {
      if (val == null) return
      buf.current.push({ ts, value: val })
      if (buf.current.length > 120) buf.current.shift()
    }
    push(pwmHistory,  data.motor.duty_pct)
    push(currHistory, data.power.current_ma)
    push(voltHistory, data.power.voltage_v)
    forceRender(n => n + 1)
  }, [data])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap size={24} className="text-indigo-400" /> Motor Control
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          L298N driver control via AWS IoT MQTT → ESP32
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Control panel */}
        <div className="md:col-span-1">
          <MotorControl
            currentPWM={data?.motor.pwm      ?? 0}
            currentFwd={data?.motor.forward  ?? true}
            dutyPct={data?.motor.duty_pct    ?? 0}
            voltageMV={data?.power.voltage_v ?? null}
            currentMA={data?.power.current_ma ?? null}
            powerW={data?.power.power_w       ?? null}
          />
        </div>

        {/* Charts */}
        <div className="md:col-span-2 space-y-4">
          <LiveChart
            data={pwmHistory.current}
            label="Motor Duty Cycle"
            unit="%"
            color="#6366f1"
            yDomain={[0, 100]}
          />
          <LiveChart
            data={currHistory.current}
            label="Motor Current (INA219)"
            unit="mA"
            color="#f59e0b"
            threshold={3000}
          />
          <LiveChart
            data={voltHistory.current}
            label="Supply Voltage (INA219)"
            unit="V"
            color="#22c55e"
            threshold={10.5}
            yDomain={[8, 14]}
          />
        </div>
      </div>

      {/* Reference info */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          L298N Control Reference
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          {[
            { cmd: 'pwm=0,   fwd=T', result: 'Motor STOP',         color: '#ef4444' },
            { cmd: 'pwm=128, fwd=T', result: '50% Forward',         color: '#22c55e' },
            { cmd: 'pwm=255, fwd=T', result: '100% Full Forward',   color: '#22c55e' },
            { cmd: 'pwm=128, fwd=F', result: '50% Reverse',         color: '#f59e0b' },
          ].map(({ cmd, result, color }) => (
            <div key={cmd} className="rounded-lg p-3" style={{ background: 'rgba(99,102,241,0.06)' }}>
              <p style={{ color: '#818cf8' }}>{cmd}</p>
              <p className="mt-1 font-sans font-medium" style={{ color }}>{result}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Commands are sent from this dashboard → FastAPI → AWS IoT MQTT → ESP32 → L298N.
          Current feedback is read from INA219 in series with the motor supply.
        </p>
      </div>
    </div>
  )
}
