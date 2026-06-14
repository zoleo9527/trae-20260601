import React from 'react';
import { Car, CreditCard, FileText, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Card, StatusBadge, PriorityBadge, formatDate, formatCurrency } from './Common';

interface TodoItem {
  id: string;
  type: 'training' | 'payment' | 'exam';
  studentId: string;
  studentName: string;
  status: string;
  statusText: string;
  createdAt: string;
  priority: 'normal' | 'urgent';
  extra?: any;
}

interface TodoCardProps {
  todo: TodoItem;
  onClick?: () => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({ todo, onClick }) => {
  const getIcon = () => {
    switch (todo.type) {
      case 'training':
        return <Car className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'exam':
        return <FileText className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const typeColors = {
    training: 'bg-blue-50 text-blue-600',
    payment: 'bg-green-50 text-green-600',
    exam: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card onClick={onClick} className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeColors[todo.type]}`}>{getIcon()}</div>
          <div>
            <h4 className="font-semibold text-gray-900">{todo.studentName}</h4>
            <p className="text-sm text-gray-500">{todo.statusText}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={todo.status} />
          {todo.priority === 'urgent' && <PriorityBadge priority={todo.priority} />}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600">
        {todo.type === 'training' && todo.extra && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>预约时间：{formatDate(todo.extra.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span>预约学时：{todo.extra.hours}小时</span>
            </div>
            {todo.extra.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>场地：{todo.extra.location}</span>
              </div>
            )}
            {todo.extra.exceptionReason && (
              <div className="flex items-start gap-2 bg-red-50 p-2 rounded mt-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-xs">{todo.extra.exceptionReason}</span>
              </div>
            )}
          </>
        )}

        {todo.type === 'payment' && todo.extra && (
          <>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>费用类型：{getPaymentTypeLabel(todo.extra.paymentType)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-gray-900">
                {formatCurrency(todo.extra.amount)}
              </span>
            </div>
            {todo.extra.refundReason && (
              <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded mt-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span className="text-yellow-700 text-xs">{todo.extra.refundReason}</span>
              </div>
            )}
          </>
        )}

        {todo.type === 'exam' && todo.extra && (
          <>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>考试科目：{todo.extra.examType}</span>
            </div>
            {todo.extra.scheduledDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>考试时间：{formatDate(todo.extra.scheduledDate)}</span>
              </div>
            )}
            {todo.extra.retestFee && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-red-600">
                  补考费：{formatCurrency(todo.extra.retestFee)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
        创建时间：{formatDate(todo.createdAt)}
      </div>
    </Card>
  );
};

function getPaymentTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    registration: '报名费',
    training: '学时费',
    retest: '补考费',
    reinstatement: '补训费',
    refund: '退款',
  };
  return typeMap[type] || type;
}
