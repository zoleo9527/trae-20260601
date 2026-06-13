import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../utils/api'
import { Briefcase, Users, AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-gray-600', bg: 'bg-gray-100' },
  pending: { label: '待审核', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: '已通过', color: 'text-blue-600', bg: 'bg-blue-100' },
  published: { label: '已发布', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: '已退回', color: 'text-red-600', bg: 'bg-red-100' },
  expired: { label: '已过期', color: 'text-orange-600', bg: 'bg-orange-100' },
  closed: { label: '已关闭', color: 'text-gray-500', bg: 'bg-gray-200' },
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const user = useAuthStore(state => state.user)

  useEffect(() => {
    api.jobs.list().then(data => setJobs(data))
    api.interviews.list().then(data => setInterviews(data))
  }, [])

  const stats = {
    totalJobs: jobs.length,
    pendingJobs: jobs.filter(j => j.status === 'pending').length,
    publishedJobs: jobs.filter(j => j.status === 'published').length,
    totalInterviews: interviews.length,
    noShowInterviews: interviews.filter(i => i.no_show).length,
    todayInterviews: interviews.filter(i => {
      const today = new Date().toDateString()
      return new Date(i.interview_time).toDateString() === today
    }).length,
  }

  const recentJobs = jobs.slice(0, 5)
  const recentInterviews = interviews.slice(0, 5)

  const roleLabels: Record<string, string> = {
    operator: '运营',
    consultant: '招聘顾问',
    hr: '企业HR',
  }

  const statCards = [
    { label: '岗位总数', value: stats.totalJobs, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '待审核', value: stats.pendingJobs, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '已发布', value: stats.publishedJobs, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '面试总数', value: stats.totalInterviews, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '今日面试', value: stats.todayInterviews, icon: TrendingUp, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: '爽约记录', value: stats.noShowInterviews, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
          <p className="text-gray-500 mt-1">欢迎回来，{roleLabels[user?.role || '']} {user?.username}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">当前日期</p>
          <p className="font-medium text-gray-800">{new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">最近岗位</h2>
          <div className="space-y-3">
            {recentJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[job.status].bg} ${statusLabels[job.status].color}`}>
                  {statusLabels[job.status].label}
                </span>
              </div>
            ))}
            {recentJobs.length === 0 && (
              <p className="text-center text-gray-400 py-8">暂无岗位数据</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">最近面试</h2>
          <div className="space-y-3">
            {recentInterviews.map(interview => (
              <div key={interview.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{interview.candidate_name}</p>
                  <p className="text-sm text-gray-500">{interview.job_title} · {new Date(interview.interview_time).toLocaleString('zh-CN')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  interview.no_show ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {interview.no_show ? '已爽约' : '已安排'}
                </span>
              </div>
            ))}
            {recentInterviews.length === 0 && (
              <p className="text-center text-gray-400 py-8">暂无面试数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}