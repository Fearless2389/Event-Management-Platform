import { getToken, logout } from './auth'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const SLOW_THRESHOLD_MS = 5000

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let slowTimer = null
  if (typeof window !== 'undefined') {
    slowTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('em:slow-request'))
    }, SLOW_THRESHOLD_MS)
  }

  const finish = () => {
    if (slowTimer) clearTimeout(slowTimer)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('em:request-done'))
    }
  }

  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await res.text()
    const data = text ? JSON.parse(text) : null

    if (!res.ok) {
      if (res.status === 401 && token) {
        logout()
      }
      const message = data?.error || `Request failed (${res.status})`
      throw new Error(message)
    }
    return data
  } finally {
    finish()
  }
}

export const api = {
  signup: (data) => request('/auth/signup', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),

  listEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  createEvent: (data) => request('/events', { method: 'POST', body: data }),
  myEvents: () => request('/events/mine'),
  eventTickets: (id) => request(`/events/${id}/tickets`),

  getTicket: (id) => request(`/tickets/${id}`),

  createOrder: (data) => request('/payments/order', { method: 'POST', body: data }),
  verifyPayment: (data) => request('/payments/verify', { method: 'POST', body: data }),

  checkin: (qrPayload, eventId) =>
    request('/tickets/checkin', { method: 'POST', body: { qrPayload, eventId } }),
}
