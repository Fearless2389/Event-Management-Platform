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

  if (loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-base-300 animate-pulse" />
        ))}
      </div>
    )

  if (error) return <div className="alert alert-error">{error}</div>

  if (events.length === 0)
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎟️</div>
        <p className="text-2xl font-semibold mb-1">No events yet</p>
        <p className="text-sm opacity-70">Sign in as an organizer and create the first one.</p>
      </div>
    )

  const featured = events[0]
  const rest = events.slice(1)
  const featuredMinPrice = Math.min(...featured.ticketTiers.map((t) => t.price))

  return (
    <div className="space-y-10">
      <Link
        to={`/events/${featured._id}`}
        className="block relative overflow-hidden rounded-2xl shadow-lg card-hover"
      >
        <div className="aspect-[16/6] sm:aspect-[16/5] relative">
          {featured.imageUrl ? (
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
            <div className="text-xs uppercase tracking-widest opacity-80 mb-2">
              ⚡ Featured event
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">{featured.title}</h1>
            <p className="text-sm sm:text-base opacity-90 mb-4">
              {new Date(featured.dateTime).toLocaleString()} · {featured.venue}
            </p>
            <span className="gradient-cta inline-flex items-center px-5 py-2 rounded-full font-semibold text-sm shadow-lg">
              Book now from ₹{featuredMinPrice}
            </span>
          </div>
        </div>
      </Link>

      <div>
        <h2 className="text-2xl font-bold mb-5">Browse all events</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.length === 0 ? (
            <p className="opacity-60 col-span-full text-sm">
              That's the only event for now — check back soon!
            </p>
          ) : (
            rest.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }) {
  const minPrice = Math.min(...event.ticketTiers.map((t) => t.price))
  const totalRemaining = event.ticketTiers.reduce(
    (s, t) => s + Math.max(0, t.capacity - t.sold),
    0,
  )
  const lowStock = totalRemaining > 0 && totalRemaining <= 10

  return (
    <Link
      to={`/events/${event._id}`}
      className="card-hover block relative overflow-hidden rounded-2xl shadow-md bg-base-100"
    >
      <div className="aspect-[3/4] relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 brand-gradient flex items-center justify-center p-4">
            <span className="text-white font-semibold text-center text-lg leading-tight">
              {event.title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

        {lowStock && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
            Selling fast
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
          <p className="text-xs opacity-90 mt-1">
            {new Date(event.dateTime).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}{' '}
            · {event.venue}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between bg-base-100">
        <span className="text-xs opacity-60">
          from <span className="font-semibold text-base-content">₹{minPrice}</span>
        </span>
        <span className="text-xs font-medium brand-gradient-text">Book now →</span>
      </div>
    </Link>
  )
}
