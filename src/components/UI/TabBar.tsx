import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface TabBarProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div
      className={cn(
        'flex p-1 bg-cream-100 rounded-2xl shadow-soft',
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 z-10',
              isActive ? 'text-white' : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tabActive"
                className="absolute inset-0 bg-primary-500 rounded-xl shadow-soft"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
