import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { ProblemStatusBadge, RoleBadge } from '@/components/StatusBadge'
import {
  PROBLEM_TYPE_LABELS,
  PROBLEM_STATUS_LABELS,
  CONTACT_TYPE_LABELS,
  NOTIFICATION_TYPE_LABELS,
  ROLE_LABELS,
  type ProblemType,
  type ContactType,
  type Role,
  type ProblemStatus,
  type NotificationType,
} from '../../shared/types'
import {
  Search, RefreshCw, ArrowRight, UserCog, Phone, Clock,
  ChevronDown, ChevronUp, AlertCircle, Bell, MessageSquarePlus, Filter,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'pending,supplementing', label: '待处理' },
  { value: 'contacting', label: '联系中' },
  { value: 'reviewing', label: '复核中' },
  { value: 'returned', label: '已退回' },
  { value: 'closed,resolved', label: '已关闭' },
]

function getStatusTabLabel(urlStatus: string): string {
  const tab = STATUS_TABS.find((t) => t.value === urlStatus)
  if (tab) return tab.label
  const parts = urlStatus.split(',').map((s) => PROBLEM_STATUS_LABELS[s as ProblemStatus] || s)
  return parts.join(' + ')
}

function matchesStatus(problemStatus: ProblemStatus, filterValue: string): boolean {
  if (!filterValue) return true
  const allowed = filterValue.split(',').map((s) => s.trim()).filter(Boolean)
  return allowed.includes(problemStatus)
}

type FollowUpStatus = 'no_contact' | 'follow_up_needed' | 'contacted' | 'contacting'

function getFollowUpStatus(
  problemStatus: ProblemStatus,
  contactCount: number,
  hasFollowUpRequired: boolean,
): FollowUpStatus {
  if (contactCount === 0) return 'no_contact'
  if (hasFollowUpRequired) return 'follow_up_needed'
  if (problemStatus === 'contacting') return 'contacting'
  return 'contacted'
}

