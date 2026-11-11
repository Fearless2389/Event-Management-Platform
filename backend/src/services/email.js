import { Resend } from 'resend'

let resend = null

export async function initEmail() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn(
      '[email] RESEND_API_KEY not set — ticket emails will be skipped. ' +
        'Sign up at https://resend.com (free tier, no card) and set RESEND_API_KEY in your env.',
    )
    resend = null
    return
  }
  resend = new Resend(key)
}

export async function sendTicketEmail({ to, attendeeName, event, tierName, price, tickets }) {
  if (!resend) {
    console.warn('[email] Skipping send — Resend not initialised.')
    return { messageId: null, previewUrl: null }
  }

  const from = process.env.EMAIL_FROM || 'EventHub <onboarding@resend.dev>'
  const safeTickets = Array.isArray(tickets) ? tickets : []
  const total = price * safeTickets.length
  const when = new Date(event.dateTime).toLocaleString()

  const ticketsHtml = safeTickets
    .map(
      (t, i) => `
      <div style="border-top: 1px dashed #ddd; padding: 16px 0; text-align: center;">
        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">
          Ticket ${i + 1} of ${safeTickets.length}
        </div>
        <img src="cid:${cidFor(t.ticketId)}" alt="QR" style="width: 200px; height: 200px;" />
        <div style="font-size: 11px; color: #888; margin-top: 6px;">ID: ${t.ticketId}</div>
        <a href="${t.printUrl}"
           style="display: inline-block; margin-top: 10px; background: #facc15; color: #1a1a1a;
                  text-decoration: none; padding: 8px 14px; border-radius: 6px; font-weight: 600;">
          Open printable ticket
        </a>
      </div>
    `,
    )
    .join('')

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e5e5e5; border-radius: 12px; color: #111;">
      <h2 style="margin: 0 0 6px;">🎟️ Your tickets for ${escapeHtml(event.title)}</h2>
      <p style="margin: 0 0 16px; color: #555; font-size: 14px;">${escapeHtml(when)} · ${escapeHtml(event.venue)}</p>
      <p style="font-size: 14px;">
        Hi ${escapeHtml(attendeeName)}, your <strong>${escapeHtml(tierName)}</strong> ticket${safeTickets.length === 1 ? '' : 's'}
        ${safeTickets.length === 1 ? '' : `(× ${safeTickets.length})`}
        ${safeTickets.length === 1 ? 'is' : 'are'} confirmed. Total ₹${total}.
      </p>
      ${ticketsHtml}
      <p style="font-size: 12px; color: #777; margin-top: 20px;">
        Show the QR code at the entrance. The organiser will scan to check you in.
      </p>
    </div>
  `

  const attachments = safeTickets.map((t) => ({
    filename: `ticket-${t.ticketId}.png`,
    content: t.qrPng.toString('base64'),
    contentId: cidFor(t.ticketId),
  }))

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `Your ${safeTickets.length === 1 ? 'ticket' : `${safeTickets.length} tickets`} for ${event.title}`,
      html,
      attachments,
    })
    if (error) throw new Error(error.message || 'Resend rejected the email')
    return { messageId: data?.id || null, previewUrl: null }
  } catch (e) {
    throw new Error(e.message || 'Email send failed')
  }
}

function cidFor(ticketId) {
  return `qr-${ticketId}`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
