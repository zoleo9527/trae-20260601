import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { getParkingLogs, getMonthlyRentals, getGateAnomalies, getEvidenceReviews } from '@/lib/api'
import { COMPLAINT_TYPE_LABELS, EVIDENCE_REVIEW_STATUS_LABELS, USER_ROLE_LABELS } from '../../shared/types'
import type { ParkingLog, MonthlyRental, GateAnomaly, UserRole } from '../../shared/types'

const directionLabels: Record<string, string> = { in: '进场', out: '出场' }
const rentalStatusLabels: Record<string, string> = { active: '有效', expired: '已过期', suspended: '已暂停' }
const rentalStatusColors: Record<string, string> = {
  active: 'text-emerald-400',
  expired: 'text-red-400',
  suspended: 'text-amber-400',
}
const anomalyTypeLabels: Record<string, string> = {
  stuck_open: '道闸常开',
  stuck_closed: '道闸常闭',
  sensor_error: '传感器故障',
  force_open: '强行闯闸',
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

type TabKey = 'reviews' | 'logs' | 'rentals' | 'anomalies'
const tabs: { key: TabKey; label: string }[] = [
  { key: 'reviews', label: '回查进度总览' },
  { key: 'logs', label: '车场日志查询' },
  { key: 'rentals', label: '月租名单查询' },
  { key: 'anomalies', label: '道闸异常查询' },
]

const reviewStatusIcon: Record<string, React.ReactNode> = {}

export default function Evidence() {
  const [activeTab, setActiveTab] = useState<TabKey>('reviews')
  const navigate = useNavigate()

  const [reviews, setReviews] = useState<any[]>([])
  const [reviewStatusFilter, setReviewStatusFilter] = useState('')
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const [logPlate, setLogPlate] = useState('')
  const [logStart, setLogStart] = useState('')
  const [logEnd, setLogEnd] = useState('')
  const [logResults, setLogResults] = useState<ParkingLog[]>([])
  const [logLoading, setLogLoading] = useState(false)

  const [rentalPlate, setRentalPlate] = useState('')
  const [rentalStatus, setRentalStatus] = useState('')
  const [rentalResults, setRentalResults] = useState<MonthlyRental[]>([])
  const [rentalLoading, setRentalLoading] = useState(false)

  const [anomalyGateId, setAnomalyGateId] = useState('')
  const [anomalyStart, setAnomalyStart] = useState('')
  const [anomalyEnd, setAnomalyEnd] = useState('')
  const [anomalyResults, setAnomalyResults] = useState<GateAnomaly[]>([])
  const [anomalyLoading, setAnomalyLoading] = useState(false)

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true)
    try {
      const data = await getEvidenceReviews({
        status: reviewStatusFilter || undefined,
      })
      setReviews(data)
    } catch {
      // ignore
    } finally {
      setReviewsLoading(false)
    }
  }, [reviewStatusFilter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const searchLogs = async () => {
    setLogLoading(true)
    try {
      const data = await getParkingLogs({
        plateNumber: logPlate || undefined,
        startTime: logStart || undefined,
        endTime: logEnd || undefined,
      })
      setLogResults(data)
    } catch {
      // ignore
    } finally {
      setLogLoading(false)
    }
  }

  const searchRentals = async () => {
    setRentalLoading(true)
    try {
      const data = await getMonthlyRentals({
        plateNumber: rentalPlate || undefined,
        status: rentalStatus || undefined,
      })
      setRentalResults(data)
    } catch {
      // ignore
    } finally {
      setRentalLoading(false)
    }
  }

  const searchAnomalies = async () => {
    setAnomalyLoading(true)
    try {
      const data = await getGateAnomalies({
        gateId: anomalyGateId || undefined,
        startTime: anomalyStart || undefined,
        endTime: anomalyEnd || undefined,
      })
      setAnomalyResults(data)
    } catch {
      // ignore
    } finally {
      setAnomalyLoading(false)
    }
  }

  const getReviewStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'blocked': return <XCircle className="w-4 h-4 text-red-400" />
      case 'in_progress': return <Clock className="w-4 h-4 text-cyan-400" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const reviewStatusColors: Record<string, string> = {
    pending: 'bg-gray-500/20 text-gray-400',
    in_progress: 'bg-cyan-500/20 text-cyan-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    blocked: 'bg-red-500/20 text-red-400',
  }

  const pendingCount = reviews.filter(r => r.status === 'pending').length
  const inProgressCount = reviews.filter(r => r.status === 'in_progress').length
  const blockedCount = reviews.filter(r => r.status === 'blocked').length
  const completedCount = reviews.filter(r => r.status === 'completed').length

  return (
    <div>
      <div className="flex border-b border-park-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-park-amber text-park-amber'
                : 'border-transparent text-park-muted hover:text-park-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reviews' && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="bg-park-card rounded-lg border border-park-border p-3">
              <div className="text-xs text-park-muted mb-1">待回查</div>
              <div className="text-2xl font-bold text-gray-400">{pendingCount}</div>
            </div>
            <div className="bg-park-card rounded-lg border border-park-border p-3">
              <div className="text-xs text-park-muted mb-1">回查中</div>
              <div className="text-2xl font-bold text-cyan-400">{inProgressCount}</div>
            </div>
            <div className="bg-park-card rounded-lg border border-park-border p-3">
              <div className="text-xs text-park-muted mb-1">受阻</div>
              <div className="text-2xl font-bold text-red-400">{blockedCount}</div>
            </div>
            <div className="bg-park-card rounded-lg border border-park-border p-3">
              <div className="text-xs text-park-muted mb-1">已完成</div>
              <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
            </div>
          </div>

          <div className="bg-park-card rounded-lg border border-park-border p-4 mb-4">
            <div className="flex items-center gap-3">
              <select
                value={reviewStatusFilter}
                onChange={(e) => setReviewStatusFilter(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="">全部状态</option>
                <option value="pending">待回查</option>
                <option value="in_progress">回查中</option>
                <option value="blocked">受阻</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>

          <div className="bg-park-card rounded-lg border border-park-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-park-muted text-left border-b border-park-border">
                    <th className="py-3 px-4 font-medium">工单号</th>
                    <th className="py-3 px-4 font-medium">投诉类型</th>
                    <th className="py-3 px-4 font-medium">回查人</th>
                    <th className="py-3 px-4 font-medium">回查状态</th>
                    <th className="py-3 px-4 font-medium">受阻原因</th>
                    <th className="py-3 px-4 font-medium">创建时间</th>
                    <th className="py-3 px-4 font-medium">更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="border-b border-park-border/50 hover:bg-park-hover/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/complaints/${review.complaint_id}`)}
                    >
                      <td className="py-3 px-4 text-park-text font-medium">{review.complaint_no || '-'}</td>
                      <td className="py-3 px-4">
                        {review.complaint_type ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-park-hover text-park-text text-xs">
                            {COMPLAINT_TYPE_LABELS[review.complaint_type as any] || review.complaint_type}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-park-text text-xs">{review.reviewer_name || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {getReviewStatusIcon(review.status)}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${reviewStatusColors[review.status] || ''}`}>
                            {EVIDENCE_REVIEW_STATUS_LABELS[review.status as any] || review.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {review.blocked_reason ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                            <span className="text-red-400 text-xs truncate max-w-[200px]">{review.blocked_reason}</span>
                          </div>
                        ) : (
                          <span className="text-park-muted text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-park-muted text-xs">{formatTime(review.created_at)}</td>
                      <td className="py-3 px-4 text-park-muted text-xs">{formatTime(review.updated_at)}</td>
                    </tr>
                  ))}
                  {reviews.length === 0 && !reviewsLoading && (
                    <tr><td colSpan={7} className="py-8 text-center text-park-muted">暂无回查记录</td></tr>
                  )}
                  {reviewsLoading && (
                    <tr><td colSpan={7} className="py-8 text-center text-park-muted">加载中...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <div className="bg-park-card rounded-lg border border-park-border p-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={logPlate}
                onChange={(e) => setLogPlate(e.target.value)}
                placeholder="车牌号"
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber w-40"
              />
              <input
                type="datetime-local"
                value={logStart}
                onChange={(e) => setLogStart(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              />
              <span className="text-park-muted text-sm">至</span>
              <input
                type="datetime-local"
                value={logEnd}
                onChange={(e) => setLogEnd(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              />
              <button
                onClick={searchLogs}
                disabled={logLoading}
                className="flex items-center gap-1 px-4 py-1.5 text-sm rounded bg-park-amber hover:bg-amber-600 text-white transition-colors"
              >
                <Search className="w-4 h-4" />
                查询
              </button>
            </div>
          </div>
          <div className="bg-park-card rounded-lg border border-park-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-park-muted text-left border-b border-park-border">
                    <th className="py-3 px-4 font-medium">车牌号</th>
                    <th className="py-3 px-4 font-medium">进出</th>
                    <th className="py-3 px-4 font-medium">道闸</th>
                    <th className="py-3 px-4 font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logResults.map((log) => (
                    <tr key={log.id} className="border-b border-park-border/50 hover:bg-park-hover/50">
                      <td className="py-3 px-4 text-park-text">{log.plate_number}</td>
                      <td className="py-3 px-4">
                        <span className={log.direction === 'in' ? 'text-emerald-400' : 'text-amber-400'}>
                          {directionLabels[log.direction]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-park-text">{log.gate_name}</td>
                      <td className="py-3 px-4 text-park-muted">{formatTime(log.timestamp)}</td>
                    </tr>
                  ))}
                  {logResults.length === 0 && !logLoading && (
                    <tr><td colSpan={4} className="py-8 text-center text-park-muted">请输入查询条件后点击查询</td></tr>
                  )}
                  {logLoading && (
                    <tr><td colSpan={4} className="py-8 text-center text-park-muted">查询中...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rentals' && (
        <div>
          <div className="bg-park-card rounded-lg border border-park-border p-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={rentalPlate}
                onChange={(e) => setRentalPlate(e.target.value)}
                placeholder="车牌号"
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber w-40"
              />
              <select
                value={rentalStatus}
                onChange={(e) => setRentalStatus(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              >
                <option value="">全部状态</option>
                <option value="active">有效</option>
                <option value="expired">已过期</option>
                <option value="suspended">已暂停</option>
              </select>
              <button
                onClick={searchRentals}
                disabled={rentalLoading}
                className="flex items-center gap-1 px-4 py-1.5 text-sm rounded bg-park-amber hover:bg-amber-600 text-white transition-colors"
              >
                <Search className="w-4 h-4" />
                查询
              </button>
            </div>
          </div>
          <div className="bg-park-card rounded-lg border border-park-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-park-muted text-left border-b border-park-border">
                    <th className="py-3 px-4 font-medium">车牌号</th>
                    <th className="py-3 px-4 font-medium">车主</th>
                    <th className="py-3 px-4 font-medium">有效期</th>
                    <th className="py-3 px-4 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {rentalResults.map((rental) => (
                    <tr key={rental.id} className="border-b border-park-border/50 hover:bg-park-hover/50">
                      <td className="py-3 px-4 text-park-text">{rental.plate_number}</td>
                      <td className="py-3 px-4 text-park-text">{rental.owner_name}</td>
                      <td className="py-3 px-4 text-park-muted">{formatDate(rental.start_date)} ~ {formatDate(rental.end_date)}</td>
                      <td className={`py-3 px-4 ${rentalStatusColors[rental.status] || 'text-park-muted'}`}>
                        {rentalStatusLabels[rental.status] || rental.status}
                      </td>
                    </tr>
                  ))}
                  {rentalResults.length === 0 && !rentalLoading && (
                    <tr><td colSpan={4} className="py-8 text-center text-park-muted">请输入查询条件后点击查询</td></tr>
                  )}
                  {rentalLoading && (
                    <tr><td colSpan={4} className="py-8 text-center text-park-muted">查询中...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'anomalies' && (
        <div>
          <div className="bg-park-card rounded-lg border border-park-border p-4 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                value={anomalyGateId}
                onChange={(e) => setAnomalyGateId(e.target.value)}
                placeholder="道闸ID"
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text placeholder-park-muted outline-none focus:border-park-amber w-32"
              />
              <input
                type="datetime-local"
                value={anomalyStart}
                onChange={(e) => setAnomalyStart(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              />
              <span className="text-park-muted text-sm">至</span>
              <input
                type="datetime-local"
                value={anomalyEnd}
                onChange={(e) => setAnomalyEnd(e.target.value)}
                className="bg-park-bg border border-park-border rounded px-3 py-1.5 text-sm text-park-text outline-none focus:border-park-amber"
              />
              <button
                onClick={searchAnomalies}
                disabled={anomalyLoading}
                className="flex items-center gap-1 px-4 py-1.5 text-sm rounded bg-park-amber hover:bg-amber-600 text-white transition-colors"
              >
                <Search className="w-4 h-4" />
                查询
              </button>
            </div>
          </div>
          <div className="bg-park-card rounded-lg border border-park-border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-park-muted text-left border-b border-park-border">
                    <th className="py-3 px-4 font-medium">道闸</th>
                    <th className="py-3 px-4 font-medium">异常类型</th>
                    <th className="py-3 px-4 font-medium">检测时间</th>
                    <th className="py-3 px-4 font-medium">影响(小时)</th>
                    <th className="py-3 px-4 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {anomalyResults.map((anomaly) => (
                    <tr key={anomaly.id} className="border-b border-park-border/50 hover:bg-park-hover/50">
                      <td className="py-3 px-4 text-park-text">{anomaly.gate_name}</td>
                      <td className="py-3 px-4 text-red-400">{anomalyTypeLabels[anomaly.anomaly_type] || anomaly.anomaly_type}</td>
                      <td className="py-3 px-4 text-park-muted">{formatTime(anomaly.detected_at)}</td>
                      <td className="py-3 px-4 text-amber-400">{anomaly.impact_hours ?? '-'}</td>
                      <td className="py-3 px-4">
                        {anomaly.resolved_at ? (
                          <span className="text-emerald-400">已修复</span>
                        ) : (
                          <span className="text-red-400">未修复</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {anomalyResults.length === 0 && !anomalyLoading && (
                    <tr><td colSpan={5} className="py-8 text-center text-park-muted">请输入查询条件后点击查询</td></tr>
                  )}
                  {anomalyLoading && (
                    <tr><td colSpan={5} className="py-8 text-center text-park-muted">查询中...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
