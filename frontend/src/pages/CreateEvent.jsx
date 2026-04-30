import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const empty = () => ({ name: '', price: '', capacity: '' })

export default function CreateEvent() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    dateTime: '',
    capacity: '',
    imageUrl: '',
  })
  const [tiers, setTiers] = useState([{ name: 'Standard', price: '', capacity: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const nav = useNavigate()

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function updateTier(idx, field, value) {
    setTiers((arr) => arr.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)
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
      nav(`/events/${ev._id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="max-w-2xl mx-auto card bg-base-100 shadow" onSubmit={submit}>
      <div className="card-body gap-4">
        <h1 className="card-title">Create event</h1>

        <Field label="Title">
          <input
            required
            className="input input-bordered w-full"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={3}
            className="textarea textarea-bordered w-full"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Venue">
            <input
              required
              className="input input-bordered w-full"
              value={form.venue}
              onChange={(e) => update('venue', e.target.value)}
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
            />
          </Field>
          <Field label="Image URL (optional)">
            <input
              className="input input-bordered w-full"
              value={form.imageUrl}
              onChange={(e) => update('imageUrl', e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Ticket tiers</span>
            <button
              type="button"
              className="btn btn-xs"
              onClick={() => setTiers((t) => [...t, empty()])}
            >
              + Add tier
            </button>
          </div>
          <div className="space-y-2">
            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input
                  required
                  placeholder="Name"
                  className="input input-bordered input-sm col-span-5"
                  value={t.name}
                  onChange={(e) => updateTier(i, 'name', e.target.value)}
                />
                <input
                  required
                  type="number"
                  min="0"
                  placeholder="Price"
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
                  className="btn btn-ghost btn-sm col-span-1"
                  onClick={() => setTiers((arr) => arr.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="alert alert-error text-sm">{error}</div>}

        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Creating…' : 'Create event'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      {children}
    </label>
  )
}
