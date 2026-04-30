import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .myEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => computeStats(events), [events])

  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Your events</h1>
          <p className="text-sm opacity-60 mt-1">
            Manage everything you've organized in one place.
          </p>
        </div>
        <Link to="/create" className="gradient-cta px-5 py-2 rounded-lg font-semibold text-sm shadow-md">
          + New event
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Events" value={stats.eventCount} />
        <StatCard label="Tickets sold" value={stats.ticketsSold} />
        <StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} />
        <StatCard label="Upcoming this week" value={stats.upcomingThisWeek} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-base-300 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-base-100 rounded-2xl shadow">
          <div className="text-5xl mb-3">🎪</div>
          <p className="font-semibold text-lg mb-1">No events yet</p>
          <p className="text-sm opacity-70 mb-4">Get started by creating your first event.</p>
          <Link to="/create" className="gradient-cta inline-block px-5 py-2 rounded-lg font-semibold text-sm">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <EventRow key={ev._id} event={ev} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-base-100 rounded-xl shadow p-4">
      <div className="text-xs uppercase tracking-wider opacity-60 mb-1">{label}</div>
      <div className="text-2xl sm:text-3xl font-bold brand-gradient-text">{value}</div>
    </div>
  )
}

function EventRow({ event }) {
  const sold = event.ticketTiers.reduce(
    (s, t) => s + Math.min(t.sold, t.capacity),
    0,
  )
  const total = event.ticketTiers.reduce((s, t) => s + t.capacity, 0)
  const soldPct = total > 0 ? Math.round((sold / total) * 100) : 0

  return (
    <div className="bg-base-100 rounded-xl shadow p-4 flex items-center gap-4">
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="brand-gradient w-full h-full flex items-center justify-center text-white text-[10px] font-semibold p-1 text-center leading-tight">
            {event.title.slice(0, 12)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link to={`/events/${event._id}`} className="font-semibold hover:underline">
          {event.title}
        </Link>
        <div className="text-xs opacity-70 mt-0.5">
          {new Date(event.dateTime).toLocaleString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}{' '}
          · {event.venue}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 max-w-xs h-1.5 rounded-full bg-base-300 overflow-hidden">
            <div
              className="h-full brand-gradient transition-all"
              style={{ width: `${soldPct}%` }}
            />
          </div>
          <span className="text-xs opacity-70 whitespace-nowrap">
            {sold}/{total} sold
          </span>
        </div>
      </div>

      <Link
        to={`/scan/${event._id}`}
        className="btn btn-sm btn-outline flex-shrink-0"
      >
        Scan
      </Link>
    </div>
  )
}

function computeStats(events) {
  const now = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000

  let ticketsSold = 0
  let revenue = 0
  let upcomingThisWeek = 0

  for (const ev of events) {
    for (const t of ev.ticketTiers) {
      const sold = Math.min(t.sold, t.capacity)
      ticketsSold += sold
      revenue += sold * t.price
    }
    const dt = new Date(ev.dateTime).getTime()
    if (dt >= now && dt - now <= oneWeek) upcomingThisWeek += 1
  }

  return {
    eventCount: events.length,
    ticketsSold,
    revenue,
    upcomingThisWeek,
  }
}
