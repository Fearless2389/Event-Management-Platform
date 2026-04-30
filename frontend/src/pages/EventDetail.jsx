import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'

export default function EventDetail() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [error, setError] = useState(null)
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
      alert('Switch to an attendee account to purchase tickets.')
      return
    }
    nav(`/events/${id}/buy/${encodeURIComponent(tierName)}`)
  }

  if (error) return <div className="alert alert-error">{error}</div>
  if (!event) return <div className="text-center opacity-60 py-12">Loading…</div>

  return (
    <div className="space-y-8">
      <Link to="/" className="text-sm opacity-70 hover:opacity-100 inline-flex items-center gap-1">
        ← Back to events
      </Link>

      <div className="relative overflow-hidden rounded-2xl shadow-lg">
        <div className="aspect-[16/7] sm:aspect-[16/6] relative">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 brand-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
            <h1 className="text-3xl sm:text-5xl font-bold mb-2">{event.title}</h1>
            <p className="text-sm sm:text-base opacity-90">
              {new Date(event.dateTime).toLocaleString()} · {event.venue}
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">About this event</h2>
            <p className="whitespace-pre-line opacity-90 leading-relaxed">
              {event.description}
            </p>
          </section>

          <section className="text-sm opacity-60">
            Hosted by <span className="font-medium">{event.organizerEmail}</span>
          </section>
        </div>

        <aside className="space-y-3">
          <h2 className="text-xl font-semibold">Pick a tier</h2>
          <div className="grid grid-cols-1 gap-3">
            {event.ticketTiers.map((t) => {
              const remaining = t.capacity - t.sold
              const soldOut = remaining <= 0
              return (
                <div
                  key={t.name}
                  className={`relative rounded-xl border-2 p-4 transition ${
                    soldOut
                      ? 'border-base-300 bg-base-200 opacity-60'
                      : 'border-base-300 bg-base-100 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-lg">{t.name}</div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {soldOut ? 'Sold out' : `${remaining} left`}
                      </div>
                    </div>
                    <span className="text-lg font-bold whitespace-nowrap">
                      ₹{t.price}
                    </span>
                  </div>
                  <button
                    disabled={soldOut}
                    onClick={() => handleBuy(t.name)}
                    className="gradient-cta w-full rounded-lg py-2 text-sm font-semibold"
                  >
                    {soldOut ? 'Sold out' : `Buy ${t.name}`}
                  </button>
                </div>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}
