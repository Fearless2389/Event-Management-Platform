// MVP-only auth: email + name in localStorage. Not production.
const KEY = 'em_user'

export function getUser() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setUser(user) {
  localStorage.setItem(KEY, JSON.stringify(user))
}

export function logout() {
  localStorage.removeItem(KEY)
}
