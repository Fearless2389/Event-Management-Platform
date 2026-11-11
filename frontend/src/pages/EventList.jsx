import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { getEventImage } from '../lib/eventImage'

const CATEGORIES = ['All', 'Music', 'Tech', 'Comedy', 'Sports', 'Theatre', 'Other']

export default function EventList() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const category = params.get('cat') || 'All'
  const dateFrom = params.get('from') || ''
  const dateTo = params.get('to') || ''
  const minPrice = params.get('min') || ''
  const maxPrice = params.get('max') || ''

  function setParam(name, value) {
    const next = new URLSearchParams(params)
    if (value === '' || value == null) next.delete(name)
    else next.set(name, value)
    setParams(next, { replace: true })
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: true })
  }

  useEffect(() => {
    api
      .listEvents()
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(dateFrom).getTime() : -Infinity
    const toMs = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1 : Infinity
    const minN = minPrice === '' ? -Infinity : Number(minPrice)
    const maxN = maxPrice === '' ? Infinity : Number(maxPrice)

    return events.filter((ev) => {
      if (category !== 'All' && (ev.category || 'Other') !== category) return false
      if (needle) {
        const hay = `${ev.title} ${ev.venue || ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      const t = new Date(ev.dateTime).getTime()
      if (t < fromMs || t > toMs) return false
      const cheapest = Math.min(...ev.ticketTiers.map((tier) => tier.price))
      if (cheapest < minN || cheapest > maxN) return false
      return true
    })
  }, [events, q, category, dateFrom, dateTo, minPrice, maxPrice])

  const hasFilters = !!(q || category !== 'All' || dateFrom || dateTo || minPrice || maxPrice)
  const advancedActive = !!(dateFrom || dateTo || minPrice || maxPrice)
  const priceInverted =
    minPrice !== '' &&
    maxPrice !== '' &&
    Number.isFinite(Number(minPrice)) &&
    Number.isFinite(Number(maxPrice)) &&
    Number(minPrice) > Number(maxPrice)

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
      {!hasFilters && (
        <Link
          to={`/events/${featured._id}`}
          className="block relative overflow-hidden rounded-3xl card-hover group"
        >
          <div className="aspect-[16/6] sm:aspect-[16/5] relative">
            <img
              src={getEventImage(featured, 'hero')}
              alt={featured.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
              <div className="text-xs uppercase tracking-[0.2em] font-semibold opacity-80 mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
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
      )}

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search events by title or venue…"
              className="input input-bordered w-full pl-9"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
              advancedActive || filtersOpen
                ? 'border-yellow-400/60 bg-yellow-400/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            Filters {advancedActive && <span className="ml-1 text-xs opacity-80">·</span>}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm opacity-70 hover:opacity-100 transition px-2"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => setParam('cat', cat === 'All' ? '' : cat)}
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

        {filtersOpen && (
          <div className="surface rounded-2xl p-5 grid sm:grid-cols-4 gap-4">
            <FilterField label="From">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setParam('from', e.target.value)}
                className="input input-bordered w-full"
              />
            </FilterField>
            <FilterField label="To">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setParam('to', e.target.value)}
                className="input input-bordered w-full"
              />
            </FilterField>
            <FilterField label="Min price (₹)">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setParam('min', e.target.value)}
                placeholder="0"
                className="input input-bordered w-full"
              />
            </FilterField>
            <FilterField label="Max price (₹)">
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setParam('max', e.target.value)}
                placeholder="Any"
                className="input input-bordered w-full"
              />
            </FilterField>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-5">
          {hasFilters
            ? `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
            : 'Browse all events'}
        </h2>

        {filtered.length === 0 ? (
          <div className="text-center py-16 opacity-70">
            <div className="text-5xl mb-3">{priceInverted ? '⚠️' : '🪧'}</div>
            {priceInverted ? (
              <>
                <p className="text-lg font-semibold mb-1">Min price is higher than max</p>
                <p className="text-sm opacity-70 mb-4">
                  Clear one of the price fields to see results.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold mb-1">No events match your filters</p>
                <p className="text-sm opacity-70 mb-4">
                  Try widening the date range or clearing filters.
                </p>
              </>
            )}
            <button
              onClick={clearAll}
              className="gradient-cta inline-block px-5 py-2 rounded-full text-sm font-semibold"
            >
              Clear filters
            </button>
          </div>
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

function FilterField({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider opacity-70 block mb-1.5">{label}</span>
      {children}
    </label>
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
        <img
          src={getEventImage(event, 'card')}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
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
