import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { api } from '../lib/api'

const REGION_ID = 'qr-region'

export default function Scan() {
  const { eventId } = useParams()
  const scannerRef = useRef(null)
  const lockedRef = useRef(false)
  const [mode, setMode] = useState('camera')
  const [pasted, setPasted] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [scannerKey, setScannerKey] = useState(0)

  useEffect(() => {
    if (mode !== 'camera' || result) return
    let cancelled = false
    let scanner

    const start = async () => {
      try {
        scanner = new Html5Qrcode(REGION_ID, { verbose: false })
        scannerRef.current = scanner
        const cams = await Html5Qrcode.getCameras()
        if (cancelled) return
        if (!cams || cams.length === 0) {
          setError('No webcam detected. Switch to Paste mode.')
          return
        }
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          handleDecode,
          () => {},
        )
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to start scanner')
      }
    }

    start()

    return () => {
      cancelled = true
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {}).finally(() => scanner.clear())
      } else if (scanner) {
        scanner.clear()
      }
    }
  }, [mode, scannerKey, result])

  async function stopScanner() {
    const scanner = scannerRef.current
    if (scanner && scanner.isScanning) {
      try {
        await scanner.stop()
      } catch {}
    }
  }

  async function handleDecode(text) {
    if (lockedRef.current) return
    lockedRef.current = true
    await stopScanner()
    setError(null)
    try {
      const res = await api.checkin(text.trim(), eventId)
      setResult({ kind: 'ok', ...res })
    } catch (e) {
      const message = e.message || 'Check-in failed'
      const alreadyChecked = /already checked in/i.test(message)
      setResult({ kind: alreadyChecked ? 'already' : 'error', message })
    }
  }

  function scanAnother() {
    lockedRef.current = false
    setResult(null)
    setError(null)
    setPasted('')
    setScannerKey((k) => k + 1)
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
        {!result && (
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
        )}
      </div>

      {result ? (
        <ResultCard result={result} onScanAnother={scanAnother} />
      ) : mode === 'camera' ? (
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

      {error && <div className="alert alert-error mt-4">{error}</div>}
    </div>
  )
}

function ResultCard({ result, onScanAnother }) {
  const tone =
    result.kind === 'ok' ? 'border-success' : result.kind === 'already' ? 'border-warning' : 'border-error'
  const icon = result.kind === 'ok' ? '✅' : result.kind === 'already' ? '⚠️' : '❌'
  const title =
    result.kind === 'ok' ? 'Check-in successful' : result.kind === 'already' ? 'Already checked in' : 'Check-in failed'

  return (
    <div className={`card bg-base-100 shadow border-t-4 ${tone}`}>
      <div className="card-body items-center text-center">
        <div className="text-5xl">{icon}</div>
        <h2 className="card-title">{title}</h2>

        {result.kind === 'ok' && (
          <>
            <p className="text-base">
              <strong>{result.attendeeName}</strong> · {result.tierName}
            </p>
            <p className="text-xs opacity-60">Checked in at {new Date().toLocaleString()}</p>
          </>
        )}

        {result.kind === 'already' && (
          <p className="text-sm opacity-70">{result.message}</p>
        )}

        {result.kind === 'error' && (
          <p className="text-sm opacity-70">{result.message}</p>
        )}

        <div className="card-actions w-full flex-col gap-2 mt-4">
          {result.jspCheckinUrl && (
            <a
              href={result.jspCheckinUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline btn-sm w-full"
            >
              Open JSP confirmation page
            </a>
          )}
          <button onClick={onScanAnother} className="btn btn-primary w-full">
            Scan another
          </button>
        </div>
      </div>
    </div>
  )
}
