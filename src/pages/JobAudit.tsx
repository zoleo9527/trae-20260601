import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react'

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
  job: any | null
  action: 'view' | 'approve' | 'reject'
  remark: string
}

export default function JobAudit() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    job: null,
    action: 'view',
    remark: ''
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = () => {
    setLoading(true)
    api.jobs.list('pending').then(data => {
      setJobs(data)
      setLoading(false)
    })
  }

  const handleApprove = async (jobId: number) => {
    await api.jobs.audit(jobId, 'approve')
    loadJobs()
    setModal({ ...modal, isOpen: false })
  }

  const handleReject = async (jobId: number, remark: string) => {
    await api.jobs.audit(jobId, 'reject', remark)
    loadJobs()
    setModal({ ...modal, isOpen: false })
  }

  const openModal = (job: any, action: 'view' | 'approve' | 'reject') => {
    setModal({ isOpen: true, job, action, remark: '' })
  }

  const closeModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">岗位审核</h1>
          <p className="text-gray-500 mt-1">审核待处理的岗位信息</p>
        </div>
        <div className="text-sm text-gray-500">
          待审核岗位：<span className="font-medium text-yellow-600">{jobs.length}</span> 个
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-500">暂无待审核岗位</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">岗位名称</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">公司</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">地点</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">薪资</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交人</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">提交时间</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{job.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{job.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{job.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{job.salary}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{job.created_by_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(job, 'view')}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(job, 'approve')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="通过"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(job, 'reject')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="退回"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal.isOpen && modal.job && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                {modal.action === 'view' && '岗位详情'}
                {modal.action === 'approve' && '确认通过'}
                {modal.action === 'reject' && '退回原因'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">岗位名称</label>
                  <p className="text-gray-800">{modal.job.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">公司名称</label>
                  <p className="text-gray-800">{modal.job.company}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">工作地点</label>
                  <p className="text-gray-800">{modal.job.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">薪资待遇</label>
                  <p className="text-gray-800">{modal.job.salary}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">岗位描述</label>
                <p className="text-gray-800">{modal.job.description}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">任职要求</label>
                <p className="text-gray-800">{modal.job.requirements}</p>
              </div>

              {modal.action === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">退回原因 <span className="text-red-500">*</span></label>
                  <textarea
                    value={modal.remark}
                    onChange={(e) => setModal({ ...modal, remark: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    rows={3}
                    placeholder="请输入退回原因"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              {modal.action === 'approve' && (
                <button
                  onClick={() => handleApprove(modal.job.id)}
                  className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认通过
                </button>
              )}
              {modal.action === 'reject' && (
                <button
                  onClick={() => modal.remark.trim() && handleReject(modal.job.id, modal.remark)}
                  disabled={!modal.remark.trim()}
                  className="px-6 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  确认退回
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}