// Trusts the X-User-Email header. MVP-only — not real authentication.
export function userEmail(req, _res, next) {
  const raw = req.header('X-User-Email')
  req.userEmail = raw ? String(raw).toLowerCase().trim() : null
  next()
}

export function requireUser(req, res, next) {
  if (!req.userEmail) return res.status(401).json({ error: 'Sign in required' })
  next()
}
