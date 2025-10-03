import { ReactNode } from 'react'

export default function StatCard({ title, value, icon }: { title: string; value: string | number; icon?: ReactNode }) {
  return (
    <div className="card card-p flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-brand-600/10 text-brand-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="muted">{title}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
  )
}
