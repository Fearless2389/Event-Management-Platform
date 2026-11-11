const KEY = 'em_session'

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getUser() {
  const s = getSession()
  return s?.user || null
}

export function getToken() {
  const s = getSession()
  return s?.token || null
}

export function setSession({ token, user }) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }))
}

export function logout() {
  localStorage.removeItem(KEY)
}
