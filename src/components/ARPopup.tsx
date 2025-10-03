export default function ARPopup({ label }: { label: string }) {
  // Simple badge to mimic AR overlay
  return (
    <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full shadow">
      {label}
    </div>
  )
}
