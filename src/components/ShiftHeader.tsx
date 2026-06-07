import { ArrowLeft, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ShiftRecord } from '@/types';

interface ShiftHeaderProps {
  shift: ShiftRecord;
}

const statusConfig = {
  pending: { label: '待复核', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  reviewing: { label: '复核中', icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  confirmed: { label: '已确认', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
};

export default function ShiftHeader({ shift }: ShiftHeaderProps) {
  const navigate = useNavigate();
  const status = statusConfig[shift.status];
  const StatusIcon = status.icon;

  const pendingCount = shift.discrepancies.filter((d) => d.status === 'pending').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工作台
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">班结详情</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${status.bg} ${status.color}`}>
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </span>
            </div>
            <p className="text-gray-500 mt-1">班结编号：{shift.shiftNo}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{shift.discrepancies.length}</p>
              <p className="text-sm text-gray-500">差异项</p>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">待处理</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <User className="w-4 h-4" />
            收银员
          </div>
          <p className="font-semibold text-gray-900">{shift.cashier}</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            班次时间
          </div>
          <p className="font-semibold text-gray-900">{shift.startTime.slice(5, 16)} - {shift.endTime.slice(11, 16)}</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            提交时间
          </div>
          <p className="font-semibold text-gray-900">{shift.submitTime}</p>
        </div>
      </div>
    </div>
  );
}
