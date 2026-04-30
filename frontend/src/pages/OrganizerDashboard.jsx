import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    api.myEvents().then(setEvents).catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Your events</h1>
        <Link to="/create" className="btn btn-primary btn-sm">
          + New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center opacity-70 py-12">
          You haven't created any events yet.
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 shadow rounded">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>When</th>
                <th>Venue</th>
                <th>Sold</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const sold = ev.ticketTiers.reduce((s, t) => s + t.sold, 0)
                const total = ev.ticketTiers.reduce((s, t) => s + t.capacity, 0)
                return (
                  <tr key={ev._id}>
                    <td>
                      <Link to={`/events/${ev._id}`} className="link">
                        {ev.title}
                      </Link>
                    </td>
                    <td>{new Date(ev.dateTime).toLocaleString()}</td>
                    <td>{ev.venue}</td>
                    <td>
                      {sold} / {total}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/scan/${ev._id}`}
                        className="btn btn-primary btn-xs"
                      >
                        Scan tickets
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
