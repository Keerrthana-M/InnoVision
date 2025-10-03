import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import ARPopup from '@/components/ARPopup'
import VoiceHint from '@/components/VoiceHint'

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const addItem = useAppStore(s => s.addItem)

  // Simulated scan for demo
  const simulateScan = () => {
    const item = { id: 'banana', name: 'Bananas', price: 0.99, size: '1kg', expiry: '3 days', nutrition: 'Rich in potassium' }
    addItem(item)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch (e: any) {
        setPermissionError(e?.message || 'Camera permission denied')
      }
    }
    init()
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(t => t.stop())
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden relative">
        <ARPopup label="Eco ♻️ A+" />
        <video ref={videoRef} className="w-full max-h-[60vh] bg-black" playsInline muted />
        <div className="absolute inset-0 border-4 border-white/20 m-10 rounded-2xl pointer-events-none" />
      </div>

      {permissionError && <div className="card card-p text-red-600">{permissionError}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card card-p">
          <div className="section-title mb-2">Product Details</div>
          <div className="muted">Scan a barcode to view details.</div>
        </div>
        <div className="card card-p flex items-center justify-between">
          <div>
            <div className="font-medium">Add to Basket</div>
            <VoiceHint />
          </div>
          <button onClick={simulateScan} className="px-4 py-2 rounded-lg bg-brand-600 text-white">Add Sample Item</button>
        </div>
      </div>
    </div>
  )
}
