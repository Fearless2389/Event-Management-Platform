import express from 'express'
import { Event } from '../models/Event.js'
import { Ticket } from '../models/Ticket.js'
import { requireRole, requireUser } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (_req, res, next) => {
  try {
    const events = await Event.find()
      .select('-organizerEmail')
      .sort({ dateTime: 1 })
      .lean()
    res.json(events)
  } catch (e) {
    next(e)
  }
})

router.get('/mine', requireUser, async (req, res, next) => {
  try {
    const events = await Event.find({ organizerEmail: req.user.email })
      .sort({ dateTime: 1 })
      .lean()
    res.json(events)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const ev = await Event.findById(req.params.id)
      .select('-organizerEmail')
      .lean()
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    res.json(ev)
  } catch (e) {
    next(e)
  }
})

router.get('/:id/tickets', requireUser, async (req, res, next) => {
  try {
    const ev = await Event.findById(req.params.id)
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    if (ev.organizerEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not your event' })
    }
    const tickets = await Ticket.find({ eventId: ev._id }).sort({ createdAt: -1 }).lean()
    res.json(tickets)
  } catch (e) {
    next(e)
  }
})

router.post('/', requireRole('organizer'), async (req, res, next) => {
  try {
    const { title, description, venue, dateTime, ticketTiers, imageUrl, category } = req.body

    if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
      return res.status(400).json({ error: 'Invalid date & time' })
    }
    if (new Date(dateTime).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Event date & time must be in the future' })
    }

    const tiers = Array.isArray(ticketTiers) ? ticketTiers : []
    if (tiers.length === 0) {
      return res.status(400).json({ error: 'At least one ticket tier is required' })
    }
    const names = tiers.map((t) => String(t?.name || '').trim()).filter(Boolean)
    if (names.length !== tiers.length) {
      return res.status(400).json({ error: 'Every tier needs a name' })
    }
    if (new Set(names).size !== names.length) {
      return res.status(400).json({ error: 'Tier names must be unique within an event' })
    }

    const ev = await Event.create({
      organizerEmail: req.user.email,
      title,
      description,
      venue,
      dateTime,
      ticketTiers: tiers.map((t) => ({
        name: String(t.name).trim(),
        price: Number(t.price),
        capacity: Number(t.capacity),
        sold: 0,
      })),
      imageUrl: imageUrl || '',
      category: category || 'Other',
    })
    res.status(201).json(ev)
  } catch (e) {
    next(e)
  }
})

export default router
