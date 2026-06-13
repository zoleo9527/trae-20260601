import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../utils/api'
import { Calendar, Phone, User, AlertCircle, CheckCircle, Clock, Plus, XCircle } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: '待面试', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-100' },
  noshow: { label: '已爽约', color: 'text-red-600', bg: 'bg-red-100' },
  cancelled: { label: '已取消', color: 'text-gray-500', bg: 'bg-gray-200' },
}

interface ModalState {
  isOpen: boolean
  mode: 'create' | 'updateStatus'
  interview: any | null
  form: {
    job_id: number
    candidate_name: string
    phone: string
    interview_time: string
  }
}

export default function InterviewManagement() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const user = useAuthStore(state => state.user)
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    interview: null,
    form: {
      job_id: 0,
      candidate_name: '',
      phone: '',
      interview_time: ''
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.interviews.list(),
      api.jobs.list('published')
    ]).then(([interviewData, jobData]) => {
      setInterviews(interviewData)
      setJobs(jobData)
      setLoading(false)
    })
  }

  const handleCreate = async () => {
    await api.interviews.create(modal.form)
    loadData()
    closeModal()
  }

  const handleUpdateStatus = async (status: string) => {
    if (modal.interview) {
      await api.interviews.updateStatus(modal.interview.id, status as any)
      loadData()
      closeModal()
    }
  }

  const openModal = (mode: ModalState['mode'], interview?: any) => {
    if (mode === 'create') {
      setModal({
        isOpen: true,
        mode,
        interview: null,
        form: {
          job_id: jobs[0]?.id || 0,
          candidate_name: '',
          phone: '',
          interview_time: ''
        }
      })
    } else if (mode === 'updateStatus' && interview) {
      setModal({
        isOpen: true,
        mode,
        interview,
        form: {
          job_id: interview.job_id,
          candidate_name: interview.candidate_name,
          phone: interview.phone,
          interview_time: interview.interview_time
        }
      })
    }
  }

  const closeModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'scheduled', label: '待面试' },
    { id: 'completed', label: '已完成' },
    { id: 'noshow', label: '已爽约' },
  ]

  const filteredInterviews = activeTab === 'all' ? interviews : interviews.filter(i => i.status === activeTab)
  const canCreate = user?.role === 'consultant'

  const getStatusActions = (status: string) => {
    const actions: { label: string; status: string; color: string }[] = []
    if (status === 'scheduled') {
      actions.push(
        { label: '完成面试', status: 'completed', color: 'bg-green-600' },
        { label: '标记爽约', status: 'noshow', color: 'bg-red-600' },
        { label: '取消面试', status: 'cancelled', color: 'bg-gray-600' }
      )
    }
    return actions
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">面试管理</h1>
          <p className="text-gray-500 mt-1">管理面试名单，记录面试状态</p>
        </div>
        {canCreate && jobs.length > 0 && (
          <button
            onClick={() => openModal('create')}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增面试
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label} ({interviews.filter(i => i.status === tab.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无{tabs.find(t => t.id === activeTab)?.label}面试记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map(interview => (
            <div key={interview.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${interview.no_show ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                    {interview.no_show ? (
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{interview.candidate_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>{interview.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[interview.status].bg} ${statusLabels[interview.status].color}`}>
                    {statusLabels[interview.status].label}
                  </span>
                  {interview.status === 'scheduled' && (
                    <button
                      onClick={() => openModal('updateStatus', interview)}
                      className="px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      更新状态
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">岗位：</span>
                  <span>{interview.job_title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{new Date(interview.interview_time).toLocaleString('zh-CN')}</span>
                </div>
              </div>

              {interview.no_show && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">该候选人已爽约，请及时跟进</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {modal.mode === 'create' && '新增面试记录'}
                {modal.mode === 'updateStatus' && '更新面试状态'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {modal.mode === 'create' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">选择岗位 <span className="text-red-500">*</span></label>
                    <select
                      value={modal.form.job_id}
                      onChange={(e) => setModal({ ...modal, form: { ...modal.form, job_id: Number(e.target.value) } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title} - {job.company}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">候选人姓名 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={modal.form.candidate_name}
                      onChange={(e) => setModal({ ...modal, form: { ...modal.form, candidate_name: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="请输入候选人姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">联系电话 <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={modal.form.phone}
                      onChange={(e) => setModal({ ...modal, form: { ...modal.form, phone: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="请输入联系电话"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">面试时间 <span className="text-red-500">*</span></label>
                    <input
                      type="datetime-local"
                      value={modal.form.interview_time}
                      onChange={(e) => setModal({ ...modal, form: { ...modal.form, interview_time: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-800 font-medium">候选人：{modal.interview?.candidate_name}</p>
                    <p className="text-gray-500 text-sm">{modal.interview?.job_title} · {new Date(modal.interview?.interview_time).toLocaleString('zh-CN')}</p>
                  </div>
                  <div className="space-y-3">
                    {getStatusActions(modal.interview?.status || '').map(action => (
                      <button
                        key={action.status}
                        onClick={() => handleUpdateStatus(action.status)}
                        className={`w-full py-3 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${action.color} hover:opacity-90`}
                      >
                        {action.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                        {action.status === 'noshow' && <XCircle className="w-4 h-4" />}
                        {action.status === 'cancelled' && <Clock className="w-4 h-4" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              {modal.mode === 'create' && (
                <button
                  onClick={handleCreate}
                  disabled={!modal.form.candidate_name.trim() || !modal.form.phone.trim() || !modal.form.interview_time}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  确认添加
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}