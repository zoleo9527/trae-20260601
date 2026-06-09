import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { ProblemStatusBadge, RoleBadge } from '@/components/StatusBadge'
import {
  PROBLEM_TYPE_LABELS,
  CONTACT_TYPE_LABELS,
  ROLE_LABELS,
  type ProblemType,
  type ContactType,
  type Role,
  type ProblemStatus,
} from '../../shared/types'
import { Search, RefreshCw, ArrowRight, UserCog, Phone, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ContactList() {
  const { contacts, loadContactsWithDetails, problemDetailsMap, notifications, loadNotifications } = useAppStore()
  const [keyword, setKeyword] = useState('')
  const [expandedProblems, setExpandedProblems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadContactsWithDetails()
    loadNotifications()
  }, [])

  const handleSearch = () => {
    loadContactsWithDetails()
  }

  const toggleExpand = (id: string) => {
    setExpandedProblems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const groupedByProblem = contacts.reduce<Record<string, typeof contacts>>((acc, c) => {
    if (!acc[c.problemRecordId]) acc[c.problemRecordId] = []
    acc[c.problemRecordId].push(c)
    return acc
  }, {})

  const filteredProblemIds = keyword
    ? Object.entries(groupedByProblem).filter(([, cs]) =>
        cs.some((c) => c.trackingNumber.includes(keyword))
      ).map(([id]) => id)
    : Object.keys(groupedByProblem)

  const renderTimeline = (problemId: string) => {
    const detail = problemDetailsMap[problemId]
    if (!detail) return null

    const responsibleChanges = detail.history.filter((h) => h.action === 'responsible_change')
    const otherHistory = detail.history.filter((h) => h.action !== 'responsible_change')

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

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">客户联系 · 责任链回看</h2>
          <p className="text-sm text-slate-500 mt-1">按问题件查看责任人变更时间线、历史说明和关联联系人</p>
        </div>
        <button
          onClick={() => { loadContactsWithDetails(); loadNotifications() }}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 刷新
        </button>
      </div>

      <div className="mb-4">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-2.5 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索单号"
            className="text-sm border-none outline-none flex-1 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredProblemIds.map((problemId) => {
          const problemContacts = groupedByProblem[problemId]
          const detail = problemDetailsMap[problemId]
          const isExpanded = expandedProblems.has(problemId)
          const responsibleChanges = detail?.history.filter((h) => h.action === 'responsible_change') || []

          return (
            <div key={problemId} className="bg-white rounded-lg border border-slate-200">
              <div
                className="px-5 py-3 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleExpand(problemId)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-mono font-bold text-slate-800">
                      {problemContacts[0]?.trackingNumber || problemId.substring(0, 8)}
                    </span>
                    {detail && (
                      <>
                        <ProblemStatusBadge status={detail.status as ProblemStatus} />
                        <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                          {PROBLEM_TYPE_LABELS[detail.problemType as ProblemType] || detail.problemType}
                        </span>
                      </>
                    )}
                    {responsibleChanges.length > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded px-2 py-0.5 flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> 责任链变更{responsibleChanges.length}次
                      </span>
                    )}
                  </div>

                  {detail && (
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>责任人：<strong className="text-slate-700">{detail.responsiblePersonName}</strong></span>
                      <span>报告人：{detail.reporterName}</span>
                      <span>联系记录：{problemContacts.length} 条</span>
                      <span>历史：{detail.history.length} 条</span>
                    </div>
                  )}

                  {detail && detail.description && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-xl">{detail.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                  <Link
                    to={`/problems/${problemId}`}
                    className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                  >
                    查看问题件 <ArrowRight className="w-3 h-3" />
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
                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> 关联联系人记录
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

                      {renderTimeline(problemId)}
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

                          {detail.delivery && (
                            <div className="mt-2 pt-2 border-t border-slate-200">
                              <p className="text-slate-500 font-medium mb-1">派件信息</p>
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

        {filteredProblemIds.length === 0 && (
          <div className="bg-white rounded-lg border border-slate-200 text-center py-12 text-slate-400 text-sm">
            暂无联系记录
          </div>
        )}
      </div>
    </div>
  )
}
