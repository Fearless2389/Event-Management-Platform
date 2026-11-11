import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { setSession } from '../lib/auth'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState('attendee')
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!email || !name || !password) return
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      const { token, user } = await api.signup({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        password,
        role,
      })
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
      <aside className="lg:col-span-3 hidden lg:block relative overflow-hidden rounded-2xl min-h-[560px]">
        <div className="absolute inset-0 brand-gradient" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/55" />

        <div className="relative h-full p-10 flex flex-col justify-between text-white">
          <div className="flex items-center gap-2 text-xl font-extrabold">
            <span className="text-2xl">🎟️</span>
            <span>EventHub</span>
          </div>

          <div>
            <h2 className="text-4xl font-extrabold leading-tight mb-3">
              Join EventHub.
              <br />
              Two clicks to attend.
            </h2>
            <p className="opacity-90 max-w-sm">
              Pick attendee to discover and book, or organizer to host events of your own.
            </p>
          </div>

          <div className="text-xs opacity-80">
            Already have an account?{' '}
            <Link to="/login" className="underline font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:col-span-2 flex items-center">
        <form onSubmit={submit} className="w-full surface rounded-2xl p-7 space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm opacity-60 mt-1">Takes about 30 seconds.</p>
          </div>

          <Field label="Name">
            <input
              type="text"
              required
              autoComplete="name"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alice Carter"
            />
          </Field>

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
              minLength={6}
              autoComplete="new-password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </Field>

          <Field label="Confirm password">
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="input input-bordered w-full"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
            />
          </Field>

          <div>
            <span className="text-sm font-medium block mb-2">I'm signing up as</span>
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

          <button
            type="submit"
            disabled={submitting}
            className="gradient-cta w-full py-3 rounded-xl font-semibold"
          >
            {submitting ? 'Creating account…' : 'Create account →'}
          </button>

          <p className="text-sm text-center opacity-70">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold brand-gradient-text hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
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
          ? 'border-yellow-400 bg-yellow-400/10'
          : 'border-white/10 hover:border-white/30'
      }`}
    >
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-xs opacity-60 mt-0.5">{desc}</div>
    </button>
  )
}
