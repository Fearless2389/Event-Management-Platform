import nodemailer from 'nodemailer'

let transporter = null

export async function initEmail() {
  let user = process.env.ETHEREAL_USER
  let pass = process.env.ETHEREAL_PASS

  if (!user || !pass) {
    const test = await nodemailer.createTestAccount()
    user = test.user
    pass = test.pass
    console.log('Generated Ethereal test account:', user)
    console.log('Pin these in .env to keep the same inbox between restarts:')
    console.log(`  ETHEREAL_USER=${user}`)
    console.log(`  ETHEREAL_PASS=${pass}`)
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user, pass },
  })
}

export async function sendTicketEmail({ to, attendeeName, event, tierName, price, ticketId, qrPng, jspTicketUrl }) {
  if (!transporter) throw new Error('Email transporter not initialised')

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="margin: 0 0 8px;">🎟️ Your ticket for ${escapeHtml(event.title)}</h2>
      <p style="margin: 0 0 16px; color: #555;">${new Date(event.dateTime).toLocaleString()} · ${escapeHtml(event.venue)}</p>
      <p>Hi ${escapeHtml(attendeeName)}, your <strong>${escapeHtml(tierName)}</strong> ticket (₹${price}) is confirmed.</p>
      <div style="text-align: center; margin: 16px 0;">
        <img src="cid:ticket-qr" alt="QR" style="width: 200px; height: 200px;" />
      </div>
      <p style="font-size: 12px; color: #777; text-align: center;">Ticket ID: ${ticketId}</p>
      <p style="text-align: center;">
        <a href="${jspTicketUrl}" style="display: inline-block; background: #570df8; color: #fff; text-decoration: none; padding: 8px 16px; border-radius: 4px;">
          Open printable ticket
        </a>
      </p>
    </div>
  `

  const info = await transporter.sendMail({
    from: '"EventHub" <noreply@eventhub.test>',
    to,
    subject: `Your ticket for ${event.title}`,
    html,
    attachments: [
      { filename: 'ticket-qr.png', content: qrPng, cid: 'ticket-qr' },
    ],
  })

  const previewUrl = nodemailer.getTestMessageUrl(info) || null
  return { messageId: info.messageId, previewUrl }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
