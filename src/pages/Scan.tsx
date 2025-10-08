import { useState, useRef, useEffect } from 'react'
import { Camera, Barcode, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import ActionCard from '@/components/ActionCard'
import { lookupByBarcode, recognizeImage, saveScanToSupabase, updateCartInSupabase } from '@/services/scanService'

type ScanMode = 'barcode' | 'image' | null
type ScanResult = {
  product_name: string
  price: number
  quantity: number
  confidence: number
  size?: string
  product_id?: string
}

export default function Scan() {
  const [scanMode, setScanMode] = useState<ScanMode>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const addItem = useAppStore(s => s.addItem)
  const addActivity = useAppStore(s => s.addActivity)

  // Initialize camera for barcode scanning
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPermissionError(null)
    } catch (e: any) {
      setPermissionError(e?.message || 'Camera permission denied')
      console.error('Camera init failed', e)
    }
  }

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Simulate barcode scanning (in a real app, this would use a library like QuaggaJS or ZXing)
  const simulateBarcodeScan = () => {
    setIsScanning(true)
    
    // Simulate scanning with actual service
    lookupByBarcode('8901037XXXXXX').then((result: any) => {
      if (result) {
        handleScanSuccess(result)
      } else {
        setError('Product not found. Please try again.')
        setIsScanning(false)
      }
    })
  }

  // Handle file selection for image recognition
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      simulateImageRecognition(file)
    }
  }

  // Simulate image recognition (in a real app, this would send to backend)
  const simulateImageRecognition = (file: File) => {
    setIsScanning(true)
    
    // Process image with actual service
    recognizeImage(file).then((result: any) => {
      if (result) {
        handleScanSuccess(result)
      } else {
        setError('Item not recognized. Please try again.')
        setIsScanning(false)
      }
    })
  }

  // Handle successful scan
  const handleScanSuccess = (result: ScanResult) => {
    setScanResult(result)
    setIsScanning(false)
    
    // Add to basket
    addItem({
      id: result.product_name.toLowerCase().replace(/\s+/g, '-'),
      name: result.product_name,
      price: result.price,
      size: result.size
    }, result.quantity)
    
    // Add activity
    addActivity(`Added ${result.product_name} to basket`)
    
    // In a real implementation, we would send to backend:
    sendToBackend(result)
  }

  // Send data to backend (real implementation)
  const sendToBackend = async (result: ScanResult) => {
    try {
      // Generate a fallback product ID if not provided
      const productId = result.product_id || result.product_name?.toLowerCase().replace(/\s+/g, '-') || 'unknown-product';
      
      // Save to Supabase
      await saveScanToSupabase({
        user_id: 'demo-user',
        product_id: productId,
        confidence: result.confidence,
        qty: result.quantity,
        created_at: new Date().toISOString()
      })
      
      // Update cart in Supabase
      await updateCartInSupabase({
        user_id: 'demo-user',
        product_id: productId,
        qty: result.quantity,
        total_price: result.price * result.quantity
      })
      
      setError(null)
    } catch (err) {
      setError('Failed to save scan data. Please try again.')
      console.error('Supabase error:', err)
    }
  }

  // Reset scan state
  const resetScan = () => {
    setScanMode(null)
    setScanResult(null)
    setError(null)
    setIsScanning(false)
    stopCamera()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Scan Items</h1>
        <p className="muted">Add items to your basket by scanning barcodes or taking photos</p>
      </div>

      {!scanMode && !scanResult && (
        <div className="grid grid-cols-1 gap-4">
          <ActionCard 
            title="Scan Barcode" 
            desc="Use your camera to scan product barcodes" 
            icon={<Barcode className="w-5 h-5" />}
            onClick={() => {
              setScanMode('barcode')
              initCamera()
            }}
            color="from-blue-500 to-blue-700"
          />
          
          <ActionCard 
            title="Take Photo" 
            desc="Capture an image of the product for recognition" 
            icon={<Image className="w-5 h-5" />}
            onClick={() => {
              setScanMode('image')
              fileInputRef.current?.click()
            }}
            color="from-purple-500 to-purple-700"
          />
        </div>
      )}

      {scanMode === 'barcode' && (
        <div className="space-y-4">
          <div className="card overflow-hidden relative">
            <video 
              ref={videoRef} 
              className="w-full max-h-[60vh] bg-black" 
              playsInline 
              muted 
            />
            <div className="absolute inset-0 border-4 border-white/20 m-10 rounded-2xl pointer-events-none" />
            
            {isScanning && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Scanning...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={simulateBarcodeScan}
              disabled={isScanning}
              className="btn btn-secondary"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan Now
            </button>
            
            <button 
              onClick={resetScan}
              className="btn"
            >
              Cancel
            </button>
          </div>
          
          {permissionError && (
            <div className="card card-p text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {permissionError}
            </div>
          )}
        </div>
      )}

      {scanMode === 'image' && (
        <div className="space-y-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment"
            onChange={handleFileSelect}
          />
          
          {isScanning ? (
            <div className="card card-p py-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
              <p>Processing image...</p>
            </div>
          ) : (
            <div className="card card-p py-12 text-center">
              <Image className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="mb-4">Capture or select an image of the product</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn"
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </button>
            </div>
          )}
          
          <button 
            onClick={resetScan}
            className="btn w-full"
          >
            Back to Scan Options
          </button>
        </div>
      )}

      {scanResult && (
        <div className="space-y-4">
          <div className="card card-p text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Item Added!</h2>
            <p className="mt-2">
              <span className="font-semibold">{scanResult.product_name}</span> - ₹{scanResult.price}
              {scanResult.size && <span className="muted"> ({scanResult.size})</span>}
            </p>
            <p className="text-sm muted mt-1">
              Confidence: {(scanResult.confidence * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                setScanResult(null)
                if (scanMode === 'barcode') {
                  simulateBarcodeScan()
                } else {
                  fileInputRef.current?.click()
                }
              }}
              className="btn"
            >
              Scan Another
            </button>
            
            <button 
              onClick={resetScan}
              className="btn btn-secondary"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="card card-p text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}