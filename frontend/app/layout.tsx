import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import { Activity, BarChart3, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title:       'Predictive Maintenance Dashboard',
  description: 'Real-time IoT sensor monitoring for industrial equipment — ESP32 + AWS IoT Core',
}

const navLinks = [
  { href: '/',        label: 'Dashboard', icon: Activity  },
  { href: '/history', label: 'History',   icon: BarChart3 },
  { href: '/motor',   label: 'Motor',     icon: Zap       },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ---- Sidebar ---- */}
        <div className="flex min-h-screen">
          <aside
            className="fixed left-0 top-0 h-full w-56 z-40 flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #0f1020 0%, #0a0b14 100%)',
              borderRight: '1px solid rgba(99,102,241,0.15)',
            }}
          >
            {/* Logo */}
            <div className="px-5 py-6 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}
                >
                  <Activity size={16} color="white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">PredMaint</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>IoT Monitor</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Icon
                    size={17}
                    className="transition-colors duration-150 group-hover:text-indigo-400"
                  />
                  <span className="group-hover:text-white transition-colors">{label}</span>
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Phase 1 · FYP 2026</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ESP32 + AWS IoT</p>
            </div>
          </aside>

          {/* ---- Main content ---- */}
          <main className="flex-1 ml-56 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
