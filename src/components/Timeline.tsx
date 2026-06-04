import { cn } from '@/lib/utils'
import type { Role } from '@/stores/appStore'

interface LogEntry {
  operatorRole: Role
  operatorName: string
  action: string
  detail: string
  createdAt: string
}

const roleLabels: Record<string, string> = {
  front_desk: '前台',
  doctor: '科室',
  reviewer: '审核',
}

const roleColors: Record<string, string> = {
  front_desk: 'bg-accent-50 text-accent-600 border-accent-200',
  doctor: 'bg-blue-50 text-blue-600 border-blue-200',
  reviewer: 'bg-purple-50 text-purple-600 border-purple-200',
}

const actionLabels: Record<string, string> = {
  create: '创建记录',
  divert: '提交导检分流',
  confirm: '确认接收',
  complete: '标记完成',
  reject: '审核驳回',
  approve: '审核通过',
  remind: '发送漏项提醒',
  close: '关闭漏项',
  upload_attachment: '上传附件',
}

interface TimelineProps {
  logs: LogEntry[]
}

export default function Timeline({ logs }: TimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-8 text-center">暂无操作记录</div>
    )
  }

  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-warm-300" />
      {logs.map((log, i) => (
        <div key={i} className="relative pb-6 last:pb-0">
          <div className="absolute -left-6 top-1.5 w-[18px] h-[18px] flex items-center justify-center">
            <div className={cn(
              'w-2.5 h-2.5 rounded-full border-2 border-white',
              i === 0 ? 'bg-primary' : 'bg-warm-400'
            )} />
          </div>
          <div className="ml-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
                roleColors[log.operatorRole] || 'bg-gray-50 text-gray-500 border-gray-200'
              )}>
                {roleLabels[log.operatorRole] || log.operatorRole}
              </span>
              <span className="text-sm font-medium text-gray-800">{log.operatorName}</span>
              <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
            </div>
            <div className="text-sm text-gray-700">{actionLabels[log.action] || log.action}</div>
            {log.detail && (
              <div className="text-xs text-gray-500 mt-0.5">{log.detail}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
