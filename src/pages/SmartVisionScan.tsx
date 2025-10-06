import { useState, useRef, useEffect } from 'react'
import { Camera, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import ActionCard from '@/components/ActionCard'

type ScanResult = {
  product_name: string
  price: number
  quantity: number
  confidence: number
  category?: string
  product_id?: string
}

export default function SmartVisionScan() {
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastImageURL, setLastImageURL] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const addItem = useAppStore(s => s.addItem)
  const addActivity = useAppStore(s => s.addActivity)
  const currentUser = { id: 'demo-user' } // In a real app, get from auth context

  // Initialize camera for visual scanning
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

  // Handle scan action
  const handleScan = async () => {
    if (!videoRef.current) return
    
    setIsScanning(true)
    setError(null)
    
    try {
      const video = videoRef.current
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob(resolve, "image/jpeg")
      )
      
      if (!blob) {
        throw new Error("Failed to capture image")
      }
      
      const formData = new FormData()
      formData.append("file", blob)
      formData.append("user_id", currentUser.id)

      // In a real implementation, this would point to your FastAPI backend
      const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}/detect-vision`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()
      
      if (data.status === "success") {
        // Create a temporary URL for the captured image
        const imageURL = URL.createObjectURL(blob)
        setLastImageURL(imageURL)
        
        const result = {
          product_name: data.product.name,
          price: data.product.price,
          quantity: 1,
          confidence: data.confidence,
          category: data.product.category,
          product_id: data.product.id || data.product.name.toLowerCase().replace(/\s+/g, '-')
        }
        
        setScanResult(result)
        handleScanSuccess(result)
      } else {
        setError(data.message || "Product not recognized, please try again.")
      }
    } catch (err: any) {
      console.error('Scan error:', err)
      setError(err.message || "Failed to process image. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  // Handle successful scan
  const handleScanSuccess = (result: ScanResult) => {
    // Add to basket
    addItem({
      id: result.product_name.toLowerCase().replace(/\s+/g, '-'),
      name: result.product_name,
      price: result.price,
      category: result.category
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
      const productId = result.product_id || result.product_name?.toLowerCase().replace(/\s+/g, '-') || 'unknown-product'
      
      // In a real implementation, save to Supabase
      console.log('Saving scan data to Supabase:', {
        user_id: currentUser.id,
        product_id: productId,
        confidence: result.confidence,
        qty: result.quantity,
        created_at: new Date().toISOString()
      })
      
      // Update cart in Supabase
      console.log('Updating cart in Supabase:', {
        user_id: currentUser.id,
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

  // Send feedback to backend for retraining
  const sendFeedback = async (isCorrect: boolean) => {
    if (!lastImageURL || !scanResult) return
    
    try {
      // In a real implementation, send feedback to Supabase
      console.log('Sending feedback to Supabase:', {
        user_id: currentUser.id,
        image_url: lastImageURL,
        label: isCorrect ? scanResult.product_name : "incorrect",
        user_feedback: isCorrect,
        added_at: new Date().toISOString()
      })
      
      // Show confirmation
      alert(isCorrect ? '✅ Thanks for confirming! This helps improve our AI.' : '❌ Thanks for the feedback! We\'ll use this to improve our recognition.')
      
      // Reset for next scan
      resetScan()
    } catch (err) {
      console.error('Feedback error:', err)
      alert('Failed to send feedback. Please try again.')
    }
  }

  // Reset scan state
  const resetScan = () => {
    setScanResult(null)
    setError(null)
    setIsScanning(false)
    // Clean up object URL
    if (lastImageURL) {
      URL.revokeObjectURL(lastImageURL)
      setLastImageURL(null)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (lastImageURL) {
        URL.revokeObjectURL(lastImageURL)
      }
    }
  }, [lastImageURL])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Smart Vision Scan</h1>
        <p className="muted">Point your camera at a product to automatically recognize it</p>
      </div>

      {!scanResult && (
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
                  <p>Analyzing image...</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="btn btn-secondary"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan Product
            </button>
            
            <button 
              onClick={initCamera}
              className="btn"
            >
              Reset Camera
            </button>
          </div>
          
          {permissionError && (
            <div className="card card-p text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 inline mr-2" />
              {permissionError}
            </div>
          )}
          
          <div className="card card-p">
            <h3 className="font-bold mb-2">How it works</h3>
            <ul className="text-sm space-y-1 muted">
              <li>• Point your camera at a product</li>
              <li>• Tap "Scan Product" to capture and analyze</li>
              <li>• Our AI will identify the product</li>
              <li>• Confirm if the detection is correct to help improve accuracy</li>
            </ul>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="space-y-4">
          <div className="card card-p text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Item Detected!</h2>
            <p className="mt-2">
              <span className="font-semibold">{scanResult.product_name}</span> - ₹{scanResult.price}
              {scanResult.category && <span className="muted"> ({scanResult.category})</span>}
            </p>
            <p className="text-sm muted mt-1">
              Confidence: {(scanResult.confidence * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="card card-p">
            <h3 className="font-bold mb-2">Is this correct?</h3>
            <p className="text-sm muted mb-3">
              Help improve our AI by confirming if this detection is accurate
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => sendFeedback(true)}
                className="btn bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Yes, Correct
              </button>
              
              <button 
                onClick={() => sendFeedback(false)}
                className="btn bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                No, Incorrect
              </button>
            </div>
          </div>
          
          <button 
            onClick={resetScan}
            className="btn w-full"
          >
            Scan Another Item
          </button>
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