import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

const CATEGORIES = ['All', 'Music', 'Tech', 'Comedy', 'Sports', 'Theatre', 'Other']

export default function EventList() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    api
      .listEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return events
    return events.filter((e) => (e.category || 'Other') === activeCategory)
  }, [events, activeCategory])

  if (loading) return <SkeletonGrid />

  if (error) return <div className="alert alert-error">{error}</div>

  if (events.length === 0)
    return (
      <div className="text-center py-24">
        <div className="text-7xl mb-6 animate-pop-in">🎟️</div>
        <p className="text-3xl font-bold mb-2">No events yet</p>
        <p className="opacity-70">Sign in as an organizer and create the first one.</p>
      </div>
    )

  const featured = events[0]
  const featuredMinPrice = Math.min(...featured.ticketTiers.map((t) => t.price))

  return (
    <div className="space-y-10">
      <Link
        to={`/events/${featured._id}`}
        className="block relative overflow-hidden rounded-3xl card-hover group"
      >
        <div className="aspect-[16/6] sm:aspect-[16/5] relative">
          {featured.imageUrl ? (
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
            <div className="text-xs uppercase tracking-[0.2em] font-semibold opacity-80 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
              Featured event
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-2 max-w-3xl leading-tight">
              {featured.title}
            </h1>
            <p className="text-sm sm:text-base opacity-90 mb-5">
              {new Date(featured.dateTime).toLocaleDateString(undefined, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              · {featured.venue}
            </p>
            <span className="gradient-cta inline-flex items-center px-6 py-2.5 rounded-full font-semibold text-sm">
              Book now from ₹{featuredMinPrice}
            </span>
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                active
                  ? 'gradient-cta'
                  : 'surface surface-hover text-base-content/80'
              }`}
            >
              {cat}
            </button>
          )
        })}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-5">
          {activeCategory === 'All' ? 'Browse all events' : `${activeCategory} events`}
        </h2>

        {filtered.length === 0 ? (
          <p className="opacity-60 text-sm py-8 text-center">
            No events in this category yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((ev) => (
              <EventCard key={ev._id} event={ev} />
            ))}
          </div>
        )}
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
      className="card-hover block relative overflow-hidden rounded-2xl surface group"
    >
      <div className="aspect-[3/4] relative">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 brand-gradient flex items-center justify-center p-4">
            <span className="text-white font-bold text-center text-lg leading-tight">
              {event.title}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

        {event.category && event.category !== 'Other' && (
          <span className="absolute top-3 left-3 backdrop-blur bg-black/40 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
            {event.category}
          </span>
        )}
        {lowStock && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            🔥 Selling fast
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

      <div className="px-4 py-3 flex items-center justify-between">
        <span className="text-xs opacity-60">
          from <span className="font-bold text-base-content">₹{minPrice}</span>
        </span>
        <span className="text-xs font-semibold brand-gradient-text">Book now →</span>
      </div>
    </Link>
  )
}

function SkeletonGrid() {
  return (
    <div className="space-y-10">
      <div className="aspect-[16/5] rounded-3xl bg-base-200 animate-pulse" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 rounded-full bg-base-200 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-base-200 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
