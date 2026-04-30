import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../lib/api'

const REGION_ID = 'qr-region'

export default function Scan() {
  const { eventId } = useParams()
  const scannerRef = useRef(null)
  const busyRef = useRef(false)
  const [mode, setMode] = useState('camera')
  const [pasted, setPasted] = useState('')
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (mode !== 'camera') return
    let cancelled = false
    const scanner = new Html5Qrcode(REGION_ID, { verbose: false })
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((cams) => {
        if (cancelled || cams.length === 0) {
          if (cams.length === 0) setError('No webcam detected. Use paste mode.')
          return
        }
        return scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          handleDecode,
          () => {},
        )
      })
      .catch((e) => setError(e.message || 'Failed to start scanner'))

    return () => {
      cancelled = true
      if (scanner.isScanning) scanner.stop().catch(() => {}).finally(() => scanner.clear())
      else scanner.clear()
    }
  }, [mode])

  async function handleDecode(text) {
    if (busyRef.current) return
    busyRef.current = true
    setStatus('checking')
    setError(null)
    try {
      const res = await api.checkin(text, eventId)
      setStatus('ok')
      window.open(res.jspCheckinUrl, '_blank')
    } catch (e) {
      setError(e.message)
      setStatus(null)
    } finally {
      setTimeout(() => {
        busyRef.current = false
        setStatus(null)
      }, 2000)
    }
  }

  async function submitPasted(e) {
    e.preventDefault()
    if (!pasted) return
    await handleDecode(pasted.trim())
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Scan tickets</h1>
        <div className="join">
          <button
            className={`btn btn-sm join-item ${mode === 'camera' ? 'btn-primary' : ''}`}
            onClick={() => setMode('camera')}
          >
            Camera
          </button>
          <button
            className={`btn btn-sm join-item ${mode === 'paste' ? 'btn-primary' : ''}`}
            onClick={() => setMode('paste')}
          >
            Paste code
          </button>
        </div>
      </div>

      {mode === 'camera' ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body items-center">
            <div id={REGION_ID} className="w-full max-w-sm" />
            <p className="text-sm opacity-60 mt-2">
              Point at the QR code on the printable ticket or email.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submitPasted} className="card bg-base-100 shadow">
          <div className="card-body gap-3">
            <label className="form-control">
              <span className="label-text mb-1">Ticket QR payload</span>
              <input
                className="input input-bordered"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Paste the ticket ID from the QR"
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Check in
            </button>
          </div>
        </form>
      )}

      {status === 'checking' && (
        <div className="alert alert-info mt-4">Verifying ticket…</div>
      )}
      {status === 'ok' && (
        <div className="alert alert-success mt-4">
          ✓ Checked in. Confirmation page opened.
        </div>
      )}
      {error && <div className="alert alert-error mt-4">{error}</div>}
    </div>
  )
}
