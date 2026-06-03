import StatsPanel from '@/components/StatsPanel'
import FilterBar from '@/components/FilterBar'
import RecordTable from '@/components/RecordTable'
import BatchActions from '@/components/BatchActions'
import DetailDrawer from '@/components/DetailDrawer'
import { ClipboardCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
            <ClipboardCheck className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-100">
            中央厨房 · 留样记录与批次追溯
          </h1>
          <span className="rounded bg-slate-700/50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            工作台
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-6">
        <div className="space-y-5">
          <StatsPanel />
          <FilterBar />
          <RecordTable />
        </div>
      </main>

      <BatchActions />
      <DetailDrawer />
    </div>
  )
}
