import mongoose from 'mongoose'

const TierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
)

const EventSchema = new mongoose.Schema(
  {
    organizerEmail: { type: String, required: true, lowercase: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    venue: { type: String, required: true },
    dateTime: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    ticketTiers: { type: [TierSchema], validate: (v) => v.length > 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: true },
)

export const Event = mongoose.model('Event', EventSchema)
