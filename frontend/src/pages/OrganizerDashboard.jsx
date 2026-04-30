import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { getEventImage } from '../lib/eventImage'

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
          <h1 className="text-3xl font-extrabold">Your events</h1>
          <p className="text-sm opacity-60 mt-1">
            Manage everything you've organized in one place.
          </p>
        </div>
        <Link
          to="/create"
          className="gradient-cta px-5 py-2.5 rounded-xl font-semibold text-sm"
        >
          + New event
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Events" value={stats.eventCount} icon="🎪" />
        <StatCard label="Tickets sold" value={stats.ticketsSold} icon="🎟️" />
        <StatCard label="Revenue" value={`₹${stats.revenue.toLocaleString('en-IN')}`} icon="💰" />
        <StatCard label="This week" value={stats.upcomingThisWeek} icon="🗓️" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-base-200 animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 surface rounded-2xl">
          <div className="text-5xl mb-3 animate-pop-in">🎪</div>
          <p className="font-bold text-lg mb-1">No events yet</p>
          <p className="text-sm opacity-70 mb-5">Get started by creating your first event.</p>
          <Link
            to="/create"
            className="gradient-cta inline-block px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
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

function StatCard({ label, value, icon }) {
  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs uppercase tracking-wider opacity-60 font-medium">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold brand-gradient-text">{value}</div>
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
    <div className="surface rounded-2xl p-4 flex items-center gap-4 card-hover">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
        <img
          src={getEventImage(event, 'thumb')}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to={`/events/${event._id}`} className="font-semibold hover:underline truncate">
            {event.title}
          </Link>
          {event.category && event.category !== 'Other' && (
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300">
              {event.category}
            </span>
          )}
        </div>
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

        <div className="mt-2.5 flex items-center gap-2">
          <div className="flex-1 max-w-xs h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full brand-gradient transition-all"
              style={{ width: `${soldPct}%` }}
            />
          </div>
          <span className="text-xs opacity-70 whitespace-nowrap">
            {sold}/{total}
          </span>
        </div>
      </div>

      <Link
        to={`/scan/${event._id}`}
        className="text-sm px-4 py-2 rounded-lg border border-white/10 hover:border-yellow-400/60 hover:bg-yellow-400/10 transition flex-shrink-0"
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
