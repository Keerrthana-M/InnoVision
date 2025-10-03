import { ShoppingBasket, Camera, Gift, Navigation } from 'lucide-react'
import ActionCard from '@/components/ActionCard'
import StatCard from '@/components/StatCard'
import RecentActivity from '@/components/RecentActivity'
import SmartOffers from '@/components/SmartOffers'
import BasketHealth from '@/components/BasketHealth'
import { useAppStore } from '@/store/useAppStore'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, basket } = useAppStore()
  const navigate = useNavigate()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <header className="card card-p">
          <h1 className="text-xl sm:text-2xl font-semibold">Hi {user.name} 👋, Ready to shop smarter today?</h1>
          <p className="muted">You have {basket.reduce((s, i) => s + i.qty, 0)} items in your basket.</p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          <ActionCard title="Shop Now" desc="Browse products" icon={<ShoppingBasket />} onClick={() => navigate('/basket')} />
          <ActionCard title="Scan Basket" desc="Verify items with 360° camera" icon={<Camera />} color="from-cyan-500 to-blue-600" onClick={() => navigate('/verify')} />
          <ActionCard title="Rewards" desc="Earn & Redeem" icon={<Gift />} color="from-amber-500 to-orange-600" onClick={() => navigate('/rewards')} />
          <ActionCard title="Navigate" desc="Find products in aisles" icon={<Navigation />} color="from-emerald-500 to-green-600" onClick={() => alert('In-store navigation coming soon')} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard title="Total Orders" value={42} />
          <StatCard title="Total Spent" value="$1,240" />
          <StatCard title="Eco Impact" value="+340 pts" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <RecentActivity />
          <SmartOffers />
        </div>

        <BasketHealth />
      </div>

      <aside className="space-y-4">
        <div className="card card-p">
          <div className="section-title mb-2">Profile</div>
          <div className="font-medium">{user.name}</div>
          <div className="muted">{user.email}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-brand-600/10 text-brand-700 dark:text-brand-300 p-3">
              <div className="text-xs">Reward Points</div>
              <div className="text-lg font-semibold">{user.rewardPoints}</div>
            </div>
            <div className="rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 p-3">
              <div className="text-xs">Eco Points</div>
              <div className="text-lg font-semibold">{user.ecoPoints}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
