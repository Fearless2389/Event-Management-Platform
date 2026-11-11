import { verifyToken } from '../services/auth.js'

function parseAuthHeader(req) {
  const header = req.header('Authorization') || req.header('authorization')
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}

export function optionalUser(req, _res, next) {
  const token = parseAuthHeader(req)
  if (!token) {
    req.user = null
    return next()
  }
  const payload = verifyToken(token)
  req.user = payload
    ? { _id: payload.sub, email: payload.email, name: payload.name, role: payload.role }
    : null
  next()
}

export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in required' })
  next()
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Sign in required' })
    if (req.user.role !== role) {
      return res.status(403).json({ error: `${role} role required` })
    }
    next()
  }
}
