import express from 'express'
import { Event } from '../models/Event.js'
import { Ticket } from '../models/Ticket.js'
import { getRazorpay, verifySignature } from '../services/razorpay.js'
import { generateQrPng } from '../services/qr.js'
import { sendTicketEmail } from '../services/email.js'

const router = express.Router()

router.post('/order', async (req, res, next) => {
  try {
    const { eventId, tierName, attendeeName, attendeeEmail } = req.body
    if (!eventId || !tierName || !attendeeName || !attendeeEmail) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const ev = await Event.findById(eventId)
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    const tier = ev.ticketTiers.find((t) => t.name === tierName)
    if (!tier) return res.status(400).json({ error: 'Tier not found' })
    if (tier.sold >= tier.capacity) {
      return res.status(409).json({ error: 'Tier sold out' })
    }

    const rzp = getRazorpay()
    const order = await rzp.orders.create({
      amount: tier.price * 100,
      currency: 'INR',
      receipt: `ev_${ev._id}_${Date.now()}`,
      notes: { eventId: String(ev._id), tierName, attendeeEmail },
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (e) {
    next(e)
  }
})

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

    const ok = verifySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    })
    if (!ok) return res.status(400).json({ error: 'Invalid signature' })

    const ev = await Event.findById(eventId)
    if (!ev) return res.status(404).json({ error: 'Event not found' })
    const tier = ev.ticketTiers.find((t) => t.name === tierName)
    if (!tier) return res.status(400).json({ error: 'Tier not found' })
    if (tier.sold >= tier.capacity) {
      return res.status(409).json({ error: 'Tier sold out' })
    }

    const ticket = await Ticket.create({
      eventId: ev._id,
      attendeeName,
      attendeeEmail,
      tierName,
      price: tier.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      qrPayload: '', // set below to ticket._id
    })
    ticket.qrPayload = String(ticket._id)
    await ticket.save()

    tier.sold += 1
    await ev.save()

    const qrPng = await generateQrPng(ticket.qrPayload)
    const jspBase = process.env.JSP_BASE_URL || 'http://localhost:8080/event-mgmt'
    const jspTicketUrl = `${jspBase}/ticket.jsp?id=${ticket._id}`

    let etherealPreviewUrl = null
    try {
      const sent = await sendTicketEmail({
        to: attendeeEmail,
        attendeeName,
        event: ev,
        tierName,
        price: tier.price,
        ticketId: String(ticket._id),
        qrPng,
        jspTicketUrl,
      })
      etherealPreviewUrl = sent.previewUrl
    } catch (e) {
      console.error('Email send failed (non-fatal):', e.message)
    }

    res.json({
      ticketId: String(ticket._id),
      jspTicketUrl,
      etherealPreviewUrl,
    })
  } catch (e) {
    next(e)
  }
})

export default router
