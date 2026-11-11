import { Link, useSearchParams } from 'react-router-dom'

export default function Success() {
  const [params] = useSearchParams()
  const ticketIds = params.getAll('id')
  const emailSent = params.get('email') !== '0'

  return (
    <div className="max-w-md mx-auto surface rounded-2xl p-8 space-y-5 text-center">
      <div className="flex justify-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 brand-gradient rounded-full animate-pop-in" />
          <svg
            viewBox="0 0 52 52"
            className="relative w-12 h-12 text-black"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M14 27 L23 36 L40 17"
              style={{
                strokeDasharray: 60,
                strokeDashoffset: 60,
                animation: 'check-draw 600ms 250ms cubic-bezier(0.65, 0, 0.45, 1) forwards',
              }}
            />
          </svg>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold">Payment successful</h1>
        <p className="text-sm opacity-60 mt-1">
          {ticketIds.length === 1
            ? 'Your ticket is confirmed.'
            : `All ${ticketIds.length} tickets are confirmed.`}{' '}
          {emailSent
            ? 'Check your inbox for the email confirmation.'
            : 'Save the links below — we could not send the email.'}
        </p>
      </div>

      {!emailSent && (
        <div className="alert alert-warning text-sm text-left">
          <span>
            We couldn't send the confirmation email. Your tickets are valid — open each
            one below and either print it or bookmark the link.
          </span>
        </div>
      )}

      {ticketIds.length === 0 ? (
        <div className="alert alert-warning text-sm">
          We couldn't find any ticket IDs in this link.
        </div>
      ) : (
        <div className="space-y-2 text-left">
          {ticketIds.map((tid, i) => (
            <a
              key={tid}
              href={`/ticket/${tid}`}
              target="_blank"
              rel="noreferrer"
              className="gradient-cta block w-full py-3 px-4 rounded-xl font-semibold text-center"
            >
              🎟️ Open ticket {ticketIds.length > 1 ? i + 1 : ''}
            </a>
          ))}
        </div>
      )}

      <Link
        to="/"
        className="block w-full py-2 text-sm opacity-70 hover:opacity-100 transition"
      >
        ← Back to events
      </Link>

      <style>{`
        @keyframes check-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
