import type { Communication } from '@/types';
import { MessageSquare, Phone, User as UserIcon } from 'lucide-react';

const methodConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  phone: { icon: <Phone size={12} />, color: 'text-blue-600', bg: 'bg-blue-50', label: '电话' },
  wechat: { icon: <MessageSquare size={12} />, color: 'text-green-600', bg: 'bg-green-50', label: '微信' },
  in_person: { icon: <UserIcon size={12} />, color: 'text-violet-600', bg: 'bg-violet-50', label: '到院' },
}

export default function CommunicationLog({ communications }: { communications: Communication[] }) {
  if (communications.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        暂无沟通记录
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {communications.map((comm) => {
        const mc = methodConfig[comm.method] || methodConfig.phone
        return (
          <div key={comm.id} className="bg-white rounded-lg border border-slate-200 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${mc.bg} ${mc.color}`}>
                {mc.icon}
                {mc.label}
              </span>
              <span className="text-xs font-mono text-slate-400">{comm.contact_at}</span>
            </div>
            <p className="text-sm text-slate-700 mb-1.5">{comm.content}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>记录人: {comm.contacted_by}</span>
              <span className="text-slate-600 font-medium">{comm.result}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
