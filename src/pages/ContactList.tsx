import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { ProblemStatusBadge, RoleBadge } from '@/components/StatusBadge'
import { PROBLEM_TYPE_LABELS, CONTACT_TYPE_LABELS, NOTIFICATION_TYPE_LABELS, type ProblemType, type ContactType, type Role, type NotificationType } from '../../shared/types'
import { Search, RefreshCw, ArrowRight, Bell, Check, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ContactList() {
  const { contacts, loadContacts, problems, loadProblems } = useAppStore()
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadContacts()
    loadProblems()
  }, [])

  const handleSearch = () => {
    loadContacts(keyword ? { trackingNumber: keyword } : undefined)
  }

  const getProblemForContact = (problemRecordId: string) => {
    return problems.find((p) => p.id === problemRecordId)
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">客户联系</h2>
          <p className="text-sm text-slate-500 mt-1">查看所有客户联系记录，回溯问题件登记的责任人和历史</p>
        </div>
        <button
          onClick={() => { loadContacts(); loadProblems() }}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded px-3 py-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> 刷新
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索单号"
              className="text-sm border-none outline-none w-48 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {contacts.map((c) => {
            const problem = getProblemForContact(c.problemRecordId)
            return (
              <div key={c.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-medium text-slate-800">{c.trackingNumber}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-0.5">
                        {CONTACT_TYPE_LABELS[c.contactType as ContactType] || c.contactType}
                      </span>
                      {c.followUpRequired && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5">需跟进</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mb-1.5">{c.customerResponse}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        联系人：{c.contactPersonName}
                        <RoleBadge role={c.contactPersonRole as Role} />
                      </span>
                      <span>{c.createdAt}</span>
                    </div>

                    {problem && (
                      <div className="mt-2 bg-slate-50 rounded px-3 py-2 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-slate-500">关联问题件：</span>
                          <ProblemStatusBadge status={problem.status as any} />
                          <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                            {PROBLEM_TYPE_LABELS[problem.problemType as ProblemType] || problem.problemType}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          <span>责任人：{problem.responsiblePersonName}</span>
                          <span className="mx-2">|</span>
                          <span>报告人：{problem.reporterName}</span>
                          <span className="mx-2">|</span>
                          <span>描述：{problem.description}</span>
                        </div>
                      </div>
                    )}

                    {c.notes && (
                      <p className="text-xs text-slate-500 mt-1">备注：{c.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    <Link
                      to={`/problems/${c.problemRecordId}`}
                      className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                      查看问题件 <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
          {contacts.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">暂无联系记录</div>
          )}
        </div>
      </div>
    </div>
  )
}
