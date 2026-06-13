import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../utils/api'
import { Rocket, Eye, Edit3, Plus, CheckCircle, AlertTriangle, Clock, RefreshCw, XCircle } from 'lucide-react'

const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-gray-600', bg: 'bg-gray-100' },
  pending: { label: '待审核', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  approved: { label: '已通过', color: 'text-blue-600', bg: 'bg-blue-100' },
  published: { label: '已发布', color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { label: '已退回', color: 'text-red-600', bg: 'bg-red-100' },
  expired: { label: '已过期', color: 'text-orange-600', bg: 'bg-orange-100' },
  closed: { label: '已关闭', color: 'text-gray-500', bg: 'bg-gray-200' },
}

interface ModalState {
  isOpen: boolean
  mode: 'create' | 'edit' | 'view' | 'publish' | 'republish' | 'history'
  job: any | null
  form: {
    title: string
    company: string
    location: string
    salary: string
    description: string
    requirements: string
  }
}

interface StatusHistory {
  status: string
  timestamp: string
  actor?: string
}

export default function JobManagement() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const user = useAuthStore(state => state.user)
  
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    mode: 'create',
    job: null,
    form: {
      title: '',
      company: '',
      location: '',
      salary: '',
      description: '',
      requirements: ''
    }
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = () => {
    setLoading(true)
    api.jobs.list().then(data => {
      setJobs(data)
      setLoading(false)
    })
  }

  const handleSubmit = async () => {
    if (modal.mode === 'create') {
      await api.jobs.create(modal.form)
    } else if (modal.mode === 'edit' && modal.job) {
      await api.jobs.update(modal.job.id, modal.form)
    }
    loadJobs()
    closeModal()
  }

  const handlePublish = async (jobId: number) => {
    await api.jobs.publish(jobId)
    loadJobs()
    closeModal()
  }

  const handleExpire = async (jobId: number) => {
    if (confirm('确定要标记该岗位为过期吗？过期后可重新发布。')) {
      await api.jobs.expire(jobId)
      loadJobs()
    }
  }

  const handleClose = async (jobId: number) => {
    if (confirm('确定要关闭该岗位吗？关闭后将不再对外展示。')) {
      await api.jobs.close(jobId)
      loadJobs()
    }
  }

  const openModal = (mode: ModalState['mode'], job?: any) => {
    if (mode === 'create') {
      setModal({
        isOpen: true,
        mode,
        job: null,
        form: {
          title: '',
          company: '',
          location: '',
          salary: '',
          description: '',
          requirements: ''
        }
      })
    } else if (mode === 'edit' && job) {
      setModal({
        isOpen: true,
        mode,
        job,
        form: {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements
        }
      })
    } else if (mode === 'view' && job) {
      setModal({
        isOpen: true,
        mode,
        job,
        form: {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements
        }
      })
    } else if (mode === 'publish' && job) {
      setModal({
        isOpen: true,
        mode,
        job,
        form: {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements
        }
      })
    } else if (mode === 'republish' && job) {
      setModal({
        isOpen: true,
        mode,
        job,
        form: {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements
        }
      })
    } else if (mode === 'history' && job) {
      setModal({
        isOpen: true,
        mode,
        job,
        form: {
          title: job.title,
          company: job.company,
          location: job.location,
          salary: job.salary,
          description: job.description,
          requirements: job.requirements
        }
      })
    }
  }

  const closeModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  const tabs = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待审核' },
    { id: 'approved', label: '已通过' },
    { id: 'published', label: '已发布' },
    { id: 'expired', label: '已过期' },
    { id: 'rejected', label: '已退回' },
    { id: 'closed', label: '已关闭' },
  ]

  const filteredJobs = activeTab === 'all' ? jobs : jobs.filter(j => j.status === activeTab)

  const canPublish = user?.role === 'consultant'
  const canCreate = user?.role === 'hr'
  const canEdit = user?.role === 'hr'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">岗位管理</h1>
          <p className="text-gray-500 mt-1">管理岗位信息，查看发布状态</p>
        </div>
        {canCreate && (
          <button
            onClick={() => openModal('create')}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            发布岗位
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
            {tab.label} ({jobs.filter(j => j.status === tab.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无{tabs.find(t => t.id === activeTab)?.label}岗位</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                  <p className="text-gray-500 text-sm">{job.company} · {job.location}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusLabels[job.status].bg} ${statusLabels[job.status].color}`}>
                  {statusLabels[job.status].label}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">薪资：</span>
                  <span>{job.salary}</span>
                </div>
                <div className="text-sm text-gray-600 line-clamp-2">
                  {job.description}
                </div>
              </div>

              {job.reject_reason && job.status === 'rejected' && (
                <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-lg flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                        待处理
                      </span>
                      <p className="text-sm font-semibold text-red-800">审核未通过</p>
                    </div>
                    <p className="text-xs text-red-600 mb-2">退回原因：{job.reject_reason}</p>
                    <p className="text-xs text-red-500">请修改岗位信息后重新提交审核</p>
                  </div>
                </div>
              )}

              {job.status === 'expired' && (
                <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                        待处理
                      </span>
                      <p className="text-sm font-semibold text-orange-800">岗位已过期</p>
                    </div>
                    <p className="text-xs text-orange-600">该岗位信息已超过有效期，请重新发布以继续招聘</p>
                  </div>
                </div>
              )}

              {job.status === 'published' && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-700 font-medium">岗位正在招聘中</p>
                    <p className="text-xs text-green-600 mt-1">最后更新：{new Date(job.updated_at).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
              )}

              {job.status === 'closed' && (
                <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">岗位已关闭</p>
                    <p className="text-xs text-gray-600 mt-1">该岗位已停止招聘</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-400 space-y-1">
                  <div>创建人：{job.created_by_name} | {new Date(job.created_at).toLocaleDateString('zh-CN')}</div>
                  {job.history && job.history.length > 0 && (
                    <div className="text-gray-500">
                      最近更新：{job.history[0].actor_name} · {new Date(job.history[0].created_at).toLocaleString('zh-CN')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal('view', job)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看详情"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal('history', job)}
                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="状态历史"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  {canEdit && job.status === 'rejected' && (
                    <button
                      onClick={() => openModal('edit', job)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="修改重提"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {canPublish && job.status === 'approved' && (
                    <button
                      onClick={() => openModal('publish', job)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="发布岗位"
                    >
                      <Rocket className="w-4 h-4" />
                    </button>
                  )}
                  {canPublish && job.status === 'expired' && (
                    <button
                      onClick={() => openModal('republish', job)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="重新发布"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                  {canPublish && job.status === 'published' && (
                    <button
                      onClick={() => handleExpire(job.id)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="标记过期"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </button>
                  )}
                  {(canPublish || canEdit) && job.status === 'published' && (
                    <button
                      onClick={() => handleClose(job.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="关闭岗位"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {modal.mode === 'create' && '发布新岗位'}
                {modal.mode === 'edit' && '修改岗位信息'}
                {modal.mode === 'view' && '岗位详情'}
                {modal.mode === 'publish' && '确认发布'}
                {modal.mode === 'republish' && '重新发布岗位'}
                {modal.mode === 'history' && '状态流转历史'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {(modal.mode === 'create' || modal.mode === 'edit') ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">岗位名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={modal.form.title}
                        onChange={(e) => setModal({ ...modal, form: { ...modal.form, title: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入岗位名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">公司名称 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={modal.form.company}
                        onChange={(e) => setModal({ ...modal, form: { ...modal.form, company: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入公司名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">工作地点 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={modal.form.location}
                        onChange={(e) => setModal({ ...modal, form: { ...modal.form, location: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入工作地点"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">薪资待遇 <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={modal.form.salary}
                        onChange={(e) => setModal({ ...modal, form: { ...modal.form, salary: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入薪资待遇"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">岗位描述 <span className="text-red-500">*</span></label>
                    <textarea
                      value={modal.form.description}
                      onChange={(e) => setModal({ ...modal, form: { ...modal.form, description: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      rows={3}
                      placeholder="请输入岗位描述"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">任职要求 <span className="text-red-500">*</span></label>
                    <textarea
                      value={modal.form.requirements}
                      onChange={(e) => setModal({ ...modal, form: { ...modal.form, requirements: e.target.value } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      rows={3}
                      placeholder="请输入任职要求"
                    />
                  </div>
                </>
              ) : modal.mode === 'history' ? (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">岗位信息</p>
                    <p className="font-medium text-gray-800">{modal.form.title}</p>
                    <p className="text-sm text-gray-600">{modal.form.company} · {modal.form.location}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-3">状态流转记录</p>
                    <div className="space-y-3">
                      {modal.job?.history && modal.job.history.length > 0 ? (
                        [...modal.job.history].reverse().map((record, index) => {
                          const colorMap: Record<string, string> = {
                            pending: 'bg-yellow-500',
                            approved: 'bg-blue-500',
                            published: 'bg-green-500',
                            expired: 'bg-orange-500',
                            rejected: 'bg-red-500',
                            closed: 'bg-gray-500',
                            draft: 'bg-gray-400',
                          }
                          const bgColorMap: Record<string, string> = {
                            pending: 'bg-yellow-50',
                            approved: 'bg-blue-50',
                            published: 'bg-green-50',
                            expired: 'bg-orange-50',
                            rejected: 'bg-red-50',
                            closed: 'bg-gray-50',
                            draft: 'bg-gray-50',
                          }
                          const actorRoleMap: Record<string, string> = {
                            hr: '企业HR',
                            operator: '运营',
                            consultant: '招聘顾问',
                          }
                          const actionMap: Record<string, string> = {
                            pending: '提交审核',
                            approved: '审核通过',
                            published: '发布岗位',
                            expired: '标记过期',
                            rejected: '审核退回',
                            closed: '关闭岗位',
                            draft: '保存草稿',
                          }
                          const isCurrentStatus = record.status === modal.job?.status
                          return (
                            <div key={index} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${isCurrentStatus ? `${bgColorMap[record.status]} border-2 border-current` : ''}`}>
                              <div className={`w-3 h-3 mt-1.5 ${colorMap[record.status] || 'bg-gray-500'} rounded-full ${isCurrentStatus ? 'ring-2 ring-offset-1 ring-current' : ''}`}></div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`font-medium ${isCurrentStatus ? 'text-gray-900' : 'text-gray-800'}`}>{statusLabels[record.status]?.label || record.status}</p>
                                  {isCurrentStatus && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                      当前状态
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">{new Date(record.created_at).toLocaleString('zh-CN')}</p>
                                <p className="text-xs text-gray-400 mt-1">{actorRoleMap[record.actor_name] || record.actor_name} · {actionMap[record.status] || '状态变更'}</p>
                                {record.remark && (
                                  <p className="text-xs text-red-500 mt-1">备注：{record.remark}</p>
                                )}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-center text-gray-400 py-4">暂无状态流转记录</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">岗位名称</label>
                      <p className="text-gray-800">{modal.form.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">公司名称</label>
                      <p className="text-gray-800">{modal.form.company}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">工作地点</label>
                      <p className="text-gray-800">{modal.form.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">薪资待遇</label>
                      <p className="text-gray-800">{modal.form.salary}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">岗位描述</label>
                    <p className="text-gray-800">{modal.form.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">任职要求</label>
                    <p className="text-gray-800">{modal.form.requirements}</p>
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
              {(modal.mode === 'create' || modal.mode === 'edit') && (
                <button
                  onClick={handleSubmit}
                  disabled={!modal.form.title.trim() || !modal.form.company.trim() || !modal.form.location.trim() || !modal.form.salary.trim()}
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modal.mode === 'create' ? '发布岗位' : '保存修改'}
                </button>
              )}
              {modal.mode === 'publish' && (
                <button
                  onClick={() => modal.job && handlePublish(modal.job.id)}
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认发布
                </button>
              )}
              {modal.mode === 'republish' && (
                <button
                  onClick={() => modal.job && handlePublish(modal.job.id)}
                  className="px-6 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新发布
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}