import { create } from 'zustand'

export type BasketItem = {
  id: string
  name: string
  price: number
  qty: number
  size?: string
  expiry?: string
  nutrition?: string
}

type User = {
  name: string
  email: string
  rewardPoints: number
  ecoPoints: number
}

type AppState = {
  user: User
  basket: BasketItem[]
  recentActivity: string[]
  addItem: (item: Omit<BasketItem, 'qty'>, qty?: number) => void
  updateQty: (id: string, delta: number) => void
  removeItem: (id: string) => void
  clearBasket: () => void
  addActivity: (msg: string) => void
  total: () => number
}

export const useAppStore = create<AppState>((set, get) => ({
  user: { name: 'Keerthana', email: 'keerthana@example.com', rewardPoints: 1200, ecoPoints: 340 },
  basket: [],
  recentActivity: [],
  addItem: (item, qty = 1) => set(state => {
    const existing = state.basket.find(b => b.id === item.id)
    if (existing) {
      return {
        basket: state.basket.map(b => b.id === item.id ? { ...b, qty: b.qty + qty } : b),
        recentActivity: [`Added ${qty} x ${item.name}`, ...state.recentActivity].slice(0, 10),
      }
    }
    return {
      basket: [{ ...item, qty }, ...state.basket],
      recentActivity: [`Added ${qty} x ${item.name}`, ...state.recentActivity].slice(0, 10),
    }
  }),
  updateQty: (id, delta) => set(state => ({
    basket: state.basket.map(b => b.id === id ? { ...b, qty: Math.max(0, b.qty + delta) } : b).filter(b => b.qty > 0),
  })),
  removeItem: (id) => set(state => ({
    basket: state.basket.filter(b => b.id !== id),
  })),
  clearBasket: () => set({ basket: [] }),
  addActivity: (msg) => set(state => ({ recentActivity: [msg, ...state.recentActivity].slice(0, 10) })),
  total: () => get().basket.reduce((sum, i) => sum + i.price * i.qty, 0),
}))
