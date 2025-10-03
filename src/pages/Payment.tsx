import PaymentMethodCard from '@/components/PaymentMethodCard'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'

export default function Payment() {
  const [method, setMethod] = useState('Saved Card')
  const navigate = useNavigate()
  const { basket, total, addActivity } = useAppStore()

  const subtotal = total()
  const discounts = Math.min(5, Math.round(subtotal * 0.05 * 100) / 100)
  const finalTotal = Math.max(0, subtotal - discounts)

  const payNow = () => {
    addActivity(`Paid $${finalTotal.toFixed(2)} via ${method}`)
    navigate('/receipt')
  }

  return (
    <div className="space-y-4">
      <div className="card card-p">
        <div className="section-title mb-2">Basket Summary</div>
        <div className="muted">Items: {basket.reduce((s, i) => s + i.qty, 0)} • Discounts: ${discounts.toFixed(2)} • Total: ${finalTotal.toFixed(2)}</div>
        <div className="mt-1 text-xs text-emerald-600">Eco-receipt incentive: +5 eco points for paperless billing</div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {['Saved Card', 'UPI / QR', 'Wallet'].map(m => (
          <PaymentMethodCard key={m} label={m} selected={method === m} onSelect={() => setMethod(m)} />
        ))}
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Split Payment</div>
        <div className="muted">Share a link with family to split bills (coming soon)</div>
      </div>

      <button onClick={payNow} className="w-full px-4 py-3 rounded-lg bg-brand-600 text-white font-semibold">Pay Now</button>
    </div>
  )
}
