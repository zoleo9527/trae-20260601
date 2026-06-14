import React from 'react';
import { CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { formatDate } from './Common';

interface StatusLog {
  id: string;
  previousStatus?: string;
  newStatus: string;
  handlerName: string;
  handlerRole: string;
  reason: string;
  remark?: string;
  createdAt: string;
}

interface StatusTimelineProps {
  logs: StatusLog[];
  className?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ logs, className }) => {
  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      advisor: '招生顾问',
      coach: '教练',
      examiner: '考试专员',
      admin: '管理员',
    };
    return roleMap[role] || role;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      scheduled: '待确认',
      coach_confirmed: '教练已确认',
      hours_recorded: '学时已录',
      student_confirmed: '学员已确认',
      completed: '已完成',
      cancelled: '已取消',
      exception: '异常',
      pending: '待处理',
      confirmed: '已确认',
      paid: '已支付',
      settled: '已结算',
      refund_pending: '退款待审',
      refunded: '已退款',
      booked: '已预约',
      scored: '成绩已录',
      absent: '缺考',
      retest: '需补考',
    };
    return statusMap[status] || status;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">状态流转记录</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        <div className="space-y-6">
          {logs.map((log, index) => (
            <div key={log.id} className="relative pl-10">
              <div
                className={`absolute left-2 w-4 h-4 rounded-full border-2 bg-white ${
                  log.newStatus === 'exception' || log.newStatus === 'retest'
                    ? 'border-red-500 bg-red-100'
                    : log.newStatus === 'completed' || log.newStatus === 'settled'
                    ? 'border-green-500 bg-green-100'
                    : 'border-blue-500 bg-blue-100'
                }`}
              >
                {log.newStatus === 'exception' || log.newStatus === 'retest' ? (
                  <AlertCircle className="w-2 h-2 text-red-500 absolute top-0.5 left-0.5" />
                ) : log.newStatus === 'completed' || log.newStatus === 'settled' ? (
                  <CheckCircle className="w-2 h-2 text-green-500 absolute top-0.5 left-0.5" />
                ) : (
                  <Clock className="w-2 h-2 text-blue-500 absolute top-0.5 left-0.5" />
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {log.previousStatus && `${getStatusLabel(log.previousStatus)} → `}
                      {getStatusLabel(log.newStatus)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="w-4 h-4" />
                  <span>{log.handlerName}</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                    {getRoleLabel(log.handlerRole)}
                  </span>
                </div>

                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">原因：</span>
                  {log.reason}
                </div>

                {log.remark && (
                  <div className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded mt-2">
                    {log.remark}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
