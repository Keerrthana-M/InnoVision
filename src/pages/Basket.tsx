import { useAppStore } from '@/store/useAppStore'
import ProductItem from '@/components/ProductItem'
import { useNavigate } from 'react-router-dom'

export default function Basket() {
  const { basket, total } = useAppStore()
  const navigate = useNavigate()

  const subtotal = total()
  const discounts = Math.min(5, Math.round(subtotal * 0.05 * 100) / 100)
  const finalTotal = Math.max(0, subtotal - discounts)

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {basket.length === 0 && <div className="card card-p">Your basket is empty. Scan items to begin.</div>}
        {basket.map(item => (
          <ProductItem key={item.id} item={item} />
        ))}
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Summary</div>
        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between text-emerald-600"><span>Discounts</span><span>-₹{discounts.toFixed(2)}</span></div>
        <div className="flex justify-between font-semibold mt-2"><span>Total</span><span>₹{finalTotal.toFixed(2)}</span></div>
        <div className="muted mt-1">Est. volume: {(basket.reduce((s, i) => s + i.qty * 0.7, 0)).toFixed(1)} L</div>
        <button onClick={() => navigate('/payment')} className="mt-4 w-full px-4 py-2 rounded-lg bg-brand-600 text-white">Checkout</button>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Smart Discounts</div>
        <div className="muted">Add 1 more juice for 20% off.</div>
      </div>
    </div>
  )
}
