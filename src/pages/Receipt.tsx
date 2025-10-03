import { useAppStore } from '@/store/useAppStore'

export default function Receipt() {
  const { basket, total } = useAppStore()
  const subtotal = total()
  const discounts = Math.min(5, Math.round(subtotal * 0.05 * 100) / 100)
  const finalTotal = Math.max(0, subtotal - discounts)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card card-p text-center">
        <div className="text-2xl font-bold">Seamless Shopping</div>
        <div className="muted">Digital Receipt</div>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Items</div>
        <ul className="text-sm space-y-1">
          {basket.map(i => (
            <li key={i.id} className="flex justify-between"><span>{i.name} x{i.qty}</span><span>${(i.price * i.qty).toFixed(2)}</span></li>
          ))}
        </ul>
        <div className="mt-3 border-t pt-2">
          <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-emerald-600"><span>Discounts</span><span>-${discounts.toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold"><span>Paid</span><span>${finalTotal.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <button className="card card-p">Download PDF</button>
        <button className="card card-p">Share</button>
        <button className="card card-p">Reorder Basket</button>
      </div>

      <div className="card card-p text-sm text-emerald-700 dark:text-emerald-300">Carbon Savings: You saved 15g CO₂ by using an eco bag 🌱</div>
    </div>
  )
}
