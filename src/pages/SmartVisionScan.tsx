import { useState, useRef, useEffect } from 'react'
import { Camera, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, Play, Pause, Volume2, Loader, X, ShoppingCart } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

type DetectionResult = {
  status: string
  product_name?: string
  price?: number
  confidence?: number
  message?: string
}

export default function SmartVisionScan() {
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isAutoCaptureActive, setIsAutoCaptureActive] = useState(false)
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastImageURL, setLastImageURL] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [showAddToTraining, setShowAddToTraining] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const addItem = useAppStore(s => s.addItem)
  const addActivity = useAppStore(s => s.addActivity)
  const currentUser = { id: 'demo-user' } // In a real app, get from auth context

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000'

  // Capture image from live video feed (resized to 640x480)
  const captureImage = async (): Promise<string> => {
    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video reference not found");

      // Ensure video frame is ready
      if (video.readyState < 2) throw new Error("Video not ready");

      // Create canvas and resize to 640x480
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Draw resized image
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg");
    } catch (err) {
      console.error("Image capture error:", err);
      throw new Error("Failed to capture image");
    }
  };

  // Initialize camera for visual scanning
  const initCamera = async () => {
    try {
      // Stop any existing stream
      stopCamera()
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
      setPermissionError(null)
    } catch (e: any) {
      setPermissionError(e?.message || 'Camera permission denied')
      setCameraActive(false)
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
    setCameraActive(false)
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
      setIsAutoCaptureActive(true)
    }
  }

  // Handle scan action
  const handleScan = async () => {
    // Detection is disabled during ML reset; keep UI responsive
    try {
      setError(null)
      setLoading(true)
      setDetectionResult(null)
      await captureImage() // still capture for UX validation
      const msg = 'AI vision detection is temporarily disabled during reset.'
      setError(msg)
      speak(msg)
    } catch (error: any) {
      console.error('Scan error:', error)
      setError(error.message || 'Failed to capture image')
    } finally {
      setLoading(false)
    }
  }

  // Add new item to training
  const addToTraining = async () => {
    const msg = 'Training endpoint is disabled during ML reset.'
    setError(msg)
    speak(msg)
  }

  // Confirm and add to cart
  const confirmAddToCart = () => {
    if (!detectionResult || detectionResult.status !== "success" || !detectionResult.product_name || detectionResult.price === undefined) {
      return
{{ ... }}
    }
    
    // Add to basket
    addItem({
      id: detectionResult.product_name.toLowerCase().replace(/\s+/g, '-'),
      name: detectionResult.product_name,
      price: detectionResult.price,
      size: '' // In a real implementation, you might get this from the API
    }, 1)
    
    // Add activity
    addActivity(`Added ${detectionResult.product_name} to basket`)
    
    // Voice feedback
    speak(`${detectionResult.product_name} added to cart`)
    
    // Reset for next scan
    resetScan()
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

  // Reset scan state
  const resetScan = () => {
    setDetectionResult(null)
    setError(null)
    setIsScanning(false)
    setNewLabel('')
    setShowAddToTraining(false)
    // Clean up object URL
    if (lastImageURL) {
      // For data URLs, no need to revoke
      setLastImageURL(null)
    }
  }

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-500'
    if (confidence >= 0.7) return 'text-yellow-500'
    return 'text-red-500'
  }

  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High'
    if (confidence >= 0.7) return 'Medium'
    return 'Low'
  }

  // Auto capture effect
  useEffect(() => {
    if (isAutoCaptureActive) {
      const interval = setInterval(() => handleScan(), 3000);
      return () => clearInterval(interval);
    }
  }, [isAutoCaptureActive]);

  // Start camera on mount
  useEffect(() => {
    initCamera()
    
    // Cleanup on unmount
    return () => {
      stopCamera()
      if (autoCaptureIntervalRef.current) {
        clearInterval(autoCaptureIntervalRef.current)
      }
      if (lastImageURL) {
        // For data URLs, no need to revoke
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Smart Vision Scan</h1>
        <p className="muted">Point your camera at a product to automatically recognize it</p>
      </div>

      {/* Camera View */}
      <div className="space-y-4">
        <div className="card overflow-hidden relative">
          <video 
            ref={videoRef} 
            className="w-full max-h-[60vh] bg-black" 
            playsInline 
            muted 
            autoPlay
          />
          <div className="absolute inset-0 border-4 border-white/20 m-10 rounded-2xl pointer-events-none" />
          
          {loading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <Loader className="w-12 h-12 animate-spin mx-auto mb-2" />
                <p>Detecting product...</p>
              </div>
            </div>
          )}
          
          {isAutoCaptureActive && (
            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              AUTO
            </div>
          )}
        </div>
        
        {/* Detection Result Display */}
        {detectionResult?.status === 'success' && detectionResult.product_name && detectionResult.price !== undefined && (
          <div className="card card-p text-center py-4">
            <h3 className="text-xl font-bold">{detectionResult.product_name}</h3>
            <p className="text-lg font-semibold mt-1">₹{detectionResult.price.toFixed(2)}</p>
            <div className="mt-2">
              <span className={`text-sm font-bold ${getConfidenceColor(detectionResult.confidence || 0)}`}>
                Confidence: {((detectionResult.confidence || 0) * 100).toFixed(1)}% ({getConfidenceLabel(detectionResult.confidence || 0)})
              </span>
            </div>
            <button 
              onClick={confirmAddToCart}
              className="btn bg-emerald-500 hover:bg-emerald-600 text-white mt-4 flex items-center justify-center mx-auto"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </button>
          </div>
        )}
        
        {/* Unknown Item Display */}
        {detectionResult?.status === 'unknown_item' && showAddToTraining && (
          <div className="card card-p text-center py-4">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400">Unknown Item</h3>
            <p className="mt-2">
              This item is not in our database. Help us learn by adding it to training.
            </p>
            <div className="mt-4">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Enter product name (e.g., Lays Chips)"
                className="w-full p-2 border rounded mb-3"
              />
              <button 
                onClick={addToTraining}
                disabled={loading || !newLabel}
                className="btn bg-blue-500 hover:bg-blue-600 text-white w-full"
              >
                {loading ? 'Adding...' : 'Add to Training'}
              </button>
            </div>
            <button 
              onClick={resetScan}
              className="btn btn-secondary mt-3 w-full"
            >
              Cancel
            </button>
          </div>
        )}
        
        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleScan}
            disabled={loading || !cameraActive}
            className="btn btn-secondary flex items-center justify-center"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Product
          </button>
          
          <button 
            onClick={toggleAutoCapture}
            disabled={loading || !cameraActive}
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
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={initCamera}
            disabled={loading}
            className="btn w-full"
          >
            Reset Camera
          </button>
          
          <button 
            onClick={stopCamera}
            disabled={loading || !cameraActive}
            className="btn bg-red-500 hover:bg-red-600 text-white w-full flex items-center justify-center"
          >
            <X className="w-4 h-4 mr-2" />
            Close Camera
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
            <li>• Tap "Scan Product" or enable "Auto Capture"</li>
            <li>• Our AI will identify the product</li>
            <li>• Confirm if the detection is correct to help improve accuracy</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="card card-p text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}