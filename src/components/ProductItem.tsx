import { BasketItem, useAppStore } from '@/store/useAppStore'
import { Trash2, Plus, Minus } from 'lucide-react'

export default function ProductItem({ item }: { item: BasketItem }) {
  const updateQty = useAppStore(s => s.updateQty)
  const removeItem = useAppStore(s => s.removeItem)

  return (
    <div className="card card-p flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="muted">{item.size} • ${item.price.toFixed(2)}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => updateQty(item.id, -1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-800"><Minus className="w-4 h-4"/></button>
        <div className="w-8 text-center">{item.qty}</div>
        <button onClick={() => updateQty(item.id, +1)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-800"><Plus className="w-4 h-4"/></button>
        <button onClick={() => removeItem(item.id)} className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-4 h-4"/></button>
      </div>
    </div>
  )
}
