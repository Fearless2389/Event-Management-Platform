import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'
import { getEventImage } from '../lib/eventImage'

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
        theme: { color: '#facc15' },
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
            toast.error(e.message)
            setError(e.message)
            setStatus('idle')
          }
        },
        modal: {
          ondismiss: () => setStatus('idle'),
        },
      })
      rzp.on('payment.failed', (resp) => {
        const msg = resp.error?.description || 'Payment failed'
        toast.error(msg)
        setError(msg)
        setStatus('idle')
      })
      rzp.open()
    } catch (e) {
      toast.error(e.message)
      setError(e.message)
      setStatus('idle')
    }
  }

  if (error && !event) return <div className="alert alert-error max-w-md mx-auto">{error}</div>
  if (!event) return <div className="text-center opacity-60 py-12">Loading…</div>

  const tier = event.ticketTiers.find((t) => t.name === decodedTier)
  if (!tier) return <div className="alert alert-error max-w-md mx-auto">Tier not found.</div>

  return (
    <div className="max-w-md mx-auto">
      <div className="brand-gradient-border surface rounded-2xl overflow-hidden">
        <div className="p-6 space-y-5">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Confirm purchase</div>
            <h1 className="text-2xl font-extrabold">Almost there 🎉</h1>
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={getEventImage(event, 'thumb')}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{event.title}</div>
              <div className="text-xs opacity-70 mt-0.5">
                {new Date(event.dateTime).toLocaleString()}
              </div>
              <div className="text-xs opacity-70">{event.venue}</div>
            </div>
          </div>

          <div className="bg-base-100/50 border border-white/5 rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="opacity-70">{tier.name} ticket × 1</span>
              <span className="font-semibold">₹{tier.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Buyer</span>
              <span className="text-right truncate max-w-[60%]">
                {user.name}
                <br />
                <span className="text-xs opacity-60">{user.email}</span>
              </span>
            </div>
            <hr className="border-white/5" />
            <div className="flex justify-between text-base font-bold pt-1">
              <span>Total</span>
              <span className="brand-gradient-text">₹{tier.price}</span>
            </div>
          </div>

          <div className="text-xs opacity-70 space-y-1.5 bg-base-100/50 border border-white/5 rounded-xl p-3.5">
            <div className="font-semibold opacity-90 uppercase tracking-wider text-[10px]">
              Test payment methods
            </div>
            <div>
              UPI (recommended): <code>success@razorpay</code>
            </div>
            <div>
              Card: <code>4111 1111 1111 1111</code>, any future expiry, any CVV
            </div>
          </div>

          <button
            onClick={pay}
            disabled={status !== 'idle'}
            className="gradient-cta w-full rounded-xl py-3.5 font-bold text-base"
          >
            {status === 'idle' && `Pay ₹${tier.price} via Razorpay`}
            {status === 'loading' && 'Opening Razorpay…'}
            {status === 'verifying' && 'Verifying payment…'}
          </button>

          {error && <div className="alert alert-error text-sm py-2">{error}</div>}
        </div>
      </div>
    </div>
  )
}
