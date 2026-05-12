const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type SensorReading = {
  id:              number
  timestamp:       string
  epoch_ms:        number
  accel_x:         number
  accel_y:         number
  accel_z:         number
  accel_rms:       number
  temperature:     number | null
  humidity:        number | null
  pressure:        number | null
  altitude:        number | null
  bmp_temp:        number | null
  voltage:         number | null
  current_ma:      number | null
  power_w:         number | null
  load_g:          number | null
  audio_rms:       number | null
  audio_peak:      number | null
  motor_pwm:       number
  motor_forward:   boolean
  motor_duty_pct:  number
}

export type SensorStats = {
  window_hours: number
  sample_count: number
  temperature: {
    avg_c: number
    max_c: number
  }
  vibration: {
    avg_rms: number
    max_rms: number
  }
  power: {
    avg_current_ma: number
    max_current_ma: number
    avg_voltage_v: number
  }
  audio: {
    avg_rms: number
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `Request failed: ${res.status}`)
  }
  return res.json()
}

async function getHistory(hours: number, limit = 500, offset = 0) {
  const url = `${API_BASE.replace(/\/$/, '')}/api/sensors/history?hours=${hours}&limit=${limit}&offset=${offset}`
  return fetchJson<SensorReading[]>(url)
}

async function getStats(hours: number) {
  const url = `${API_BASE.replace(/\/$/, '')}/api/sensors/stats?hours=${hours}`
  return fetchJson<SensorStats>(url)
}

async function controlMotor(pwm: number, forward: boolean) {
  const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/motor/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pwm, forward }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `Failed to send motor command (${res.status})`)
  }

  return res.json()
}

export const api = {
  getHistory,
  getStats,
  controlMotor,
}
