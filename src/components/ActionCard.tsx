import { ReactNode } from 'react'
import { motion } from 'framer-motion'

export default function ActionCard({ title, desc, icon, onClick, color = 'from-brand-500 to-brand-700' }: {
  title: string
  desc?: string
  icon?: ReactNode
  onClick?: () => void
  color?: string
}) {
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick} className={`card card-p text-left bg-gradient-to-br ${color} text-white`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">{icon}</div>
        <div>
          <div className="text-lg font-semibold">{title}</div>
          {desc && <div className="text-sm opacity-90">{desc}</div>}
        </div>
      </div>
    </motion.button>
  )
}
