import { Link, useSearchParams } from 'react-router-dom'

export default function Success() {
  const [params] = useSearchParams()
  const ticketId = params.get('ticketId')
  const jspUrl = params.get('jspUrl')
  const emailUrl = params.get('emailUrl')

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
          Your ticket is confirmed. We've also emailed it to you.
        </p>
      </div>

      <div className="bg-base-100/50 border border-white/5 rounded-xl p-3 text-xs opacity-70">
        Ticket ID: <code className="text-xs">{ticketId}</code>
      </div>

      <div className="space-y-2">
        {jspUrl && (
          <a
            href={jspUrl}
            target="_blank"
            rel="noreferrer"
            className="gradient-cta block w-full py-3 rounded-xl font-semibold"
          >
            🎟️  Open printable ticket
          </a>
        )}
        {emailUrl && (
          <a
            href={emailUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-3 rounded-xl font-medium border border-white/10 hover:border-white/30 hover:bg-white/5 transition"
          >
            📧  View confirmation email
          </a>
        )}
        <Link
          to="/"
          className="block w-full py-2 text-sm opacity-70 hover:opacity-100 transition"
        >
          ← Back to events
        </Link>
      </div>

      <style>{`
        @keyframes check-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
