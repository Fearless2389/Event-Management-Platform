import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function Checkin() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const alreadyChecked = params.get('already') === '1'
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/api/tickets/${id}`)
      .then(async (r) => {
        const text = await r.text()
        const body = text ? JSON.parse(text) : null
        if (!r.ok) throw new Error(body?.error || `Request failed (${r.status})`)
        return body
      })
      .then((body) => {
        if (!cancelled) setData(body)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error)
    return (
      <ShellWrap>
        <div className="checkin-card error">
          <div className="big">❌</div>
          <h1>Invalid ticket</h1>
          <p className="muted">
            ID <code>{id}</code> doesn't match any ticket.
          </p>
        </div>
      </ShellWrap>
    )
  if (!data)
    return (
      <ShellWrap>
        <p className="opacity-60">Loading…</p>
      </ShellWrap>
    )

  const { ticket, event } = data
  const checkedAt = ticket.checkedInAt
    ? new Date(ticket.checkedInAt).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })
    : 'just now'

  return (
    <ShellWrap>
      <div className={`checkin-card ${alreadyChecked ? 'warn' : 'ok'}`}>
        {alreadyChecked ? (
          <>
            <div className="big">⚠️</div>
            <h1>Already checked in</h1>
            <p className="muted">This ticket was used at {checkedAt}.</p>
          </>
        ) : (
          <>
            <div className="big">✅</div>
            <h1>Checked in</h1>
            <p className="muted">Welcome, {ticket.attendeeName}</p>
          </>
        )}
        <hr />
        <Row label="Event" value={event?.title || '—'} />
        <Row label="Tier" value={ticket.tierName} />
        <Row label="Attendee" value={ticket.attendeeName} />
        <Row label="Time" value={checkedAt} />
      </div>
    </ShellWrap>
  )
}

function Row({ label, value }) {
  return (
    <div className="row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ShellWrap({ children }) {
  return (
    <div className="checkin-shell">
      {children}
      <style>{`
        .checkin-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #0b0b0e;
          color: #fff;
        }
        .checkin-card {
          width: 100%;
          max-width: 440px;
          background: #15151a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 36px 28px;
          text-align: center;
          box-shadow: 0 30px 80px rgba(0,0,0,0.45);
        }
        .checkin-card.ok { border-top: 4px solid #22c55e; }
        .checkin-card.warn { border-top: 4px solid #f59e0b; }
        .checkin-card.error { border-top: 4px solid #ef4444; }
        .checkin-card .big { font-size: 64px; line-height: 1; margin-bottom: 14px; }
        .checkin-card h1 { font-size: 26px; font-weight: 800; margin: 0 0 6px; }
        .checkin-card .muted { color: rgba(255,255,255,0.65); font-size: 14px; margin: 0; }
        .checkin-card hr { border: none; border-top: 1px dashed rgba(255,255,255,0.1); margin: 24px 0 16px; }
        .checkin-card .row {
          display: flex;
          justify-content: space-between;
          padding: 8px 4px;
          font-size: 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .checkin-card .row:last-of-type { border-bottom: none; }
        .checkin-card .row span { color: rgba(255,255,255,0.55); }
        .checkin-card code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
      `}</style>
    </div>
  )
}
