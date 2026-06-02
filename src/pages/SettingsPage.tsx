import { useStore } from '@/store/useStore'
import { DEMO_USERS } from '@/data/seed'
import type { UserRole } from '@/types'
import {
  Download,
  GraduationCap,
  HardDriveUpload,
  RefreshCw,
  RotateCcw,
  Shield,
  Users,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react'
import { useRef, useState } from 'react'

const roleOptions: { value: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'admin', label: '管理员', icon: Shield, desc: '拥有全部操作权限' },
  { value: 'leader', label: '课题组负责人', icon: Users, desc: '查看本组占用情况' },
  { value: 'student', label: '学生', icon: GraduationCap, desc: '提交预约、登记样本' },
]

export default function SettingsPage() {
  const {
    currentRole,
    setRole,
    setCurrentUser,
    currentUserId,
    exportJSON,
    importJSON,
    exportCSV,
    resetData,
    instruments,
    reservations,
    samples,
    downtimes,
    notifications,
  } = useStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState('')

  const handleExportJSON = () => {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    a.download = `instrument-reservation-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csv = exportCSV()
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reservations.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    setImportError('')
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const ok = importJSON(content)
        if (!ok) {
          setImportError('数据格式不正确，请检查文件')
        } else {
          setImportError('')
          alert('数据导入成功！')
        }
      } catch {
        setImportError('文件读取失败')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleReset = () => {
    if (!confirm('确认重置所有数据？此操作不可恢复，建议先备份。')) return
    if (!confirm('再次确认：将清空所有预约、样本、停机记录，恢复到初始演示数据。')) return
    resetData()
    alert('数据已重置')
  }

  const availableUsers = DEMO_USERS.filter((u) => u.role === currentRole)
  const currentUser = DEMO_USERS.find((u) => u.id === currentUserId)

  const stats = [
    { label: '仪器数量', value: instruments.length },
    { label: '预约记录', value: reservations.length },
    { label: '样本记录', value: samples.length },
    { label: '停机记录', value: downtimes.length },
    { label: '通知记录', value: notifications.length },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">设置</h2>
        <p className="text-xs text-zinc-500 mt-1">角色切换、数据备份与导出</p>
      </div>

      <div className="rounded-lg border border-[#1e1e3a] bg-[#12122a] p-5">
        <h3 className="text-sm font-medium text-zinc-200 mb-4">当前角色</h3>
        <div className="grid grid-cols-3 gap-3">
          {roleOptions.map((opt) => {
            const Icon = opt.icon
            const isActive = currentRole === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setRole(opt.value)
                  const defaultUser = DEMO_USERS.find((u) => u.role === opt.value)
                  if (defaultUser) {
                    setCurrentUser(defaultUser.id)
                  }
                }}
                className={`rounded-lg border p-4 text-left transition-all ${
                  isActive
                    ? 'border-indigo-500/50 bg-indigo-950/30'
                    : 'border-[#1e1e3a] bg-[#0f0f1a] hover:bg-[#16162e]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon
                    size={14}
                    className={isActive ? 'text-indigo-400' : 'text-zinc-500'}
                  />
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-indigo-300' : 'text-zinc-300'
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">{opt.desc}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-[#1e1e3a]">
          <h4 className="text-xs text-zinc-500 mb-3">切换当前用户</h4>
          <div className="flex flex-wrap gap-2">
            {availableUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setCurrentUser(user.id)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  currentUserId === user.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#0f0f1a] border border-[#1e1e3a] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {user.name}
                <span className="text-[10px] text-zinc-500 ml-1">({user.group})</span>
              </button>
            ))}
          </div>
          {currentUser && (
            <div className="mt-3 text-xs text-zinc-500">
              当前登录：<span className="text-zinc-300">{currentUser.name}</span> ·{' '}
              <span className="text-zinc-400">{currentUser.group}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-[#1e1e3a] bg-[#12122a] p-5">
        <h3 className="text-sm font-medium text-zinc-200 mb-4">数据统计</h3>
        <div className="grid grid-cols-5 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-semibold text-zinc-200 mono">{s.value}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[#1e1e3a] bg-[#12122a] p-5">
        <h3 className="text-sm font-medium text-zinc-200 mb-4">数据管理</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileJson size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-zinc-200">导出备份</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">
              导出全部数据为 JSON 格式，包含所有仪器、预约、样本、停机和通知记录
            </p>
            <button
              onClick={handleExportJSON}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
            >
              <Download size={14} />
              导出 JSON
            </button>
          </div>

          <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDriveUpload size={14} className="text-blue-400" />
              <span className="text-xs font-medium text-zinc-200">导入恢复</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">
              从 JSON 备份文件恢复数据，将覆盖当前所有数据
            </p>
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
            >
              <RefreshCw size={14} />
              导入 JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            {importError && (
              <p className="text-[10px] text-red-400 mt-2">{importError}</p>
            )}
          </div>

          <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileSpreadsheet size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-zinc-200">导出预约记录</span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">
              导出所有预约记录为 CSV 格式，可用 Excel 打开
            </p>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
            >
              <Download size={14} />
              导出 CSV
            </button>
          </div>

          <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-xs font-medium text-red-300">重置数据</span>
            </div>
            <p className="text-[11px] text-red-400/70 mb-3">
              清空所有数据，恢复到初始演示状态。此操作不可恢复！
            </p>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
            >
              <RotateCcw size={14} />
              重置全部数据
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#1e1e3a] bg-[#12122a] p-5">
        <h3 className="text-sm font-medium text-zinc-200 mb-3">关于</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          学院公共仪器预约管理台 v1.0 — 专为仪器值班室设计的桌面工具。
          所有数据存储于浏览器本地（localStorage），定期导出 JSON 备份可防止数据丢失。
        </p>
        <p className="text-xs text-zinc-600 mt-2">
          数据存储位置：浏览器 localStorage · 存储键名：instrument-reservation-store
        </p>
      </div>
    </div>
  )
}
