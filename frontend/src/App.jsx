import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import EventList from './pages/EventList'
import EventDetail from './pages/EventDetail'
import CreateEvent from './pages/CreateEvent'
import Purchase from './pages/Purchase'
import Success from './pages/Success'
import OrganizerDashboard from './pages/OrganizerDashboard'
import Scan from './pages/Scan'
import { getUser } from './lib/auth'

function RequireAuth({ role, children }) {
  const user = getUser()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<EventList />} />
          <Route path="login" element={<Login />} />
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
