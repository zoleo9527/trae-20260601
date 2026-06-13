import { useState } from 'react'
import {
  ClipboardList,
  Calculator,
  Handshake,
  Users,
  Building2,
  DollarSign,
} from 'lucide-react'
import { useWorkbenchStore } from '@/store/useWorkbenchStore'
import { ROLE_LABELS } from '@/types'
import type { Role } from '@/types'
import TodoPanel from '@/components/TodoPanel'
import FilterBar from '@/components/FilterBar'
import RecordList from '@/components/RecordList'
import RecordDetail from '@/components/RecordDetail'

const tabs = [
  { key: 'todos' as const, label: '我的待办', icon: ClipboardList },
  { key: 'settlement' as const, label: '工资结算', icon: Calculator },
  { key: 'reconciliation' as const, label: '客户对账', icon: Handshake },
]

export default function Workbench() {
  const { activeTab, setActiveTab, currentRole, setCurrentRole } = useWorkbenchStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const roles: { key: Role; label: string; icon: typeof Users }[] = [
    { key: 'recruiter', label: ROLE_LABELS.recruiter, icon: Users },
    { key: 'onsite', label: ROLE_LABELS.onsite, icon: Building2 },
    { key: 'payroll', label: ROLE_LABELS.payroll, icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800">人力派遣 · 工资结算与客户对账</h1>
              <p className="text-[11px] text-gray-400">统一口径 · 全程留痕 · 责任可溯</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">当前角色:</span>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {roles.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setCurrentRole(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    currentRole === key
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0 ${
            sidebarCollapsed ? 'w-14' : 'w-72'
          }`}
        >
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {!sidebarCollapsed && <span className="text-sm font-semibold text-gray-700">待办面板</span>}
            </div>
            {!sidebarCollapsed && (
              <div className="flex border-b border-gray-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium border-b-2 transition-all ${
                        activeTab === tab.key
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!sidebarCollapsed && <TodoPanel />}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 pb-0">
            <FilterBar />
          </div>
          <div className="flex-1 flex overflow-hidden px-4 pb-4 gap-4">
            <div className="w-[420px] flex-shrink-0 overflow-y-auto">
              <RecordList />
            </div>
            <div className="flex-1 overflow-y-auto">
              <RecordDetail />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
