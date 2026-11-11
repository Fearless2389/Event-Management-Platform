import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { getEventImage } from '../lib/eventImage'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function Ticket() {
  const { id } = useParams()
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
      <div className="ticket-page-shell">
        <div className="ticket-card">
          <h1 className="text-2xl font-extrabold mb-2">Ticket not found</h1>
          <p className="opacity-70">
            ID <code>{id}</code> doesn't match any ticket.
          </p>
        </div>
      </div>
    )
  if (!data) return <div className="ticket-page-shell"><p className="opacity-60">Loading…</p></div>

  const { ticket, event } = data
  const when = event?.dateTime
    ? new Date(event.dateTime).toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBA'

  return (
    <div className="ticket-page-shell">
      <div className="ticket-card">
        <div className="ticket-banner">
          <img src={getEventImage(event, 'hero')} alt="" />
          <div className="ticket-banner-overlay" />
          <div className="ticket-banner-content">
            <div className="ticket-brand">🎟️ EventHub</div>
            <span className={`ticket-status ${ticket.checkedIn ? 'checked' : 'valid'}`}>
              {ticket.checkedIn ? 'CHECKED IN' : 'VALID'}
            </span>
          </div>
        </div>

        <div className="ticket-body">
          <div className="ticket-info">
            <h1>{event?.title || 'Event'}</h1>
            <p className="muted">{when}</p>
            <p className="muted">{event?.venue || ''}</p>
            <hr />
            <p>
              <strong>Attendee:</strong> {ticket.attendeeName}
            </p>
            <p>
              <strong>Tier:</strong> {ticket.tierName}
            </p>
            <p>
              <strong>Price:</strong> ₹{ticket.price}
            </p>
            <p className="ticket-id">
              Ticket ID: <code>{ticket._id}</code>
            </p>
          </div>
          <div className="ticket-qr">
            <QRCodeCanvas value={String(ticket._id)} size={240} includeMargin />
            <p className="muted">Show this at entry</p>
          </div>
        </div>

        <div className="ticket-footer">
          <button onClick={() => window.print()} className="print-btn">
            🖨️ Print ticket
          </button>
        </div>
      </div>

      <style>{`
        .ticket-page-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #0b0b0e;
          color: #fff;
        }
        .ticket-card {
          width: 100%;
          max-width: 720px;
          background: #15151a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0,0,0,0.45);
        }
        .ticket-banner {
          position: relative;
          height: 200px;
        }
        .ticket-banner img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ticket-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.25));
        }
        .ticket-banner-content {
          position: absolute;
          inset: 0;
          padding: 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .ticket-brand {
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 0.02em;
        }
        .ticket-status {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(250, 204, 21, 0.95);
          color: #1a1a1a;
        }
        .ticket-status.checked {
          background: rgba(239, 68, 68, 0.95);
          color: #fff;
        }
        .ticket-body {
          padding: 28px;
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 28px;
          align-items: center;
        }
        @media (max-width: 640px) {
          .ticket-body { grid-template-columns: 1fr; }
          .ticket-qr { justify-self: center; }
        }
        .ticket-info h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 8px;
          line-height: 1.15;
        }
        .ticket-info hr {
          border: none;
          border-top: 1px dashed rgba(255,255,255,0.12);
          margin: 16px 0;
        }
        .ticket-info p { margin: 6px 0; font-size: 14px; }
        .muted { color: rgba(255,255,255,0.6); }
        .ticket-id { margin-top: 12px !important; font-size: 12px !important; opacity: 0.6; }
        .ticket-id code { background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; }
        .ticket-qr { text-align: center; }
        .ticket-qr canvas {
          background: #fff;
          padding: 12px;
          border-radius: 12px;
        }
        .ticket-qr p { margin-top: 10px; font-size: 12px; }
        .ticket-footer {
          padding: 16px 28px 28px;
          display: flex;
          justify-content: flex-end;
          border-top: 1px dashed rgba(255,255,255,0.08);
        }
        .print-btn {
          background: linear-gradient(135deg, #facc15, #f59e0b);
          color: #1a1a1a;
          border: none;
          padding: 10px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }
        @media print {
          .ticket-page-shell { background: #fff; padding: 0; }
          .ticket-card {
            background: #fff;
            color: #111;
            box-shadow: none;
            border: 1px solid #ddd;
          }
          .ticket-banner-overlay { background: linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1)); }
          .muted { color: #555; }
          .ticket-info hr { border-top: 1px dashed #ccc; }
          .ticket-id code { background: #f1f1f1; }
          .ticket-footer { display: none; }
        }
      `}</style>
    </div>
  )
}
