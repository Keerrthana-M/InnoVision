import RewardCard from '@/components/RewardCard'

export default function Rewards() {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <RewardCard title="Reward Points 🎯" value={1200} />
        <RewardCard title="Eco Points 🌍" value={340} />
        <RewardCard title="Total Orders 📦" value={42} />
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Available Rewards</div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>10% off on next purchase</li>
          <li>Free eco-bag</li>
        </ul>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Leaderboard</div>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          <li>Alice - 2300 pts</li>
          <li>Bob - 1850 pts</li>
          <li>Charlie - 1640 pts</li>
        </ol>
      </div>

      <div className="card card-p">
        <div className="section-title mb-2">Badges</div>
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">Eco Hero</span>
          <span className="px-2 py-1 rounded-full bg-amber-600/10 text-amber-700 dark:text-amber-300">Healthy Shopper</span>
        </div>
      </div>
    </div>
  )
}
