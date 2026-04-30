import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function EventList() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center opacity-60">Loading events…</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (events.length === 0)
    return (
      <div className="text-center opacity-70 py-16">
        <p className="text-lg">No events yet.</p>
        <p className="text-sm mt-2">Sign in as an organizer to create the first one.</p>
      </div>
    )

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Upcoming events</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <Link
            to={`/events/${ev._id}`}
            key={ev._id}
            className="card bg-base-100 shadow hover:shadow-lg transition"
          >
            {ev.imageUrl && (
              <figure>
                <img
                  src={ev.imageUrl}
                  alt={ev.title}
                  className="h-40 w-full object-cover"
                />
              </figure>
            )}
            <div className="card-body">
              <h2 className="card-title">{ev.title}</h2>
              <p className="text-sm opacity-70">
                {new Date(ev.dateTime).toLocaleString()} · {ev.venue}
              </p>
              <p className="text-sm line-clamp-2">{ev.description}</p>
              <div className="card-actions justify-end mt-2">
                <span className="badge badge-primary">
                  from ₹{Math.min(...ev.ticketTiers.map((t) => t.price))}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
