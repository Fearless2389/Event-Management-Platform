import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import { connectDB } from './db.js'
import { initEmail } from './services/email.js'
import { userEmail } from './middleware/userEmail.js'
import eventsRouter from './routes/events.js'
import paymentsRouter from './routes/payments.js'
import ticketsRouter from './routes/tickets.js'

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: false }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))
app.use(userEmail)

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/events', eventsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/tickets', ticketsRouter)

app.use((err, req, res, _next) => {
  console.error('[error]', err)
  res.status(err.status || 500).json({ error: err.message || 'Server error' })
})

const port = Number(process.env.PORT) || 3001

async function main() {
  await connectDB()
  await initEmail()
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`)
  })
}

main().catch((e) => {
  console.error('Startup failed:', e)
  process.exit(1)
})
