import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Edit, History } from 'lucide-react';
import { EnrollmentStatus } from '@/types';

interface EnrollmentTaskListProps {
  onViewDetail?: (id: string) => void;
}

export function EnrollmentTaskList({ onViewDetail }: EnrollmentTaskListProps) {
  const { enrollments, currentUser } = useAppStore();

  const myEnrollments = enrollments.filter(
    (enrollment) => enrollment.departmentId === currentUser?.departmentId
  );

  const pendingEnrollments = myEnrollments.filter(
    (enrollment) => enrollment.status === EnrollmentStatus.PENDING
  );

  const confirmedEnrollments = myEnrollments.filter(
    (enrollment) => enrollment.status === EnrollmentStatus.CONFIRMED
  );

  const rejectedEnrollments = myEnrollments.filter(
    (enrollment) => enrollment.status === EnrollmentStatus.REJECTED
  );

  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'rejected'>('pending');

  const renderEnrollmentCard = (enrollment: any) => {
    const isOverdue = new Date(enrollment.deadline) < new Date() && enrollment.status === EnrollmentStatus.PENDING;

    return (
      <div
        key={enrollment.id}
        className={cn(
          'p-4 rounded-lg border transition-all hover:shadow-md',
          isOverdue
            ? 'border-red-200 bg-red-50'
            : enrollment.status === EnrollmentStatus.PENDING
            ? 'border-blue-200 bg-blue-50'
            : enrollment.status === EnrollmentStatus.CONFIRMED
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 flex-1">
            {enrollment.scheduleTitle}
          </h4>
          <div className="flex items-center gap-2">
            <StatusBadge status={enrollment.status} />
            {isOverdue && (
              <span className="text-xs text-red-600 font-medium">已逾期</span>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1 mb-1">
            <span className="font-medium">报名截止:</span>
            <span>{format(new Date(enrollment.deadline), 'MM-dd HH:mm')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">已报名:</span>
            <span>{enrollment.studentList.length}人</span>
          </div>
        </div>

        {enrollment.rejectedReason && enrollment.status === EnrollmentStatus.REJECTED && (
          <div className="mb-3 p-2 bg-white rounded border border-red-200">
            <p className="text-xs text-red-700">
              <span className="font-medium">退回原因:</span>
              {enrollment.rejectedReason}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onViewDetail?.(enrollment.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1 border border-gray-200"
          >
            <Edit className="w-3 h-3" />
            {enrollment.studentList.length === 0 ? '添加学员' : '编辑名单'}
          </button>
          {enrollment.studentList.length > 0 && (
            <button
              onClick={() => onViewDetail?.(enrollment.id)}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 border border-blue-200"
            >
              <History className="w-3 h-3" />
              历史
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">学员报名任务</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          待确认: {pendingEnrollments.length} | 
          已确认: {confirmedEnrollments.length} | 
          已退回: {rejectedEnrollments.length}
        </p>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            activeTab === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          待确认 ({pendingEnrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('confirmed')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            activeTab === 'confirmed'
              ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          已确认 ({confirmedEnrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={cn(
            'flex-1 px-4 py-2 text-xs font-medium transition-colors',
            activeTab === 'rejected'
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          已退回 ({rejectedEnrollments.length})
        </button>
      </div>

      <div className="p-4 space-y-3">
        {activeTab === 'pending' && (
          <>
            {pendingEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">暂无待确认的报名任务</p>
              </div>
            ) : (
              pendingEnrollments.map(renderEnrollmentCard)
            )}
          </>
        )}

        {activeTab === 'confirmed' && (
          <>
            {confirmedEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">暂无已确认的报名</p>
              </div>
            ) : (
              confirmedEnrollments.map(renderEnrollmentCard)
            )}
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            {rejectedEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">暂无已退回的报名</p>
              </div>
            ) : (
              rejectedEnrollments.map(renderEnrollmentCard)
            )}
          </>
        )}
      </div>
    </div>
  );
}
