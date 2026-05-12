const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  controlMotor,
}
