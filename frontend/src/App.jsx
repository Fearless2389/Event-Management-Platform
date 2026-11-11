import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import Purchase from './pages/Purchase'
import Success from './pages/Success'
import OrganizerDashboard from './pages/OrganizerDashboard'
import Scan from './pages/Scan'
import Ticket from './pages/Ticket'
import Checkin from './pages/Checkin'
import { getUser } from './lib/auth'

function ColdStartBanner() {
  const [showing, setShowing] = useState(false)
  useEffect(() => {
    const onSlow = () => setShowing(true)
    const onDone = () => setShowing(false)
    window.addEventListener('em:slow-request', onSlow)
    window.addEventListener('em:request-done', onDone)
    return () => {
      window.removeEventListener('em:slow-request', onSlow)
      window.removeEventListener('em:request-done', onDone)
    }
  }, [])
  if (!showing) return null
  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-yellow-400/95 text-black text-sm font-medium px-4 py-2.5 text-center shadow-lg backdrop-blur">
      <span className="inline-block animate-pulse mr-1.5">⏳</span>
      Waking up the backend — the free tier sleeps after 15 minutes idle. First load takes ~30 seconds.
    </div>
  )
}

function RequireAuth({ role, children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ColdStartBanner />
      <Routes>
        <Route path="ticket/:id" element={<Ticket />} />
        <Route path="checkin/:id" element={<Checkin />} />

        <Route element={<Layout />}>
          <Route index element={<EventList />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route
            path="events/:id/buy/:tierName"
            element={
              <RequireAuth role="attendee">
                <Purchase />
              </RequireAuth>
            }
          />
          <Route path="success" element={<Success />} />
          <Route
            path="create"
            element={
              <RequireAuth role="organizer">
                <CreateEvent />
              </RequireAuth>
            }
          />
          <Route
            path="dashboard"
            element={
              <RequireAuth role="organizer">
                <OrganizerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="scan/:eventId"
            element={
              <RequireAuth role="organizer">
                <Scan />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
