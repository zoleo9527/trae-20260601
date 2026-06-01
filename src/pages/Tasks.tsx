import RoleSwitcher from '@/components/RoleSwitcher'
import TaskList from '@/components/TaskList'
import { useStore } from '@/store'
import type { CareRecord } from '@/types'
import { ClipboardList } from 'lucide-react'
import { useEffect } from 'react'

export default function Tasks() {
  const { todayTasks, fetchTodayTasks, updateCareRecord, fetchPatients } = useStore()

  useEffect(() => {
    fetchTodayTasks()
    fetchPatients()
  }, [fetchTodayTasks, fetchPatients])

  const handleToggle = async (task: CareRecord) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
    await updateCareRecord(task.id, {
      status: 'completed',
      executed_at: now,
      executed_by: '护士小刘',
    } as Partial<CareRecord>)
    fetchTodayTasks()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={24} className="text-vet-sky" />
            今日任务
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">今日需执行的护理任务清单</p>
        </div>
        <RoleSwitcher />
      </div>

      <TaskList tasks={todayTasks} onToggle={handleToggle} />
    </div>
  )
}
