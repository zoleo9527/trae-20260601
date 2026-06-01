import type { Order } from '@/types';
import { Heart, Microscope, Pill, ToggleLeft, ToggleRight } from 'lucide-react';

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  medication: { icon: <Pill size={14} />, color: 'text-blue-600', bg: 'bg-blue-50', label: '用药医嘱' },
  nursing: { icon: <Heart size={14} />, color: 'text-pink-600', bg: 'bg-pink-50', label: '护理医嘱' },
  examination: { icon: <Microscope size={14} />, color: 'text-violet-600', bg: 'bg-violet-50', label: '检查医嘱' },
}

export default function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        暂无医嘱
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {orders.map((order) => {
        const tc = typeConfig[order.type] || typeConfig.medication
        return (
          <div
            key={order.id}
            className={`flex items-center justify-between bg-white rounded-lg border p-3.5 ${
              order.is_active ? 'border-slate-200' : 'border-slate-100 opacity-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg ${tc.bg} ${tc.color} flex items-center justify-center shrink-0 mt-0.5`}>
                {tc.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${tc.bg} ${tc.color}`}>
                    {tc.label}
                  </span>
                  {!order.is_active && (
                    <span className="text-xs text-slate-400 line-through">已停用</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{order.content}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>频次: {order.frequency}</span>
                  <span>·</span>
                  <span>{order.prescribed_by}</span>
                  <span className="font-mono">{order.prescribed_at}</span>
                </div>
              </div>
            </div>
            {order.is_active ? (
              <ToggleRight size={20} className="text-vet-teal shrink-0" />
            ) : (
              <ToggleLeft size={20} className="text-slate-300 shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}
