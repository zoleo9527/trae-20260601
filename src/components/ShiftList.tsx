import { ChevronRight, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ShiftRecord } from '@/types';

interface ShiftListProps {
  shifts: ShiftRecord[];
}

const statusMap = {
  pending: { label: '待复核', class: 'badge-pending' },
  reviewing: { label: '复核中', class: 'badge-reviewing' },
  confirmed: { label: '已确认', class: 'badge-confirmed' },
};

export default function ShiftList({ shifts }: ShiftListProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">班结记录</h3>
        <p className="text-sm text-gray-500 mt-1">点击查看详细差异和进行复核操作</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">班结编号</th>
              <th className="table-header">收银员</th>
              <th className="table-header">班次时间</th>
              <th className="table-header">提交时间</th>
              <th className="table-header">差异项</th>
              <th className="table-header">状态</th>
              <th className="table-header">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shifts.map((shift) => {
              const pendingCount = shift.discrepancies.filter(
                (d) => d.status === 'pending' || d.status === 'reviewed'
              ).length;
              
              return (
                <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <span className="font-medium text-primary-900">{shift.shiftNo}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-700" />
                      </div>
                      <span>{shift.cashier}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{shift.startTime.slice(11)} - {shift.endTime.slice(11)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{shift.startTime.slice(0, 10)}</p>
                  </td>
                  <td className="table-cell text-gray-600">{shift.submitTime.slice(11)}</td>
                  <td className="table-cell">
                    {pendingCount > 0 ? (
                      <span className="badge bg-rose-50 text-rose-700 border border-rose-200">
                        {pendingCount} 项待处理
                      </span>
                    ) : (
                      <span className="badge bg-green-50 text-green-700 border border-green-200">
                        全部处理
                      </span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${statusMap[shift.status].class}`}>
                      {statusMap[shift.status].label}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => navigate(`/shift/${shift.id}`)}
                      className="inline-flex items-center gap-1 text-primary-900 hover:text-primary-700 font-medium text-sm transition-colors"
                    >
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
