import { useEffect, useState, type ChangeEvent } from 'react'

export default function Settings() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <div className="space-y-4">
      <div className="card card-p">
        <div className="section-title mb-2">Profile</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="card card-p" placeholder="Name" />
          <input className="card card-p" placeholder="Email" />
          <input className="card card-p" placeholder="Phone" />
        </div>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Payment Methods</div>
        <div className="muted">Manage saved cards and wallets (coming soon)</div>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Notifications</div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox"/> Email alerts</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox"/> Personalized offers</label>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Language</div>
        <select className="card card-p"><option>English</option><option>Español</option><option>हिन्दी</option></select>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Appearance</div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={dark} onChange={(e: ChangeEvent<HTMLInputElement>) => setDark(e.target.checked)} /> Dark Mode</label>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Privacy & Security</div>
        <div className="muted">Control permissions, data sharing and secure payments (coming soon)</div>
      </div>
    </div>
  )
}
