import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getUser, logout } from '../lib/auth'

export default function Layout() {
  const user = getUser()
  const nav = useNavigate()

  function handleLogout() {
    logout()
    nav('/')
    window.location.reload()
  }

  return (
    <div className="min-h-screen text-base-content">
      <header className="glass sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold">
            <span className="brand-gradient w-8 h-8 rounded-lg flex items-center justify-center text-white">
              🎟️
            </span>
            <span className="brand-gradient-text tracking-tight">EventHub</span>
          </Link>

          <nav className="hidden sm:flex ml-4 gap-1 text-sm">
            <NavLink to="/" end className={navClass}>
              Browse
            </NavLink>
            {user?.role === 'organizer' && (
              <>
                <NavLink to="/dashboard" className={navClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/create" className={navClass}>
                  Create
                </NavLink>
              </>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full surface text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.role === 'organizer' ? 'bg-yellow-400' : 'bg-neutral-400'
                    }`}
                  />
                  <span className="font-medium">{user.name}</span>
                  <span className="opacity-50">·</span>
                  <span className="opacity-70 capitalize">{user.role}</span>
                </div>
                <button
                  className="text-sm px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30 hover:bg-white/5 transition"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="gradient-cta text-sm px-4 py-1.5 rounded-lg font-semibold"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-32 sm:pb-12 animate-fade-up">
        <Outlet />
      </main>

      <footer className="text-center text-xs opacity-50 py-8 px-4">
        <div className="max-w-6xl mx-auto border-t border-white/5 pt-6">
          EventHub · Test mode build · Razorpay test · Ethereal email
        </div>
      </footer>
    </div>
  )
}

function navClass({ isActive }) {
  return `px-3 py-2 rounded-lg transition ${
    isActive ? 'text-white bg-white/10' : 'text-base-content/70 hover:text-white hover:bg-white/5'
  }`
}
