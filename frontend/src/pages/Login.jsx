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
    <div className="max-w-md mx-auto card bg-base-100 shadow">
      <form className="card-body gap-4" onSubmit={submit}>
        <h1 className="card-title">Sign in</h1>
        <p className="text-sm opacity-70 -mt-2">
          MVP login — no password. Switch role to demo both flows.
        </p>

        <label className="form-control">
          <span className="label-text mb-1">Email</span>
          <input
            type="email"
            required
            className="input input-bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@example.com"
          />
        </label>

        <label className="form-control">
          <span className="label-text mb-1">Name</span>
          <input
            type="text"
            required
            className="input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice"
          />
        </label>

        <div className="form-control">
          <span className="label-text mb-1">Role</span>
          <div className="flex gap-3">
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio radio-primary"
                checked={role === 'attendee'}
                onChange={() => setRole('attendee')}
              />
              <span>Attendee</span>
            </label>
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio radio-primary"
                checked={role === 'organizer'}
                onChange={() => setRole('organizer')}
              />
              <span>Organizer</span>
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-2">
          Continue
        </button>
      </form>
    </div>
  )
}
