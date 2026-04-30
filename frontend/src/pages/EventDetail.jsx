import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  if (!event) return <div className="text-center opacity-60">Loading…</div>

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 card bg-base-100 shadow">
        {event.imageUrl && (
          <figure>
            <img src={event.imageUrl} alt={event.title} className="w-full h-64 object-cover" />
          </figure>
        )}
        <div className="card-body">
          <h1 className="text-3xl font-semibold">{event.title}</h1>
          <p className="opacity-70">
            {new Date(event.dateTime).toLocaleString()} · {event.venue}
          </p>
          <p className="mt-4 whitespace-pre-line">{event.description}</p>
          <p className="text-xs opacity-60 mt-4">Hosted by {event.organizerEmail}</p>
        </div>
      </div>

      <div className="card bg-base-100 shadow h-fit sticky top-4">
        <div className="card-body">
          <h2 className="card-title">Ticket tiers</h2>
          <ul className="divide-y divide-base-200">
            {event.ticketTiers.map((t) => {
              const remaining = t.capacity - t.sold
              const soldOut = remaining <= 0
              return (
                <li key={t.name} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm opacity-70">
                      ₹{t.price} · {soldOut ? 'Sold out' : `${remaining} left`}
                    </div>
                  </div>
                  <button
                    disabled={soldOut}
                    onClick={() => handleBuy(t.name)}
                    className="btn btn-primary btn-sm"
                  >
                    Buy
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