const FOLLOW_UP_STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; bg: string }> = {
  no_contact: { label: '待联系', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  follow_up_needed: { label: '需跟进', color: 'text-red-700', bg: 'bg-red-100' },
  contacting: { label: '联系中', color: 'text-blue-700', bg: 'bg-blue-100' },
  contacted: { label: '已联系', color: 'text-green-700', bg: 'bg-green-100' },
}

export default function ContactList() {
  const {
    contacts, problems, problemDetailsMap, notifications,
    loadContactWorkbench, loadNotifications,
  } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus)
  const [keyword, setKeyword] = useState('')
  const [expandedProblems, setExpandedProblems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContactWorkbench()
    loadNotifications()
  }, [])

  useEffect(() => {
    if (statusFilter) {
      setSearchParams({ status: statusFilter }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [statusFilter])

  const handleRefresh = () => {
    loadContactWorkbench()
    loadNotifications()
  }

  const toggleExpand = (id: string) => {
    setExpandedProblems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const contactsByProblem = useMemo(() => {
    const map: Record<string, typeof contacts> = {}
    for (const c of contacts) {
      if (!map[c.problemRecordId]) map[c.problemRecordId] = []
      map[c.problemRecordId].push(c)
    }
    return map
  }, [contacts])

  const problemNotifications = useMemo(() => {
    const map: Record<string, typeof notifications> = {}
    for (const n of notifications) {
      if (n.sourceType === 'problem') {
        if (!map[n.sourceId]) map[n.sourceId] = []
        map[n.sourceId].push(n)
      }
    }
    return map
  }, [notifications])

  const workbenchItems = useMemo(() => {
    return problems
      .filter((p) => matchesStatus(p.status as ProblemStatus, statusFilter))
      .filter((p) => {
        if (!keyword) return true
        const detail = problemDetailsMap[p.id]
        const matchesTracking = p.trackingNumber.includes(keyword)
        const matchesDesc = p.description?.includes(keyword) || false
        const matchesResponsible = p.responsiblePersonName.includes(keyword)
        const matchesCustomer = detail?.delivery?.recipientName?.includes(keyword) || false
        return matchesTracking || matchesDesc || matchesResponsible || matchesCustomer
      })
      .map((p) => {
        const detail = problemDetailsMap[p.id]
        const problemContacts = contactsByProblem[p.id] || []
        const problemNotifs = problemNotifications[p.id] || []
        const latestHistory = detail?.history?.[detail.history.length - 1]
        const hasFollowUpRequired = problemContacts.some((c) => c.followUpRequired)
        const followUpStatus = getFollowUpStatus(p.status as ProblemStatus, problemContacts.length, hasFollowUpRequired)
        const unreadNotifs = problemNotifs.filter((n) => !n.isRead)
        const hasRecentChange = unreadNotifs.some(
          (n) => n.type === 'problem_updated' || n.type === 'responsible_change' || n.type === 'problem_created',
        )

        return {
          problem: p,
          detail,
          contacts: problemContacts,
          notifications: problemNotifs,
          unreadNotifications: unreadNotifs,
          latestHistory,
          followUpStatus,
          hasRecentChange,
        }
      })
      .sort((a, b) => {
        const priorityMap: Record<FollowUpStatus, number> = {
          no_contact: 0,
          follow_up_needed: 1,
          contacting: 2,
          contacted: 3,
        }
        const pa = priorityMap[a.followUpStatus]
        const pb = priorityMap[b.followUpStatus]
        if (pa !== pb) return pa - pb
        return b.problem.updatedAt.localeCompare(a.problem.updatedAt)
      })
  }, [problems, contactsByProblem, problemNotifications, problemDetailsMap, statusFilter, keyword])

  const totalCounts = useMemo(() => {
    const counts: Record<string, number> = { '': problems.length }
    for (const tab of STATUS_TABS) {
      if (tab.value) {
        counts[tab.value] = problems.filter((p) => matchesStatus(p.status as ProblemStatus, tab.value)).length
      }
    }
    return counts
  }, [problems, statusFilter])

  const pendingContactCount = useMemo(
    () => problems.filter((p) => {
      const cs = contactsByProblem[p.id] || []
      return cs.length === 0 && (p.status === 'pending' || p.status === 'supplementing')
    }).length,
    [problems, contactsByProblem],
  )

  const renderTimeline = (problemId: string) => {
    const detail = problemDetailsMap[problemId]
    if (!detail) return null

    const responsibleChanges = detail.history.filter((h) => h.action === 'responsible_change')

    return (
      <div className="mt-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
          <Clock className="w-3 h-3" /> 处理历史时间线
        </p>
        <div className="space-y-2 ml-1">
          {detail.history.map((h, idx) => {
            const isResponsibleChange = h.action === 'responsible_change'
            return (
              <div key={h.id} className="flex gap-2">
                <div className="flex flex-col items-center">
                  <div className={`w-2 h-2 rounded-full mt-1 ${isResponsibleChange ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                  {idx < detail.history.length - 1 && <div className="w-px flex-1 bg-slate-200 min-h-[8px]"></div>}
                </div>
                <div className="pb-1.5">
                  <p className={`text-xs ${isResponsibleChange ? 'font-semibold text-orange-700' : 'text-slate-700'}`}>
                    {h.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{h.operatorName}</span>
                    <RoleBadge role={h.operatorRole as Role} />
                    <span className="text-xs text-slate-400">{h.createdAt}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {responsibleChanges.length > 0 && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
              <UserCog className="w-3.5 h-3.5" /> 责任链变更记录（{responsibleChanges.length} 次变更）
            </p>
            <div className="space-y-1.5">
              {responsibleChanges.map((h) => (
                <div key={h.id} className="text-xs bg-white rounded px-2 py-1.5 border border-orange-100">
                  <p className="text-slate-700">{h.description}</p>
                  <p className="text-slate-400 mt-0.5">
                    {h.operatorName}（{ROLE_LABELS[h.operatorRole as Role]}）· {h.createdAt}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderChangeNotifications = (problemId: string) => {
    const notifs = problemNotifications[problemId]?.filter((n) => !n.isRead) || []
    if (notifs.length === 0) return null

    return (
      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
        <p className="text-xs font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
          <Bell className="w-3 h-3" /> 变更通知（{notifs.length} 条未读）
        </p>
        <div className="space-y-1">
          {notifs.slice(0, 4).map((n) => (
            <div key={n.id} className="text-xs text-blue-800 flex items-start gap-1.5">
              <span className="text-blue-400 mt-0.5">•</span>
              <div>
                <span className="font-medium">{NOTIFICATION_TYPE_LABELS[n.type as NotificationType] || n.type}</span>
                <span className="text-blue-600 ml-1">{n.content}</span>
                <span className="text-blue-400 ml-1">{n.createdAt}</span>
              </div>
            </div>
          ))}
          {notifs.length > 4 && (
            <p className="text-xs text-blue-500">...还有 {notifs.length - 4} 条通知</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">客户联系工作台</h2>
          <p className="text-sm text-slate-500 mt-1">
            问题件联系处理 · 待联系/需跟进/变更通知一站式跟进
            {pendingContactCount > 0 && (
              <span className="ml-2 text-yellow-600 font-medium">
                {pendingContactCount} 件待联系
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/problems/new"
            className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded px-3 py-1.5 hover:bg-blue-700"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" /> 新建联系
          </Link>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 刷新
          </button>
        </div>
      </div>

      <div className="mb-4 bg-white rounded-lg border border-slate-200 px-4 py-3">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 flex-1">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索单号/责任人/客户名"
              className="text-sm border-none outline-none flex-1 placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${statusFilter === tab.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
              {totalCounts[tab.value] !== undefined && (
                <span className={`text-xs ${statusFilter === tab.value ? 'text-blue-200' : 'text-slate-400'}`}>
                  {totalCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {statusFilter && (
        <div className="mb-3 flex items-center gap-2 text-xs text-blue-600">
          <Filter className="w-3 h-3" />
          <span>当前筛选：{getStatusTabLabel(statusFilter)}</span>
          <button onClick={() => setStatusFilter('')} className="underline hover:text-blue-800">清除筛选</button>
        </div>
      )}

      <div className="space-y-3">
        {workbenchItems.map((item) => {
          const { problem, detail, contacts: problemContacts, followUpStatus, hasRecentChange, latestHistory, unreadNotifications } = item
          const isExpanded = expandedProblems.has(problem.id)
          const followUpConfig = FOLLOW_UP_STATUS_CONFIG[followUpStatus]
          const responsibleChanges = detail?.history.filter((h) => h.action === 'responsible_change') || []

          return (
            <div
              key={problem.id}
              className={`bg-white rounded-lg border transition-colors ${hasRecentChange ? 'border-blue-300 shadow-sm' : 'border-slate-200'}`}
            >
              <div
                className="px-5 py-3 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(problem.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-base font-mono font-bold text-slate-800">
                      {problem.trackingNumber}
                    </span>
                    <ProblemStatusBadge status={problem.status as ProblemStatus} />
                    <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                      {PROBLEM_TYPE_LABELS[problem.problemType as ProblemType] || problem.problemType}
                    </span>
                    <span className={`text-xs ${followUpConfig.bg} ${followUpConfig.color} rounded px-2 py-0.5`}>
                      {followUpConfig.label}
                    </span>
                    {hasRecentChange && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5 flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {unreadNotifications.length} 条变更
                      </span>
                    )}
                    {responsibleChanges.length > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded px-2 py-0.5 flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> 责任链变更{responsibleChanges.length}次
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-1">
                    <span>
                      责任人：<strong className="text-slate-700">{problem.responsiblePersonName}</strong>
                    </span>
                    <span>报告人：{problem.reporterName}</span>
                    {problemContacts.length > 0 ? (
                      <span>联系记录：{problemContacts.length} 条</span>
                    ) : (
                      <span className="text-yellow-600 font-medium flex items-center gap-0.5">
                        <AlertCircle className="w-3 h-3" /> 尚未联系
                      </span>
                    )}
                    {detail && <span>历史：{detail.history.length} 条</span>}
                  </div>

                  {latestHistory && (
                    <p className="text-xs text-slate-400 truncate max-w-xl">
                      最近：{latestHistory.description} — {latestHistory.operatorName} {latestHistory.createdAt}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {followUpStatus === 'no_contact' && (
                    <Link
                      to={`/problems/${problem.id}`}
                      className="flex items-center gap-1 text-xs bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600"
                    >
                      <Phone className="w-3 h-3" /> 去联系
                    </Link>
                  )}
                  {followUpStatus === 'follow_up_needed' && (
                    <Link
                      to={`/problems/${problem.id}`}
                      className="flex items-center gap-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600"
                    >
                      <Phone className="w-3 h-3" /> 跟进
                    </Link>
                  )}
                  <Link
                    to={`/problems/${problem.id}`}
                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                  >
                    查看 <ArrowRight className="w-3 h-3" />
                  </Link>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4">
                  {renderChangeNotifications(problem.id)}

                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2">
                      {problemContacts.length > 0 ? (
                        <>
                          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> 关联联系记录（{problemContacts.length}）
                          </p>
                          <div className="space-y-2">
                            {problemContacts.map((c) => (
                              <div key={c.id} className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                                      {CONTACT_TYPE_LABELS[c.contactType as ContactType] || c.contactType}
                                    </span>
                                    <span className="text-xs text-slate-500">{c.contactPersonName}</span>
                                    <RoleBadge role={c.contactPersonRole as Role} />
                                  </div>
                                  <span className="text-xs text-slate-400">{c.createdAt}</span>
                                </div>
                                <p className="text-sm text-slate-700">{c.customerResponse}</p>
                                {c.notes && <p className="text-xs text-slate-500 mt-1">备注：{c.notes}</p>}
                                {c.followUpRequired && (
                                  <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5">需要跟进</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                          <p className="text-sm text-yellow-800 font-medium flex items-center gap-1.5 mb-1">
                            <AlertCircle className="w-4 h-4" /> 尚未新增联系记录
                          </p>
                          <p className="text-xs text-yellow-600">
                            该问题件已登记但尚未联系客户，请点击"去联系"进入问题件详情页添加联系记录
                          </p>
                          <Link
                            to={`/problems/${problem.id}`}
                            className="inline-flex items-center gap-1 mt-2 text-xs bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600"
                          >
                            <Phone className="w-3 h-3" /> 立即联系
                          </Link>
                        </div>
                      )}

                      {renderTimeline(problem.id)}
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">问题件信息</p>
                      {detail && (
                        <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5">
                          <div><span className="text-slate-400">单号：</span><span className="font-mono text-slate-700">{detail.trackingNumber}</span></div>
                          <div><span className="text-slate-400">问题类型：</span><span className="text-slate-700">{PROBLEM_TYPE_LABELS[detail.problemType as ProblemType] || detail.problemType}</span></div>
                          <div><span className="text-slate-400">当前状态：</span><ProblemStatusBadge status={detail.status as ProblemStatus} /></div>
                          <div><span className="text-slate-400">责任人：</span><span className="text-slate-700 font-medium">{detail.responsiblePersonName}</span></div>
                          <div><span className="text-slate-400">报告人：</span><span className="text-slate-700">{detail.reporterName}</span></div>
                          <div><span className="text-slate-400">登记时间：</span><span className="text-slate-600">{detail.createdAt}</span></div>
                          <div><span className="text-slate-400">更新时间：</span><span className="text-slate-600">{detail.updatedAt}</span></div>
                          {detail.description && (
                            <div><span className="text-slate-400">描述：</span><span className="text-slate-600">{detail.description}</span></div>
                          )}
                          {detail.resolution && (
                            <div><span className="text-slate-400">处理结果：</span><span className="text-slate-600">{detail.resolution}</span></div>
                          )}

                          <div className="pt-1.5 border-t border-slate-200">
                            <span className="text-slate-400">跟进状态：</span>
                            <span className={`${followUpConfig.color} font-medium`}>{followUpConfig.label}</span>
                          </div>

                          {detail.delivery && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-slate-500 font-medium mb-1">客户信息</p>
                              <div><span className="text-slate-400">收件人：</span>{detail.delivery.recipientName}</div>
                              <div><span className="text-slate-400">电话：</span>{detail.delivery.recipientPhone}</div>
                              <div><span className="text-slate-400">地址：</span>{detail.delivery.deliveryAddress}</div>
                              <div><span className="text-slate-400">派件员：</span>{detail.delivery.courierName}</div>
                              <div>
                                <span className="text-slate-400">驿站签收图：</span>
                                {detail.delivery.stationSignImage ? '有' : '无'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {responsibleChanges.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-orange-700 mb-2 flex items-center gap-1">
                            <UserCog className="w-3 h-3" /> 责任链
                          </p>
                          <div className="space-y-1">
                            {responsibleChanges.map((h, idx) => (
                              <div key={h.id} className="flex items-start gap-2">
                                <div className="flex flex-col items-center mt-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                  {idx < responsibleChanges.length - 1 && <div className="w-px flex-1 bg-orange-200 min-h-[4px]"></div>}
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{h.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {workbenchItems.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 text-center py-12 text-slate-400 text-sm">
            {statusFilter || keyword ? '没有匹配的问题件' : '暂无问题件'}
          </div>
        )}
      </div>
    </div>
  )
}
