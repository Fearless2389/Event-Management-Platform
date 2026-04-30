import { getUser } from './auth'

// Empty in dev → Vite proxies /api/* to the backend. Set VITE_API_URL in
// production (e.g. on Vercel) to the public URL of the deployed backend.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

async function request(path, { method = 'GET', body } = {}) {
  const user = getUser()
  const headers = { 'Content-Type': 'application/json' }
  if (user?.email) headers['X-User-Email'] = user.email

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    throw new Error(message)
  }
  return data
}

export const api = {
  listEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (data) => request('/events', { method: 'POST', body: data }),
  myEvents: () => request('/events/mine'),
  eventTickets: (id) => request(`/events/${id}/tickets`),

  createOrder: (data) => request('/payments/order', { method: 'POST', body: data }),
  verifyPayment: (data) => request('/payments/verify', { method: 'POST', body: data }),

  checkin: (qrPayload, eventId) =>
    request('/tickets/checkin', { method: 'POST', body: { qrPayload, eventId } }),
}
