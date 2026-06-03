import { useEventStore } from '@/store/useEventStore'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  const searchParticipants = useEventStore(s => s.searchParticipants)
  const participants = useEventStore(s => s.participants)
  const navigate = useNavigate()
  const [showResults, setShowResults] = useState(false)

  const results = searchQuery.trim() ? searchParticipants(searchQuery) : []
  const pendingAnomalies = useEventStore(s => s.anomalies.filter(a => a.status === 'pending').length)

  return (
    <div className="flex h-screen bg-[#0f0f1a] text-zinc-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center h-11 bg-[#14141f] border-b border-zinc-800 px-4 gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索号码、姓名、手机号..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowResults(true) }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#1a1a2e] border border-zinc-700 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500/50"
            />
            {showResults && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-zinc-700 rounded shadow-xl z-50 max-h-60 overflow-auto">
                {results.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-700/50 text-left text-xs"
                    onClick={() => { navigate('/registrations'); setSearchQuery(''); setShowResults(false) }}
                  >
                    <span className="font-mono text-orange-400 w-12">{p.bibNumber || '--'}</span>
                    <span className="text-zinc-200">{p.name}</span>
                    <span className="text-zinc-500 ml-auto">{p.group}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200">
              <Bell size={14} />
              {pendingAnomalies > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] font-bold flex items-center justify-center text-white">
                  {pendingAnomalies}
                </span>
              )}
            </button>
            <span className="text-[10px] text-zinc-500">{participants.length} 名选手</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
