import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../lib/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('attendee')
  const nav = useNavigate()

  function submit(e) {
    e.preventDefault()
    if (!email || !name) return
    setUser({ email: email.trim().toLowerCase(), name: name.trim(), role })
    nav(role === 'organizer' ? '/dashboard' : '/')
    window.location.reload()
  }

  return (
    <div className="grid lg:grid-cols-5 gap-8 max-w-5xl mx-auto -my-2">
      <aside className="lg:col-span-3 hidden lg:block relative overflow-hidden rounded-2xl min-h-[480px]">
        <div className="absolute inset-0 brand-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-transparent to-black/40" />

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
        <form
          onSubmit={submit}
          className="w-full surface rounded-2xl p-7 space-y-5"
        >
          <div>
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-sm opacity-60 mt-1">
              MVP demo login — pick a role to explore both flows.
            </p>
          </div>

          <Field label="Email">
            <input
              type="email"
              required
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alice@example.com"
            />
          </Field>

          <Field label="Name">
            <input
              type="text"
              required
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice"
            />
          </Field>

          <div>
            <span className="text-sm font-medium block mb-2">I'm signing in as</span>
            <div className="grid grid-cols-2 gap-2">
              <RoleOption
                label="Attendee"
                desc="Buy & scan tickets"
                checked={role === 'attendee'}
                onSelect={() => setRole('attendee')}
              />
              <RoleOption
                label="Organizer"
                desc="Create & manage events"
                checked={role === 'organizer'}
                onSelect={() => setRole('organizer')}
              />
            </div>
          </div>

          <button type="submit" className="gradient-cta w-full py-3 rounded-xl font-semibold">
            Continue →
          </button>
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

function RoleOption({ label, desc, checked, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left p-3 rounded-xl border-2 transition ${
        checked
          ? 'border-purple-400 bg-purple-500/10'
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-xs opacity-60 mt-0.5">{desc}</div>
    </button>
  )
}
