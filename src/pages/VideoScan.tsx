import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import VoiceHint from '../components/VoiceHint'

type ScanState = 'idle' | 'scanning' | 'completed'

type Detection = {
  id: string
  name: string
  qty: number
}

type OverlayBox = { x: number; y: number; w: number; h: number; label: string; status: 'match' | 'extra' | 'missing' }

function parseSizeToLiters(size?: string): number {
  if (!size) return 0.75 // fallback average volume in L
  const s = size.trim().toLowerCase()
  // handle like "1l", "750ml"
  const ml = s.match(/(\d+(?:\.\d+)?)\s*ml/)
  if (ml) return parseFloat(ml[1]) / 1000
  const l = s.match(/(\d+(?:\.\d+)?)\s*l/)
  if (l) return parseFloat(l[1])
  // rough fallback for weight-based sizes
  const g = s.match(/(\d+(?:\.\d+)?)\s*g/)
  if (g) return parseFloat(g[1]) / 1000 * 0.8 // assume density 0.8 kg/L
  const kg = s.match(/(\d+(?:\.\d+)?)\s*kg/)
  if (kg) return parseFloat(kg[1]) * 0.8
  return 0.75
}

function toCSV(rows: Record<string, string | number>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
  }
  return lines.join('\n')
}

export default function VideoScan() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<ScanState>('idle')
  const [progress, setProgress] = useState(0)
  const [overlays, setOverlays] = useState<OverlayBox[]>([])
  const [detected, setDetected] = useState<Detection[]>([])
  const [reportOpen, setReportOpen] = useState(false)
  const [userFeedback, setUserFeedback] = useState<Record<string, 'yes' | 'no' | undefined>>({})

  type StoreState = ReturnType<typeof useAppStore.getState>
  const basket = useAppStore((s: StoreState) => s.basket)
  const addActivity = useAppStore((s: StoreState) => s.addActivity)

  const checklist = useMemo(
    () =>
      basket.map((b: { id: string; name: string; qty: number; size?: string }) => ({
        id: b.id,
        name: b.name,
        qty: b.qty,
        size: b.size,
      })),
    [basket]
  )

  const basketVolumeL = useMemo(
    () => checklist.reduce((sum: number, i: { size?: string; qty: number }) => sum + parseSizeToLiters(i.size) * i.qty, 0),
    [checklist]
  )
  const basketCapacityL = 40 // typical trolley ~100L, basket ~30-40L; choose 40L
  const basketFillPct = Math.min(100, Math.round((basketVolumeL / basketCapacityL) * 100))

  useEffect(() => {
    // create pulsing progress while scanning
    if (state !== 'scanning') return
    let p = 0
    const id = setInterval(() => {
      p = Math.min(100, p + Math.random() * 18)
      setProgress(Math.round(p))
      // add playful overlay boxes randomly
      setOverlays((prev: OverlayBox[]) => {
        if (prev.length > 6) return prev
        const box: OverlayBox = {
          x: Math.random() * 70 + 5,
          y: Math.random() * 50 + 5,
          w: Math.random() * 20 + 10,
          h: Math.random() * 15 + 8,
          label: Math.random() < 0.7 ? 'Item' : 'Unknown',
          status: 'match',
        }
        return Math.random() < 0.4 ? [...prev, box] : prev
      })
      if (p >= 100) {
        clearInterval(id)
        // simulate detection result
        const simulated = simulateDetections(checklist)
        setDetected(simulated)
        setState('completed')
        setReportOpen(true)
        addActivity('Completed basket video scan')
      }
    }, 400)
    return () => clearInterval(id)
  }, [state, checklist, addActivity])

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setProgress(0)
      setOverlays([])
      setDetected([])
      setUserFeedback({})
      setState('scanning')
    } catch (e) {
      console.error('Camera init failed', e)
    }
  }

  const stopScan = () => {
    if (videoRef.current) videoRef.current.pause()
    streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop())
    streamRef.current = null
    if (state === 'scanning') {
      // finalize early with a result
      const simulated = simulateDetections(checklist)
      setDetected(simulated)
      setState('completed')
      setReportOpen(true)
      addActivity('Stopped basket video scan')
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop())
    }
  }, [])

  const { matched, missing, extra } = useMemo(() => reconcile(checklist, detected), [checklist, detected])

  const downloadCSV = () => {
    const rows = [
      ...matched.map((m: { id: string; name: string; qty: number }) => ({ type: 'Matched', id: m.id, name: m.name, qty: m.qty })),
      ...missing.map((m: { id: string; name: string; qty: number }) => ({ type: 'Missing', id: m.id, name: m.name, qty: m.qty })),
      ...extra.map((e: { id: string; name: string; qty: number }) => ({ type: 'Extra', id: e.id, name: e.name, qty: e.qty })),
    ]
    const csv = toCSV(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'basket-scan-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalDetected = detected.reduce((s: number, d: Detection) => s + d.qty, 0)
  const totalExpected = checklist.reduce((s: number, d: { qty: number }) => s + d.qty, 0)
  const matchCount = matched.reduce((s: number, m: { qty: number }) => s + m.qty, 0)

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden relative">
        <video ref={videoRef} className="w-full max-h-[60vh] bg-black" playsInline muted />
        {/* AR Overlays */}
        {state !== 'idle' && (
          <div className="absolute inset-0 pointer-events-none">
            {overlays.map((b, i) => (
              <div
                key={i}
                className={`absolute border ${b.status === 'extra' ? 'border-orange-500' : 'border-emerald-500'} rounded`}
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <span className="absolute -top-5 left-0 text-xs px-1 rounded bg-black/60 text-white">{b.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card card-p space-y-3">
          <div className="section-title">Scanner</div>
          <div className="flex gap-2">
            <button onClick={startScan} disabled={state === 'scanning'} className={`btn ${state === 'scanning' ? 'opacity-50 cursor-not-allowed' : ''}`}>Start Scan</button>
            <button onClick={stopScan} className="btn btn-secondary">Stop Scan</button>
          </div>
          {state === 'scanning' && (
            <div>
              <div className="text-sm font-medium mb-1">Basket Scan: {progress}% complete 🚀</div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Keep moving slowly… great job! 🎉</div>
            </div>
          )}
          {state === 'completed' && (
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Scan finished. {matchCount}/{totalExpected} items matched.</div>
          )}
          <VoiceHint text={state === 'scanning' ? 'Please move the camera slowly around your basket.' : 'Ready to check your basket? 🎥 Let’s start!'} />
        </div>

        <div className="card card-p space-y-3">
          <div className="section-title">Checklist</div>
          <ul className="space-y-2 max-h-56 overflow-auto">
            {checklist.map(i => (
              <li key={i.id} className="flex items-center justify-between">
                <span className="truncate">{i.name} <span className="muted">×{i.qty}</span></span>
                <span className="text-xs muted">{i.size ?? '—'}</span>
              </li>
            ))}
            {!checklist.length && <li className="muted">No items yet. Add via barcode scan.</li>}
          </ul>
          <div className="section-title">Basket Size Estimator</div>
          <div className="text-sm">Total volume used: {basketVolumeL.toFixed(1)}L / {basketCapacityL}L</div>
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${basketFillPct > 90 ? 'bg-red-500' : 'bg-brand-600'}`} style={{ width: `${basketFillPct}%` }} />
          </div>
          <div className="text-xs muted">Basket {basketFillPct}% filled</div>
        </div>
      </div>

      <div className="card card-p space-y-3">
        <div className="section-title">Mismatch & Fraud Alerts</div>
        {state === 'scanning' && <div className="muted">Analyzing…</div>}
        {state === 'completed' && (
          <div className="space-y-2">
            {missing.length > 0 && (
              <div className="text-amber-600 dark:text-amber-400">❌ Missing: {missing.map(m => `${m.name} ×${m.qty}`).join(', ')}</div>
            )}
            {extra.length > 0 && (
              <div className="text-orange-600 dark:text-orange-400">⚠️ Extra/Unknown: {extra.map(e => `${e.name} ×${e.qty}`).join(', ')}</div>
            )}
            {missing.length === 0 && extra.length === 0 && (
              <div className="text-emerald-600 dark:text-emerald-400">✅ All items matched.</div>
            )}
          </div>
        )}
      </div>

      {reportOpen && (
        <div className="card card-p space-y-3">
          <div className="section-title">Summary Report</div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="font-semibold">Matched Items</div>
              <ul className="list-disc list-inside">
                {matched.map(m => <li key={m.id}>{m.name} ×{m.qty}</li>)}
                {!matched.length && <li className="muted">None</li>}
              </ul>
            </div>
            <div>
              <div className="font-semibold">Missing Items</div>
              <ul className="list-disc list-inside">
                {missing.map(m => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>{m.name} ×{m.qty}</span>
                    <span className="text-xs">
                      Is this correct? 
                      <button className={`ml-2 underline ${userFeedback[m.id] === 'yes' ? 'text-emerald-600' : ''}`} onClick={() => setUserFeedback(f => ({ ...f, [m.id]: 'yes' }))}>Yes</button>
                      <button className={`ml-2 underline ${userFeedback[m.id] === 'no' ? 'text-red-600' : ''}`} onClick={() => setUserFeedback(f => ({ ...f, [m.id]: 'no' }))}>No</button>
                    </span>
                  </li>
                ))}
                {!missing.length && <li className="muted">None</li>}
              </ul>
            </div>
            <div>
              <div className="font-semibold">Extra/Unknown Items</div>
              <ul className="list-disc list-inside">
                {extra.map(e => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span>{e.name} ×{e.qty}</span>
                    <span className="text-xs">
                      Is this correct? 
                      <button className={`ml-2 underline ${userFeedback[e.id] === 'yes' ? 'text-emerald-600' : ''}`} onClick={() => setUserFeedback(f => ({ ...f, [e.id]: 'yes' }))}>Yes</button>
                      <button className={`ml-2 underline ${userFeedback[e.id] === 'no' ? 'text-red-600' : ''}`} onClick={() => setUserFeedback(f => ({ ...f, [e.id]: 'no' }))}>No</button>
                    </span>
                  </li>
                ))}
                {!extra.length && <li className="muted">None</li>}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={downloadCSV}>Save Report (CSV)</button>
            <button className="btn btn-secondary" onClick={() => { setReportOpen(false); addActivity('Confirmed scan report') }}>Confirm & Save Report</button>
          </div>
          <div className="muted">Eco insights and health score coming soon 🌍🥗</div>
        </div>
      )}
    </div>
  )
}

function simulateDetections(checklist: { id: string; name: string; qty: number }[]): Detection[] {
  // Create a noisy version of checklist: randomly miss 0-1 items and add 0-1 extras
  const detections: Detection[] = []
  for (const item of checklist) {
    const miss = Math.random() < 0.2
    const qty = Math.max(0, item.qty - (miss ? 1 : 0))
    if (qty > 0) detections.push({ id: item.id, name: item.name, qty })
  }
  if (Math.random() < 0.35) {
    detections.push({ id: 'extra-' + Math.random().toString(36).slice(2, 6), name: 'Unknown Item', qty: 1 })
  }
  return detections
}

function reconcile(checklist: { id: string; name: string; qty: number }[], detected: Detection[]) {
  const mapDetected = new Map<string, number>()
  for (const d of detected) mapDetected.set(d.id, (mapDetected.get(d.id) ?? 0) + d.qty)
  const matched: { id: string; name: string; qty: number }[] = []
  const missing: { id: string; name: string; qty: number }[] = []
  const extra: { id: string; name: string; qty: number }[] = []
  for (const c of checklist) {
    const detQty = mapDetected.get(c.id) ?? 0
    if (detQty > 0) matched.push({ id: c.id, name: c.name, qty: Math.min(c.qty, detQty) })
    if (detQty < c.qty) missing.push({ id: c.id, name: c.name, qty: c.qty - detQty })
  }
  for (const d of detected) {
    if (!checklist.find(c => c.id === d.id)) extra.push({ id: d.id, name: d.name, qty: d.qty })
  }
  return { matched, missing, extra }
}
