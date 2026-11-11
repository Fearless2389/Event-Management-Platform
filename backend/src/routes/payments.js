import express from 'express'
import mongoose from 'mongoose'
import { Event } from '../models/Event.js'
import { Ticket } from '../models/Ticket.js'
import { getRazorpay, verifySignature } from '../services/razorpay.js'
import { generateQrPng } from '../services/qr.js'
import { sendTicketEmail } from '../services/email.js'

const router = express.Router()

const MAX_QTY = 10
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseQuantity(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 1
  return Math.max(1, Math.min(MAX_QTY, Math.floor(n)))
}

router.post('/order', async (req, res, next) => {
  try {
    const { eventId, tierName, attendeeName, attendeeEmail } = req.body
    const quantity = parseQuantity(req.body?.quantity ?? 1)

    if (!eventId || !tierName || !attendeeName || !attendeeEmail) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    if (!EMAIL_RE.test(String(attendeeEmail).trim())) {
      return res.status(400).json({ error: 'Invalid attendee email' })
    }

    const ev = await Event.findById(eventId)
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    const tier = ev.ticketTiers.find((t) => t.name === tierName)
    if (!tier) return res.status(400).json({ error: 'Tier not found' })

    const remaining = tier.capacity - tier.sold
    if (remaining <= 0) {
      return res.status(409).json({ error: 'Tier sold out' })
    }
    if (quantity > remaining) {
      return res.status(409).json({ error: `Only ${remaining} ticket(s) left in this tier` })
    }

    const rzp = getRazorpay()
    const order = await rzp.orders.create({
      amount: tier.price * quantity * 100,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      notes: { eventId: String(ev._id), tierName, attendeeEmail, quantity: String(quantity) },
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      quantity,
    })
  } catch (e) {
    next(e)
  }
})

function frontendBase() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
}

function buildReplayResponse(existingTickets) {
  const base = frontendBase()
  const ids = existingTickets.map((t) => String(t._id))
  return {
    ticketIds: ids,
    firstTicketUrl: ids[0] ? `${base}/ticket/${ids[0]}` : null,
    emailPreviewUrl: null,
    emailSent: false,
    replay: true,
  }
}

router.post('/verify', async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      tierName,
      attendeeName,
      attendeeEmail,
    } = req.body
    const quantity = parseQuantity(req.body?.quantity ?? 1)

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !eventId ||
      !tierName ||
      !attendeeEmail
    ) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (
      !verifySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      })
    ) {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    const existing = await Ticket.find({ razorpayPaymentId: razorpay_payment_id })
      .sort({ ticketIndex: 1 })
      .lean()
    if (existing.length > 0) {
      return res.json(buildReplayResponse(existing))
    }

    const rzp = getRazorpay()
    const order = await rzp.orders.fetch(razorpay_order_id)
    if (!order) return res.status(404).json({ error: 'Order not found at Razorpay' })

    const notesEventId = String(order.notes?.eventId || '')
    const notesTier = String(order.notes?.tierName || '')
    const notesQty = parseQuantity(order.notes?.quantity ?? 1)
    if (
      notesEventId !== String(eventId) ||
      notesTier !== tierName ||
      notesQty !== quantity
    ) {
      return res.status(400).json({ error: 'Order details do not match the original order' })
    }

    const ev = await Event.findById(eventId)
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    const tier = ev.ticketTiers.find((t) => t.name === tierName)
    if (!tier) return res.status(400).json({ error: 'Tier not found' })

    if (Number(order.amount) !== tier.price * quantity * 100) {
      return res.status(400).json({ error: 'Order amount does not match the tier price' })
    }

    const maxSold = tier.capacity - quantity
    const incremented = await Event.findOneAndUpdate(
      {
        _id: ev._id,
        ticketTiers: { $elemMatch: { name: tierName, sold: { $lte: maxSold } } },
      },
      { $inc: { 'ticketTiers.$.sold': quantity } },
      { new: true },
    )
    if (!incremented) {
      return res
        .status(409)
        .json({ error: `Not enough ${tierName} tickets remaining` })
    }

    const docs = Array.from({ length: quantity }, (_, i) => {
      const _id = new mongoose.Types.ObjectId()
      return {
        _id,
        eventId: ev._id,
        attendeeName,
        attendeeEmail,
        tierName,
        price: tier.price,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        ticketIndex: i,
        qrPayload: String(_id),
      }
    })

    let created
    try {
      created = await Ticket.insertMany(docs, { ordered: true })
    } catch (e) {
      if (e?.code === 11000 || e?.writeErrors?.some((w) => w?.code === 11000)) {
        await Event.findOneAndUpdate(
          { _id: ev._id, 'ticketTiers.name': tierName },
          { $inc: { 'ticketTiers.$.sold': -quantity } },
        )
        await Ticket.deleteMany({
          razorpayPaymentId: razorpay_payment_id,
          _id: { $in: docs.map((d) => d._id) },
        })
        const winner = await Ticket.find({ razorpayPaymentId: razorpay_payment_id })
          .sort({ ticketIndex: 1 })
          .lean()
        return res.json(buildReplayResponse(winner))
      }
      throw e
    }

    const base = frontendBase()
    const ticketsForEmail = await Promise.all(
      created.map(async (t) => ({
        ticketId: String(t._id),
        printUrl: `${base}/ticket/${t._id}`,
        qrPng: await generateQrPng(t.qrPayload),
      })),
    )

    let emailSent = false
    try {
      await sendTicketEmail({
        to: attendeeEmail,
        attendeeName,
        event: ev,
        tierName,
        price: tier.price,
        tickets: ticketsForEmail,
      })
      emailSent = Boolean(process.env.RESEND_API_KEY)
    } catch (e) {
      console.error('Email send failed (non-fatal):', e.message)
      emailSent = false
    }

    res.json({
      ticketIds: created.map((t) => String(t._id)),
      firstTicketUrl: ticketsForEmail[0]?.printUrl || null,
      emailPreviewUrl: null,
      emailSent,
      replay: false,
    })
  } catch (e) {
    next(e)
  }
})

export default router
