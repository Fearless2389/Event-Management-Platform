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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Scan tickets</h1>
          <p className="text-sm opacity-60 mt-1">Validate entry at your event door.</p>
        </div>
        {!result && (
          <div className="flex bg-base-200 rounded-xl p-1 text-sm">
            <button
              className={`px-4 py-1.5 rounded-lg transition ${
                mode === 'camera' ? 'gradient-cta' : 'opacity-70'
              }`}
              onClick={() => setMode('camera')}
            >
              Camera
            </button>
            <button
              className={`px-4 py-1.5 rounded-lg transition ${
                mode === 'paste' ? 'gradient-cta' : 'opacity-70'
              }`}
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
        <div className="surface rounded-2xl p-5">
          <div className="scanner-frame mx-auto" style={{ maxWidth: 360 }}>
            <div id={REGION_ID} className="w-full" />
          </div>
          <p className="text-sm opacity-60 mt-4 text-center">
            Point at the QR code on the printable ticket or email.
          </p>
        </div>
      ) : (
        <form onSubmit={submitPasted} className="surface rounded-2xl p-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium mb-1.5 block">Ticket QR payload</span>
            <input
              className="input input-bordered w-full"
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="Paste the ticket ID from the QR"
            />
          </label>
          <button className="gradient-cta w-full py-3 rounded-xl font-semibold" type="submit">
            Check in
          </button>
        </form>
      )}

      {error && <div className="alert alert-error mt-4">{error}</div>}
    </div>
  )
}

function ResultCard({ result, onScanAnother }) {
  const accent =
    result.kind === 'ok'
      ? 'border-success/50 bg-success/5'
      : result.kind === 'already'
        ? 'border-warning/50 bg-warning/5'
        : 'border-error/50 bg-error/5'

  const icon = result.kind === 'ok' ? '✅' : result.kind === 'already' ? '⚠️' : '❌'
  const title =
    result.kind === 'ok'
      ? 'Check-in successful'
      : result.kind === 'already'
        ? 'Already checked in'
        : 'Check-in failed'

  return (
    <div className={`surface rounded-2xl p-7 text-center border-2 ${accent} animate-fade-up`}>
      <div className="text-6xl mb-3 animate-pop-in">{icon}</div>
      <h2 className="text-xl font-bold">{title}</h2>

      {result.kind === 'ok' && (
        <>
          <p className="text-base mt-3">
            <strong>{result.attendeeName}</strong> · {result.tierName}
          </p>
          <p className="text-xs opacity-60 mt-1">
            Checked in at {new Date().toLocaleString()}
          </p>
        </>
      )}

      {(result.kind === 'already' || result.kind === 'error') && (
        <p className="text-sm opacity-70 mt-3">{result.message}</p>
      )}

      <div className="mt-6 space-y-2">
        {result.jspCheckinUrl && (
          <a
            href={result.jspCheckinUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full py-2.5 rounded-xl border border-white/10 hover:border-white/30 hover:bg-white/5 transition text-sm"
          >
            Open JSP confirmation page
          </a>
        )}
        <button
          onClick={onScanAnother}
          className="gradient-cta w-full py-3 rounded-xl font-semibold"
        >
          Scan another
        </button>
      </div>
    </div>
  )
}
