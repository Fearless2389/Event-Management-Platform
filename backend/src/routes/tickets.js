import express from 'express'
import mongoose from 'mongoose'
import { Ticket } from '../models/Ticket.js'
import { Event } from '../models/Event.js'
import { requireUser } from '../middleware/userEmail.js'

const router = express.Router()

router.post('/checkin', requireUser, async (req, res, next) => {
  try {
    const { qrPayload, eventId } = req.body
    if (!qrPayload) return res.status(400).json({ error: 'Missing qrPayload' })

    if (!mongoose.isValidObjectId(qrPayload)) {
      return res.status(400).json({ error: 'Invalid QR payload' })
    }

    const ticket = await Ticket.findById(qrPayload)
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' })

    if (eventId && String(ticket.eventId) !== String(eventId)) {
      return res.status(400).json({ error: 'Ticket is for a different event' })
    }

    const ev = await Event.findById(ticket.eventId)
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    if (ev.organizerEmail !== req.userEmail) {
      return res.status(403).json({ error: 'Not the organizer of this event' })
    }

    if (ticket.checkedIn) {
      const jspBase = process.env.JSP_BASE_URL || 'http://localhost:8080/event-mgmt'
      return res.status(409).json({
        error: 'Ticket already checked in',
        checkedInAt: ticket.checkedInAt,
        jspCheckinUrl: `${jspBase}/checkin.jsp?id=${ticket._id}&already=1`,
      })
    }

    ticket.checkedIn = true
    ticket.checkedInAt = new Date()
    await ticket.save()

    const jspBase = process.env.JSP_BASE_URL || 'http://localhost:8080/event-mgmt'
    res.json({
      ticketId: String(ticket._id),
      attendeeName: ticket.attendeeName,
      tierName: ticket.tierName,
      jspCheckinUrl: `${jspBase}/checkin.jsp?id=${ticket._id}`,
    })
  } catch (e) {
    next(e)
  }
})

export default router
