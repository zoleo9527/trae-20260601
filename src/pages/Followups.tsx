import FollowupList from '@/components/FollowupList'
import RoleSwitcher from '@/components/RoleSwitcher'
import { useStore } from '@/store'
import { CalendarCheck } from 'lucide-react'
import { useEffect } from 'react'

export default function Followups() {
  const { followups, fetchFollowups, updateFollowup } = useStore()

  useEffect(() => {
    fetchFollowups()
  }, [fetchFollowups])

  const handleConfirm = async (id: number) => {
    await updateFollowup(id, { status: 'confirmed' })
    fetchFollowups()
  }

  const handleReschedule = async (id: number) => {
    const followup = followups.find((f) => f.id === id)
    if (!followup) return
    const newDate = new Date(followup.scheduled_date)
    newDate.setDate(newDate.getDate() + 7)
    await updateFollowup(id, {
      status: 'rescheduled',
      scheduled_date: newDate.toISOString().slice(0, 10),
      notes: '改期一周后',
    })
    fetchFollowups()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck size={24} className="text-vet-violet" />
            复诊提醒
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">管理客户复诊安排与沟通记录</p>
        </div>
        <RoleSwitcher />
      </div>

      <FollowupList
        followups={followups}
        onConfirm={handleConfirm}
        onReschedule={handleReschedule}
      />
    </div>
  )
}
