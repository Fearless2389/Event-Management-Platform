import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const TOKEN_TTL = '7d'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not set')
  return secret
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role, name: user.name },
    getSecret(),
    { expiresIn: TOKEN_TTL },
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret())
  } catch {
    return null
  }
}

export function publicUser(user) {
  return {
    _id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  }
}
