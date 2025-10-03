export default function RewardCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="card card-p">
      <div className="muted">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
