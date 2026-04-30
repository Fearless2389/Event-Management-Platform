import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay)
    const s = document.createElement('script')
    s.src = RAZORPAY_SCRIPT_URL
    s.onload = () => resolve(window.Razorpay)
    s.onerror = () => reject(new Error('Failed to load Razorpay Checkout'))
    document.head.appendChild(s)
  })
}

export default function Purchase() {
  const { id, tierName } = useParams()
  const decodedTier = decodeURIComponent(tierName)
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const nav = useNavigate()
  const user = getUser()

  useEffect(() => {
    api.getEvent(id).then(setEvent).catch((e) => setError(e.message))
  }, [id])

  async function pay() {
    setError(null)
    setStatus('loading')
    try {
      const Razorpay = await loadRazorpay()
      const order = await api.createOrder({
        eventId: id,
        tierName: decodedTier,
        attendeeName: user.name,
        attendeeEmail: user.email,
      })

      const rzp = new Razorpay({
        key: order.razorpayKeyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: event?.title || 'Event ticket',
        description: `${decodedTier} ticket`,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#570df8' },
        handler: async (response) => {
          try {
            setStatus('verifying')
            const result = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              eventId: id,
              tierName: decodedTier,
              attendeeName: user.name,
              attendeeEmail: user.email,
            })
            const params = new URLSearchParams({
              ticketId: result.ticketId,
              jspUrl: result.jspTicketUrl || '',
              emailUrl: result.etherealPreviewUrl || '',
            })
            nav(`/success?${params.toString()}`)
          } catch (e) {
            setError(e.message)
            setStatus('idle')
          }
        },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
      })
      rzp.on('payment.failed', (resp) => {
        setError(resp.error?.description || 'Payment failed')
        setStatus('idle')
      })
      rzp.open()
    } catch (e) {
      setError(e.message)
      setStatus('idle')
    }
  }

  if (error) return <div className="alert alert-error">{error}</div>
  if (!event) return <div className="text-center opacity-60">Loading…</div>

  const tier = event.ticketTiers.find((t) => t.name === decodedTier)
  if (!tier)
    return <div className="alert alert-error">Tier not found.</div>

  return (
    <div className="max-w-md mx-auto card bg-base-100 shadow">
      <div className="card-body gap-4">
        <h1 className="card-title">Confirm purchase</h1>
        <div className="bg-base-200 rounded p-4">
          <div className="text-lg font-medium">{event.title}</div>
          <div className="text-sm opacity-70">
            {new Date(event.dateTime).toLocaleString()} · {event.venue}
          </div>
          <hr className="my-3 border-base-300" />
          <div className="flex justify-between text-sm">
            <span>{tier.name} ticket</span>
            <span>₹{tier.price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Buyer</span>
            <span>
              {user.name} ({user.email})
            </span>
          </div>
        </div>

        <div className="text-xs opacity-60">
          Test card: <code>4111 1111 1111 1111</code> · any future expiry · any CVV
        </div>

        <button
          onClick={pay}
          disabled={status !== 'idle'}
          className="btn btn-primary"
        >
          {status === 'idle' && `Pay ₹${tier.price} via Razorpay`}
          {status === 'loading' && 'Opening Razorpay…'}
          {status === 'verifying' && 'Verifying payment…'}
        </button>
      </div>
    </div>
  )
}
