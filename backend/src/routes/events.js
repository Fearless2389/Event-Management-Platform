import express from 'express'
import { Event } from '../models/Event.js'
import { Ticket } from '../models/Ticket.js'
import { requireUser } from '../middleware/userEmail.js'

const router = express.Router()

router.get('/', async (_req, res, next) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 }).lean()
    res.json(events)
  } catch (e) {
    next(e)
  }
})

router.get('/mine', requireUser, async (req, res, next) => {
  try {
    const events = await Event.find({ organizerEmail: req.userEmail })
      .sort({ dateTime: 1 })
      .lean()
    res.json(events)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const ev = await Event.findById(req.params.id).lean()
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
    if (ev.organizerEmail !== req.userEmail) {
      return res.status(403).json({ error: 'Not your event' })
    }
    const tickets = await Ticket.find({ eventId: ev._id }).sort({ createdAt: -1 }).lean()
    res.json(tickets)
  } catch (e) {
    next(e)
  }
})

router.post('/', requireUser, async (req, res, next) => {
  try {
    const { title, description, venue, dateTime, capacity, ticketTiers, imageUrl, category } = req.body
    const ev = await Event.create({
      organizerEmail: req.userEmail,
      title,
      description,
      venue,
      dateTime,
      capacity,
      ticketTiers: (ticketTiers || []).map((t) => ({
        name: t.name,
        price: t.price,
        capacity: t.capacity,
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
