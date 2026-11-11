import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { getUser } from '../lib/auth'
import { getEventImage } from '../lib/eventImage'

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
const PENDING_VERIFY_KEY = 'em_pending_verify'

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

function loadPendingVerify() {
  try {
    const raw = localStorage.getItem(PENDING_VERIFY_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function Purchase() {
  const { id, tierName } = useParams()
  const [searchParams] = useSearchParams()
  const decodedTier = decodeURIComponent(tierName)
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [pendingPayload, setPendingPayload] = useState(null)
  const nav = useNavigate()
  const user = getUser()

  const tier = event?.ticketTiers.find((t) => t.name === decodedTier)
  const remaining = tier ? tier.capacity - tier.sold : 0
  const requestedQty = Number(searchParams.get('qty')) || 1
  const quantity = useMemo(() => {
    if (!tier) return 1
    return Math.max(1, Math.min(10, remaining, Math.floor(requestedQty)))
  }, [tier, remaining, requestedQty])

  useEffect(() => {
    api.getEvent(id).then(setEvent).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    const pending = loadPendingVerify()
    if (pending && pending.eventId === id) setPendingPayload(pending)
  }, [id])

  function clearPending() {
    localStorage.removeItem(PENDING_VERIFY_KEY)
    setPendingPayload(null)
  }

  async function verifyOnce(payload) {
    const result = await api.verifyPayment(payload)
    const params = new URLSearchParams()
    for (const tid of result.ticketIds || []) params.append('id', tid)
    params.set('email', result.emailSent ? '1' : '0')
    clearPending()
    nav(`/success?${params.toString()}`)
  }

  async function verifyWithRetry(payload) {
    setStatus('verifying')
    setError(null)
    try {
      await verifyOnce(payload)
      return
    } catch (firstErr) {
      console.warn('[verify] first attempt failed, retrying once:', firstErr.message)
      try {
        await new Promise((r) => setTimeout(r, 1500))
        await verifyOnce(payload)
        return
      } catch (secondErr) {
        localStorage.setItem(PENDING_VERIFY_KEY, JSON.stringify(payload))
        setPendingPayload(payload)
        setError(secondErr.message)
        toast.error(secondErr.message)
        setStatus('idle')
      }
    }
  }

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
        quantity,
      })

      const rzp = new Razorpay({
        key: order.razorpayKeyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: event?.title || 'Event ticket',
        description: `${quantity} × ${decodedTier} ticket${quantity === 1 ? '' : 's'}`,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#facc15' },
        handler: async (response) => {
          const payload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            eventId: id,
            tierName: decodedTier,
            attendeeName: user.name,
            attendeeEmail: user.email,
            quantity,
          }
          await verifyWithRetry(payload)
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
  if (!tier) return <div className="alert alert-error max-w-md mx-auto">Tier not found.</div>

  const total = tier.price * quantity

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
              <span className="opacity-70">
                {tier.name} ticket × {quantity}
              </span>
              <span className="font-semibold">₹{total}</span>
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
              <span className="brand-gradient-text">₹{total}</span>
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

          {pendingPayload ? (
            <div className="bg-warning/10 border border-warning/40 rounded-xl p-4 space-y-3">
              <div>
                <div className="font-semibold text-warning">Payment captured but not yet verified</div>
                <div className="text-xs opacity-80 mt-1">
                  We received your Razorpay payment but the confirmation didn't reach us.
                  Click retry — your tickets will be issued without re-charging.
                </div>
              </div>
              <button
                onClick={() => verifyWithRetry(pendingPayload)}
                disabled={status === 'verifying'}
                className="gradient-cta w-full rounded-xl py-3 font-semibold text-sm"
              >
                {status === 'verifying' ? 'Verifying…' : 'Retry verification'}
              </button>
              <button
                onClick={clearPending}
                className="block w-full text-xs opacity-60 hover:opacity-100 underline"
              >
                Dismiss (I'll contact support instead)
              </button>
            </div>
          ) : (
            <button
              onClick={pay}
              disabled={status !== 'idle'}
              className="gradient-cta w-full rounded-xl py-3.5 font-bold text-base"
            >
              {status === 'idle' && `Pay ₹${total} via Razorpay`}
              {status === 'loading' && 'Opening Razorpay…'}
              {status === 'verifying' && 'Verifying payment…'}
            </button>
          )}

          {error && <div className="alert alert-error text-sm py-2">{error}</div>}
        </div>
      </div>
    </div>
  )
}
