import { useEffect, useRef, useState } from 'react'

export default function VideoScan() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'idle'|'scanning'|'verified'|'mismatch'>('idle')

  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('scanning')
        setTimeout(() => {
          const mismatch = Math.random() < 0.2
          setStatus(mismatch ? 'mismatch' : 'verified')
        }, 3000)
      } catch {}
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
      <div className="card overflow-hidden">
        <video ref={videoRef} className="w-full max-h-[60vh] bg-black" playsInline muted />
      </div>

      <div className="card card-p">
        <div className="section-title mb-1">Basket Verification</div>
        <div className="text-lg font-semibold">
          {status === 'idle' && 'Initializing...'}
          {status === 'scanning' && 'Scanning in progress...'}
          {status === 'verified' && 'Basket Verified ✅'}
          {status === 'mismatch' && 'Warning: Potential Theft Detected ⚠️'}
        </div>
        {status === 'scanning' && <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full w-1/2 bg-brand-600 animate-pulse"/></div>}
      </div>
    </div>
  )
}
