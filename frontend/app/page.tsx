'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Activity, Thermometer, Droplets, Gauge,
  Zap, Battery, Weight, Wifi, WifiOff, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { useLiveSensorData } from '@/lib/websocket'
import SensorCard, { StatusLevel } from '@/components/SensorCard'
import LiveChart from '@/components/LiveChart'
import AudioMeter from '@/components/AudioMeter'

// ---- Threshold helpers ----
const vibStatus = (rms: number): StatusLevel =>
  rms > 3.0 ? 'alarm' : rms > 1.5 ? 'warning' : 'normal'
const tempStatus = (t: number | null): StatusLevel =>
  !t ? 'offline' : t > 65 ? 'alarm' : t > 50 ? 'warning' : 'normal'
const voltStatus = (v: number | null): StatusLevel =>
  !v ? 'offline' : v < 10.5 ? 'alarm' : v < 11.5 ? 'warning' : 'normal'
const currStatus = (c: number | null): StatusLevel =>
  !c ? 'offline' : c > 3000 ? 'alarm' : c > 2000 ? 'warning' : 'normal'

interface Pt { ts: number; value: number }

export default function DashboardPage() {
  const { data, status, lastTs } = useLiveSensorData()

  // Rolling history for charts (last 60 points)
  const vibHistory  = useRef<Pt[]>([])
  const tempHistory = useRef<Pt[]>([])
  const currHistory = useRef<Pt[]>([])
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (!data) return
    const ts = Date.now()
    const push = (buf: React.MutableRefObject<Pt[]>, val: number | null | undefined) => {
      if (val == null) return
      buf.current.push({ ts, value: val })
      if (buf.current.length > 120) buf.current.shift()
    }
    push(vibHistory,  data.vibration?.rms)
    push(tempHistory, data.environment?.temp_c)
    push(currHistory, data.power?.current_ma)
    forceRender(n => n + 1)
  }, [data])

  const connBadge = {
    connected:    { cls: 'badge-green',  label: 'Live',         icon: <Wifi    size={10}/> },
    connecting:   { cls: 'badge-yellow', label: 'Connecting…',  icon: <Wifi    size={10}/> },
    disconnected: { cls: 'badge-red',    label: 'Disconnected', icon: <WifiOff size={10}/> },
    error:        { cls: 'badge-red',    label: 'Error',        icon: <WifiOff size={10}/> },
  }[status]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Real-time sensor monitoring · ESP32 → AWS IoT Core
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === 'connected' && <span className="live-dot" />}
          <span className={connBadge.cls}>
            {connBadge.icon} {connBadge.label}
          </span>
          {lastTs && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Clock size={11}/> {format(lastTs, 'HH:mm:ss')}
            </span>
          )}
        </div>
      </div>

      {/* ---- Vibration ---- */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}>
          Vibration · ADXL345
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SensorCard title="Vib RMS"  value={data?.vibration.rms} unit="m/s²"
            icon={Activity} status={vibStatus(data?.vibration.rms ?? 0)}
            color="#6366f1" decimals={3} />
          <SensorCard title="Accel X"  value={data?.vibration.x}   unit="m/s²"
            icon={Activity} color="#818cf8" decimals={3} />
          <SensorCard title="Accel Y"  value={data?.vibration.y}   unit="m/s²"
            icon={Activity} color="#818cf8" decimals={3} />
          <SensorCard title="Accel Z"  value={data?.vibration.z}   unit="m/s²"
            icon={Activity} color="#818cf8" decimals={3} />
        </div>
        <div className="mt-4">
          <LiveChart
            data={vibHistory.current}
            label="Vibration RMS (ADXL345)"
            unit="m/s²"
            color="#6366f1"
            threshold={1.5}
          />
        </div>
      </section>

      {/* ---- Environment ---- */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: 'var(--text-muted)' }}>
          Environment · DHT22 + BMP280
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SensorCard title="Temperature" value={data?.environment.temp_c}      unit="°C"
            icon={Thermometer} status={tempStatus(data?.environment.temp_c ?? null)}
            color="#f97316" decimals={1} />
          <SensorCard title="Humidity"    value={data?.environment.humidity_pct} unit="%RH"
            icon={Droplets} color="#06b6d4" decimals={1} />
          <SensorCard title="Pressure"    value={data?.environment.pressure_hpa} unit="hPa"
            icon={Gauge} color="#8b5cf6" decimals={1} />
          <SensorCard title="Altitude"    value={data?.environment.altitude_m}   unit="m"
            icon={Gauge} color="#8b5cf6" decimals={1} />
        </div>
        <div className="mt-4">
          <LiveChart
            data={tempHistory.current}
            label="Temperature (DHT22)"
            unit="°C"
            color="#f97316"
            threshold={60}
          />
        </div>
      </section>

      {/* ---- Power + Audio ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Power */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Power · INA219 + HX711
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <SensorCard title="Voltage"  value={data?.power.voltage_v}   unit="V"
              icon={Battery} status={voltStatus(data?.power.voltage_v ?? null)}
              color="#22c55e" decimals={2} />
            <SensorCard title="Current"  value={data?.power.current_ma}  unit="mA"
              icon={Zap} status={currStatus(data?.power.current_ma ?? null)}
              color="#f59e0b" decimals={1} />
            <SensorCard title="Power"    value={data?.power.power_w}     unit="W"
              icon={Zap} color="#f59e0b" decimals={2} />
            <SensorCard title="Load"     value={data?.load_g}            unit="g"
              icon={Weight} color="#06b6d4" decimals={1} />
          </div>
          <LiveChart
            data={currHistory.current}
            label="Motor Current (INA219)"
            unit="mA"
            color="#f59e0b"
            threshold={3000}
          />
        </section>

        {/* Audio + Motor */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}>
            Acoustic · INMP441
          </h2>
          <AudioMeter rms={data?.audio.rms ?? null} peak={data?.audio.peak ?? null} />

          <div className="mt-4 glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-indigo-400" />
              <span className="text-sm font-semibold">Motor State (L298N)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Speed</p>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${data?.motor.duty_pct ?? 0}%`,
                      background: 'linear-gradient(90deg,#6366f1,#818cf8)',
                    }}
                  />
                </div>
              </div>
              <span className="text-xl font-bold font-mono text-indigo-400">
                {data?.motor.duty_pct ?? 0}%
              </span>
              <span className={`badge-${data?.motor.forward ? 'green' : 'yellow'}`}>
                {data?.motor.forward ? 'FWD' : 'REV'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
