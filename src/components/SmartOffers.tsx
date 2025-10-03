export default function SmartOffers() {
  const offers = [
    { id: 1, title: 'Buy 1 Get 1 Free', desc: 'On selected juices', color: 'from-rose-500 to-pink-600' },
    { id: 2, title: 'Eco Discount 10%', desc: 'Bring your own bag', color: 'from-emerald-500 to-green-600' },
  ]
  return (
    <div className="card card-p">
      <div className="section-title mb-3">Smart Offers</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {offers.map(o => (
          <div key={o.id} className={`rounded-xl p-4 text-white bg-gradient-to-br ${o.color}`}>
            <div className="font-semibold">{o.title}</div>
            <div className="text-sm opacity-90">{o.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
