import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'

export default function EventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const nav = useNavigate()
  const user = getUser()

  useEffect(() => {
    api.getEvent(id).then(setEvent).catch((e) => setError(e.message))
  }, [id])

  function handleBuy(tierName) {
    if (!user) {
      nav('/login')
      return
    }
    if (user.role !== 'attendee') {
      toast.error('Switch to an attendee account to buy tickets.')
      return
    }
    nav(`/events/${id}/buy/${encodeURIComponent(tierName)}`)
  }

  if (error) return <div className="alert alert-error">{error}</div>
  if (!event) return <div className="text-center opacity-60 py-12">Loading…</div>

  const minPrice = Math.min(...event.ticketTiers.map((t) => t.price))
  const totalRemaining = event.ticketTiers.reduce(
    (s, t) => s + Math.max(0, t.capacity - t.sold),
    0,
  )

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm opacity-70 hover:opacity-100 inline-flex items-center gap-1">
        ← Back to events
      </Link>

      <div className="relative overflow-hidden rounded-3xl">
        <div className="aspect-[16/8] sm:aspect-[16/6] relative">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
            {event.category && event.category !== 'Other' && (
              <span className="inline-block backdrop-blur bg-black/40 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10 mb-3">
                {event.category}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
              {event.title}
            </h1>
            <p className="text-sm sm:text-base opacity-90">
              📅{' '}
              {new Date(event.dateTime).toLocaleString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · 📍 {event.venue}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="surface rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-3">About this event</h2>
            <p className="whitespace-pre-line opacity-90 leading-relaxed">
              {event.description}
            </p>
            <p className="text-xs opacity-50 mt-6">
              Hosted by <span className="font-medium">{event.organizerEmail}</span>
            </p>
          </section>
        </div>

        <aside className="space-y-3">
          <h2 className="text-xl font-bold">Pick a tier</h2>
          <div className="grid grid-cols-1 gap-3">
            {event.ticketTiers.map((t) => (
              <TierTile key={t.name} tier={t} onBuy={() => handleBuy(t.name)} />
            ))}
          </div>
        </aside>
      </div>

      {/* Sticky bottom CTA bar — mobile + organizer fallback */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden">
        <div className="bg-base-200/95 backdrop-blur border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs opacity-60">
              {totalRemaining > 0 ? `${totalRemaining} tickets left` : 'Sold out'}
            </div>
            <div className="text-lg font-bold">from ₹{minPrice}</div>
          </div>
          <button
            disabled={totalRemaining === 0}
            onClick={() => setPickerOpen(true)}
            className="gradient-cta px-6 py-3 rounded-xl font-semibold"
          >
            Book tickets
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex items-end" onClick={() => setPickerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full bg-base-200 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5" />
            <h3 className="text-xl font-bold mb-4">Pick a tier</h3>
            <div className="space-y-3">
              {event.ticketTiers.map((t) => (
                <TierTile
                  key={t.name}
                  tier={t}
                  onBuy={() => {
                    setPickerOpen(false)
                    handleBuy(t.name)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TierTile({ tier, onBuy }) {
  const remaining = tier.capacity - tier.sold
  const soldOut = remaining <= 0
  const lowStock = !soldOut && remaining <= 5

  return (
    <div
      className={`relative rounded-2xl border-2 p-4 transition ${
        soldOut
          ? 'border-white/5 bg-base-200 opacity-50'
          : 'border-white/10 surface surface-hover'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-bold text-lg">{tier.name}</div>
          <div className="text-xs opacity-70 mt-0.5">
            {soldOut
              ? 'Sold out'
              : lowStock
                ? `Only ${remaining} left!`
                : `${remaining} available`}
          </div>
        </div>
        <span className="text-xl font-extrabold whitespace-nowrap brand-gradient-text">
          ₹{tier.price}
        </span>
      </div>
      <button
        disabled={soldOut}
        onClick={onBuy}
        className="gradient-cta w-full rounded-lg py-2 text-sm font-semibold"
      >
        {soldOut ? 'Sold out' : `Buy ${tier.name}`}
      </button>
    </div>
  )
}
