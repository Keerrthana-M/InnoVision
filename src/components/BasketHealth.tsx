export default function BasketHealth() {
  // Placeholder health score calculation
  const score = 78
  return (
    <div className="card card-p">
      <div className="section-title mb-1">Basket Health Score</div>
      <div className="text-2xl font-semibold">{score}/100</div>
      <div className="muted">Balanced choices with room to improve 🥗</div>
    </div>
  )
}
