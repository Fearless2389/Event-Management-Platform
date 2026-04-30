import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { getEventImage } from '../lib/eventImage'

const CATEGORIES = ['Music', 'Tech', 'Comedy', 'Sports', 'Theatre', 'Other']
const empty = () => ({ name: '', price: '', capacity: '' })

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    dateTime: '',
    capacity: '',
    imageUrl: '',
    category: 'Other',
  })
  const [tiers, setTiers] = useState([{ name: 'Standard', price: '', capacity: '' }])
  const [submitting, setSubmitting] = useState(false)
  const nav = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateTier(idx, field, value) {
    setTiers((arr) => arr.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        ticketTiers: tiers.map((t) => ({
          name: t.name,
          price: Number(t.price),
          capacity: Number(t.capacity),
        })),
      }
      const ev = await api.createEvent(payload)
      toast.success('Event published!')
      nav(`/events/${ev._id}`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const minPrice = tiers
    .filter((t) => t.price !== '')
    .reduce((m, t) => Math.min(m, Number(t.price)), Infinity)

  return (
    <div className="grid lg:grid-cols-5 gap-8">
      <form onSubmit={submit} className="lg:col-span-3 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold">Create event</h1>
          <p className="opacity-60 text-sm mt-1">
            Fill out the basics — you can update details later.
          </p>
        </div>

        <Section title="Basics">
          <Field label="Event title">
            <input
              required
              className="input input-bordered w-full"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Tech Conf 2026"
            />
          </Field>

          <Field label="Description">
            <textarea
              required
              rows={3}
              className="textarea textarea-bordered w-full"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What's the event about?"
            />
          </Field>

          <Field label="Category">
            <select
              className="select select-bordered w-full"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="When & where">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Venue">
              <input
                required
                className="input input-bordered w-full"
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
                placeholder="Bangalore International Centre"
              />
            </Field>
            <Field label="Date & time">
              <input
                required
                type="datetime-local"
                className="input input-bordered w-full"
                value={form.dateTime}
                onChange={(e) => update('dateTime', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Total capacity">
              <input
                required
                type="number"
                min="1"
                className="input input-bordered w-full"
                value={form.capacity}
                onChange={(e) => update('capacity', e.target.value)}
                placeholder="100"
              />
            </Field>
            <Field label="Cover image URL (optional)">
              <input
                className="input input-bordered w-full"
                value={form.imageUrl}
                onChange={(e) => update('imageUrl', e.target.value)}
                placeholder="https://images.unsplash.com/…"
              />
            </Field>
          </div>
        </Section>

        <Section title="Tickets">
          <div className="space-y-3">
            {tiers.map((t, i) => (
              <div key={i} className="surface rounded-xl p-3 grid grid-cols-12 gap-2 items-center">
                <input
                  required
                  placeholder="Tier name"
                  className="input input-bordered input-sm col-span-5"
                  value={t.name}
                  onChange={(e) => updateTier(i, 'name', e.target.value)}
                />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="₹ Price"
                  className="input input-bordered input-sm col-span-3"
                  value={t.price}
                  onChange={(e) => updateTier(i, 'price', e.target.value)}
                />
                <input
                  required
                  type="number"
                  min="1"
                  placeholder="Capacity"
                  className="input input-bordered input-sm col-span-3"
                  value={t.capacity}
                  onChange={(e) => updateTier(i, 'capacity', e.target.value)}
                />
                <button
                  type="button"
                  disabled={tiers.length === 1}
                  className="text-base-content/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-30 col-span-1 text-center text-lg"
                  onClick={() => setTiers((arr) => arr.filter((_, j) => j !== i))}
                  aria-label="Remove tier"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTiers((t) => [...t, empty()])}
            className="text-sm font-medium brand-gradient-text hover:opacity-80"
          >
            + Add another tier
          </button>
        </Section>

        <button
          type="submit"
          disabled={submitting}
          className="gradient-cta w-full sm:w-auto px-8 py-3 rounded-xl font-bold"
        >
          {submitting ? 'Publishing…' : 'Publish event'}
        </button>
      </form>

      <aside className="lg:col-span-2 hidden lg:block">
        <div className="sticky top-24 space-y-2">
          <div className="text-xs uppercase tracking-wider opacity-60">Live preview</div>
          <div className="surface rounded-2xl overflow-hidden card-hover">
            <div className="aspect-[3/4] relative">
              <img
                src={getEventImage(
                  { imageUrl: form.imageUrl, category: form.category, title: form.title },
                  'card',
                )}
                alt="preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              {form.category && form.category !== 'Other' && (
                <span className="absolute top-3 left-3 backdrop-blur bg-black/40 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/10">
                  {form.category}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <h3 className="font-bold text-lg leading-tight line-clamp-2">
                  {form.title || 'Your event title'}
                </h3>
                <p className="text-xs opacity-90 mt-1">
                  {form.dateTime
                    ? new Date(form.dateTime).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Date'}{' '}
                  · {form.venue || 'Venue'}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-xs opacity-60">
                from{' '}
                <span className="font-bold text-base-content">
                  ₹{Number.isFinite(minPrice) ? minPrice : '—'}
                </span>
              </span>
              <span className="text-xs font-semibold brand-gradient-text">Book now →</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="surface rounded-2xl p-6 space-y-4">
      <h2 className="text-sm uppercase tracking-wider opacity-60 font-bold">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
