import express from 'express'
import { User } from '../models/User.js'
import { hashPassword, comparePassword, signToken, publicUser } from '../services/auth.js'
import { requireUser } from '../middleware/auth.js'

const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/signup', async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body
    if (!email || !name || !password || !role) {
      return res.status(400).json({ error: 'email, name, password, role are required' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    if (!['attendee', 'organizer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const normalized = String(email).toLowerCase().trim()
    if (!EMAIL_RE.test(normalized)) {
      return res.status(400).json({ error: 'Invalid email address' })
    }
    const existing = await User.findOne({ email: normalized })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const passwordHash = await hashPassword(password)
    let user
    try {
      user = await User.create({ email: normalized, name: String(name).trim(), passwordHash, role })
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }
      throw err
    }
    const token = signToken(user)
    res.status(201).json({ token, user: publicUser(user) })
  } catch (e) {
    next(e)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }
    const user = await User.findOne({ email: String(email).toLowerCase().trim() })
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

    const token = signToken(user)
    res.json({ token, user: publicUser(user) })
  } catch (e) {
    next(e)
  }
})

router.get('/me', requireUser, (req, res) => {
  res.json({ user: req.user })
})

export default router
