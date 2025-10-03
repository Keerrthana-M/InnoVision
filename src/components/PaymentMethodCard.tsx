export default function PaymentMethodCard({ label, selected, onSelect }: { label: string; selected?: boolean; onSelect?: () => void }) {
  return (
    <button onClick={onSelect} className={`card card-p text-left ${selected ? 'ring-2 ring-brand-600' : ''}`}>
      <div className="font-medium">{label}</div>
      <div className="muted">Tap to select</div>
    </button>
  )
}
