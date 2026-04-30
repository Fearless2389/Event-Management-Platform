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
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl normal-case">
            🎟️ EventHub
          </Link>
        </div>
        <div className="flex-none gap-2">
          <NavLink to="/" end className="btn btn-ghost btn-sm">
            Browse
          </NavLink>
          {user?.role === 'organizer' && (
            <>
              <NavLink to="/dashboard" className="btn btn-ghost btn-sm">
                Dashboard
              </NavLink>
              <NavLink to="/create" className="btn btn-primary btn-sm">
                + New event
              </NavLink>
            </>
          )}
          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm opacity-70 hidden md:inline">
                {user.name} ({user.role})
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="footer footer-center p-4 text-base-content/60 text-xs">
        <aside>
          EventHub · MVP build · Razorpay test mode · Ethereal email
        </aside>
      </footer>
    </div>
  )
}
