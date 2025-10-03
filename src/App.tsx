import { Route, Routes, NavLink, useLocation } from 'react-router-dom'
import { Home, ScanLine, Gift, Settings as SettingsIcon, ShoppingCart } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import BarcodeScanner from './pages/BarcodeScanner'
import Basket from './pages/Basket'
import VideoScan from './pages/VideoScan'
import Rewards from './pages/Rewards'
import Payment from './pages/Payment'
import Receipt from './pages/Receipt'
import Settings from './pages/Settings'

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  return (
    <NavLink to={to} className={({ isActive }) => `flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isActive ? 'text-brand-600 bg-brand-600/10' : 'text-gray-600 dark:text-gray-300'}`}>
      <Icon className="w-5 h-5" />
      <span className="text-xs">{label}</span>
    </NavLink>
  )
}

export default function App() {
  const location = useLocation()
  const hideTabs = location.pathname.startsWith('/receipt')

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container-px py-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan" element={<BarcodeScanner />} />
          <Route path="/basket" element={<Basket />} />
          <Route path="/verify" element={<VideoScan />} />
          <Route path="/rewards" element={<Rewards />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/receipt" element={<Receipt />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>

      {!hideTabs && (
        <nav className="sticky bottom-0 inset-x-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 backdrop-blur">
          <div className="container-px py-2 grid grid-cols-5">
            <TabLink to="/" label="Home" icon={Home} />
            <TabLink to="/basket" label="Shop" icon={ShoppingCart} />
            <TabLink to="/scan" label="Scan" icon={ScanLine} />
            <TabLink to="/rewards" label="Rewards" icon={Gift} />
            <TabLink to="/settings" label="Settings" icon={SettingsIcon} />
          </div>
        </nav>
      )}
    </div>
  )
}
