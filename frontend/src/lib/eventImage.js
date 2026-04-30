// Curated Unsplash photos per category, used as a fallback when an event has no imageUrl.
// Picked deterministically by hashing the event _id so the same event always shows the same photo.

const PHOTOS = {
  Music: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a',
  ],
  Tech: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7',
    'https://images.unsplash.com/photo-1531058020387-3be344556be6',
  ],
  Comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260',
    'https://images.unsplash.com/photo-1611689033124-6c5677ed4d97',
  ],
  Sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b',
  ],
  Theatre: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf',
    'https://images.unsplash.com/photo-1516280440614-37939bbacd81',
  ],
  Other: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3',
  ],
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// Returns a usable image URL for the event. Prefers the organizer-supplied imageUrl,
// falls back to a deterministic category photo. `size` is "hero" | "card" | "thumb".
export function getEventImage(event, size = 'card') {
  if (event?.imageUrl) return event.imageUrl
  const category = (event?.category && PHOTOS[event.category]) ? event.category : 'Other'
  const bucket = PHOTOS[category]
  const idx = hash(String(event?._id || event?.title || '')) % bucket.length
  const base = bucket[idx]
  const params = sizeToParams(size)
  return `${base}?${params}`
}

function sizeToParams(size) {
  switch (size) {
    case 'hero':
      return 'w=1600&h=900&q=75&auto=format&fit=crop'
    case 'thumb':
      return 'w=200&h=200&q=70&auto=format&fit=crop'
    case 'card':
    default:
      return 'w=600&h=800&q=75&auto=format&fit=crop'
  }
}
