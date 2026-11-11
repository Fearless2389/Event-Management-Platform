import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { setSession } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!email || !password) return
    setSubmitting(true)
    try {
      const { token, user } = await api.login({ email: email.trim().toLowerCase(), password })
      setSession({ token, user })
      nav(user.role === 'organizer' ? '/dashboard' : '/')
      window.location.reload()
    } catch (err) {
      toast.error(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto -my-2">
      <aside className="lg:col-span-3 hidden lg:block relative overflow-hidden rounded-2xl min-h-[480px]">
        <div className="absolute inset-0 brand-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/55" />

        <div className="relative h-full p-10 flex flex-col justify-between text-white">
          <div className="flex items-center gap-2 text-xl font-extrabold">
            <span className="text-2xl">🎟️</span>
            <span>EventHub</span>
          </div>

          <div>
            <h2 className="text-4xl font-extrabold leading-tight mb-3">
              Discover and book
              <br />
              unforgettable events.
            </h2>
            <p className="opacity-90 max-w-sm">
              Tech conferences, live music, stand-up comedy, sports — book in seconds, scan in
              at the door.
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <Stat label="Live events" value="12K+" />
            <Stat label="Cities" value="180" />
            <Stat label="Tickets sold" value="3.4M" />
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2 flex items-center">
        <form onSubmit={submit} className="w-full surface rounded-2xl p-7 space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm opacity-60 mt-1">Sign in to buy tickets or manage events.</p>
          </div>

          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="gradient-cta w-full py-3 rounded-xl font-semibold"
          >
            {submitting ? 'Signing in…' : 'Sign in →'}
          </button>

          <p className="text-sm text-center opacity-70">
            New here?{' '}
            <Link to="/signup" className="font-semibold brand-gradient-text hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 flex-1">
      <div className="font-bold text-lg">{value}</div>
      <div className="opacity-80">{label}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
