import { useAppStore } from '@/store/useAppStore'

export default function RecentActivity() {
  const recent = useAppStore(s => s.recentActivity)
  return (
    <div className="card card-p">
      <div className="section-title mb-3">Recent Activity</div>
      <ul className="space-y-2 text-sm">
        {recent.length === 0 && <li className="muted">No activity yet.</li>}
        {recent.map((r, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500" />
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
