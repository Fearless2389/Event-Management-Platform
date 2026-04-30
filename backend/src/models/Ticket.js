import mongoose from 'mongoose'

const TicketSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true, lowercase: true },
    tierName: { type: String, required: true },
    price: { type: Number, required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    qrPayload: { type: String, required: true, index: true },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export const Ticket = mongoose.model('Ticket', TicketSchema)
