import { useState, useRef, useEffect } from 'react'
import { Camera, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Play, Pause, Volume2 } from 'lucide-react'
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
  const [isAutoCaptureActive, setIsAutoCaptureActive] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastImageURL, setLastImageURL] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
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

  // Toggle auto capture
  const toggleAutoCapture = () => {
    if (isAutoCaptureActive) {
      // Stop auto capture
      if (autoCaptureIntervalRef.current) {
        clearInterval(autoCaptureIntervalRef.current)
        autoCaptureIntervalRef.current = null
      }
      setIsAutoCaptureActive(false)
    } else {
      // Start auto capture every 3 seconds
      autoCaptureIntervalRef.current = setInterval(() => {
        handleScan()
      }, 3000)
      setIsAutoCaptureActive(true)
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
        
        // Voice feedback
        speak(`Detected ${data.product.name} with ${(data.confidence * 100).toFixed(0)}% confidence`)
      } else {
        setError(data.message || "Product not recognized, please try again.")
        speak("Product not recognized, please try again.")
      }
    } catch (err: any) {
      console.error('Scan error:', err)
      setError(err.message || "Failed to process image. Please try again.")
      speak("Failed to process image. Please try again.")
    } finally {
      setIsScanning(false)
    }
  }

  // Text-to-speech function
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      speechSynthesis.speak(utterance)
    }
  }

  // Handle successful scan
  const handleScanSuccess = (result: ScanResult) => {
    // Add to basket
    addItem({
      id: result.product_name.toLowerCase().replace(/\s+/g, '-'),
      name: result.product_name,
      price: result.price,
      size: result.category
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
  const sendFeedback = async (isCorrect: boolean, correctedProduct?: string) => {
    if (!lastImageURL || !scanResult) return
    
    try {
      // In a real implementation, send feedback to Supabase
      console.log('Sending feedback to Supabase:', {
        user_id: currentUser.id,
        image_url: lastImageURL,
        label: isCorrect ? scanResult.product_name : (correctedProduct || "incorrect"),
        user_feedback: isCorrect,
        added_at: new Date().toISOString()
      })
      
      // Show confirmation
      if (isCorrect) {
        speak('Thanks for confirming! This helps improve our AI.')
      } else {
        speak('Thanks for the feedback! We\'ll use this to improve our recognition.')
      }
      
      // Reset for next scan
      resetScan()
    } catch (err) {
      console.error('Feedback error:', err)
      speak('Failed to send feedback. Please try again.')
    }
  }

  // Reset scan state
  const resetScan = () => {
    setScanResult(null)
    setError(null)
    setIsScanning(false)
    setSelectedProduct('')
    // Clean up object URL
    if (lastImageURL) {
      URL.revokeObjectURL(lastImageURL)
      setLastImageURL(null)
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-500'
    if (confidence >= 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (autoCaptureIntervalRef.current) {
        clearInterval(autoCaptureIntervalRef.current)
      }
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
            
            {isAutoCaptureActive && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                AUTO
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleScan}
              disabled={isScanning}
              className="btn btn-secondary flex items-center justify-center"
            >
              <Camera className="w-4 h-4 mr-2" />
              Scan Product
            </button>
            
            <button 
              onClick={toggleAutoCapture}
              className={`btn flex items-center justify-center ${isAutoCaptureActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              {isAutoCaptureActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Auto
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Auto Capture
                </>
              )}
            </button>
          </div>
          
          <button 
            onClick={initCamera}
            className="btn w-full"
          >
            Reset Camera
          </button>
          
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
              <li>• Tap "Scan Product" or enable "Auto Capture"</li>
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
            <p className={`text-sm mt-1 font-bold ${getConfidenceColor(scanResult.confidence)}`}>
              Confidence: {(scanResult.confidence * 100).toFixed(0)}%
            </p>
          </div>
          
          <div className="card card-p">
            <h3 className="font-bold mb-2 flex items-center">
              <Volume2 className="w-4 h-4 mr-2" />
              Voice Feedback
            </h3>
            <p className="text-sm muted mb-3">
              Audio feedback is enabled for better accessibility
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
            
            {!scanResult && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Select Correct Product</label>
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Choose product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => sendFeedback(false, selectedProduct)}
                  className="btn btn-secondary mt-2 w-full"
                  disabled={!selectedProduct}
                >
                  Submit Correction
                </button>
              </div>
            )}
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