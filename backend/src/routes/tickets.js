import express from 'express'
import mongoose from 'mongoose'
import { Ticket } from '../models/Ticket.js'
import { Event } from '../models/Event.js'
import { requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid ticket id' })
    }
    const ticket = await Ticket.findById(id)
      .select('-attendeeEmail -razorpayPaymentId -razorpayOrderId -ticketIndex -qrPayload')
      .lean()
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })
    const event = await Event.findById(ticket.eventId)
      .select('-organizerEmail')
      .lean()
    res.json({ ticket, event })
  } catch (e) {
    next(e)
  }
})

router.post('/checkin', requireRole('organizer'), async (req, res, next) => {
  try {
    const { qrPayload, eventId } = req.body
    if (!qrPayload) return res.status(400).json({ error: 'Missing qrPayload' })

    if (!mongoose.isValidObjectId(qrPayload)) {
      return res.status(400).json({ error: 'Invalid QR payload' })
    }

    const ticket = await Ticket.findById(qrPayload).lean()
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

    if (eventId && String(ticket.eventId) !== String(eventId)) {
      return res.status(400).json({ error: 'Ticket is for a different event' })
    }

    const ev = await Event.findById(ticket.eventId).lean()
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    if (ev.organizerEmail !== req.user.email) {
      return res.status(403).json({ error: 'Not the organizer of this event' })
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const checkinBase = `${frontendUrl}/checkin/${ticket._id}`

    const updated = await Ticket.findOneAndUpdate(
      { _id: ticket._id, checkedIn: false },
      { $set: { checkedIn: true, checkedInAt: new Date() } },
      { new: true },
    ).lean()

    if (updated) {
      return res.json({
        ticketId: String(updated._id),
        attendeeName: updated.attendeeName,
        tierName: updated.tierName,
        checkinUrl: checkinBase,
      })
    }

    const current = await Ticket.findById(ticket._id).lean()
    const elapsed = Date.now() - new Date(current.checkedInAt).getTime()
    if (elapsed < 10_000) {
      return res.json({
        ticketId: String(current._id),
        attendeeName: current.attendeeName,
        tierName: current.tierName,
        checkinUrl: checkinBase,
      })
    }
    return res.status(409).json({
      error: 'Ticket already checked in',
      checkedInAt: current.checkedInAt,
      checkinUrl: `${checkinBase}?already=1`,
    })
  } catch (e) {
    next(e)
  }
})

export default router
