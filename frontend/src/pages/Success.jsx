import { Link, useSearchParams } from 'react-router-dom'

export default function Success() {
  const [params] = useSearchParams()
  const ticketId = params.get('ticketId')
  const jspUrl = params.get('jspUrl')
  const emailUrl = params.get('emailUrl')

  return (
    <div className="max-w-md mx-auto card bg-base-100 shadow">
      <div className="card-body gap-3 items-center text-center">
        <div className="text-5xl">✅</div>
        <h1 className="card-title">Payment successful</h1>
        <p className="text-sm opacity-70">
          Ticket ID: <code className="text-xs">{ticketId}</code>
        </p>
        <div className="flex flex-col gap-2 w-full mt-2">
          {jspUrl && (
            <a
              href={jspUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
            >
              Open printable ticket (JSP)
            </a>
          )}
          {emailUrl && (
            <a
              href={emailUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
            >
              View confirmation email (Ethereal preview)
            </a>
          )}
          <Link to="/" className="btn btn-ghost btn-sm">
            Back to events
          </Link>
        </div>
      </div>
    </div>
  )
}
