import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TimelineItem {
  id: string;
  action: string;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: Date;
  createdBy: {
    name: string;
    role: string;
  };
}

const actionLabels: Record<string, string> = {
  BOOKING_CREATED: '创建预约',
  BOOKING_UPDATED: '更新预约',
  BOOKING_SUBMITTED: '提交审核',
  BOOKING_CONFIRMED: '确认预约',
  BOOKING_RESCHEDULED: '改期',
  BOOKING_SUPPLEMENTED: '补录人员',
  BOOKING_REJECTED: '驳回预约',
  BOOKING_COMPLETED: '完成体检',
  BOOKING_CANCELLED: '取消预约',
  PERSONNEL_IMPORTED: '导入人员',
  PERSONNEL_UPDATED: '更新人员',
  PERSONNEL_DELETED: '删除人员',
  EXCEPTION_ADDED: '添加异常',
  DATA_RESET: '重置数据',
};

const actionColors: Record<string, string> = {
  BOOKING_CREATED: 'bg-blue-500',
  BOOKING_UPDATED: 'bg-gray-500',
  BOOKING_SUBMITTED: 'bg-yellow-500',
  BOOKING_CONFIRMED: 'bg-green-500',
  BOOKING_RESCHEDULED: 'bg-orange-500',
  BOOKING_SUPPLEMENTED: 'bg-purple-500',
  BOOKING_REJECTED: 'bg-red-500',
  BOOKING_COMPLETED: 'bg-green-600',
  BOOKING_CANCELLED: 'bg-gray-600',
  PERSONNEL_IMPORTED: 'bg-indigo-500',
  PERSONNEL_UPDATED: 'bg-gray-500',
  PERSONNEL_DELETED: 'bg-red-400',
  EXCEPTION_ADDED: 'bg-red-500',
  DATA_RESET: 'bg-gray-700',
};

export default function Timeline({ items }: { items: TimelineItem[] }) {
  const sortedItems = [...items].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sortedItems.map((item, index) => (
          <li key={item.id}>
            <div className="relative pb-8">
              {index < sortedItems.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${actionColors[item.action] || 'bg-gray-500'}`}>
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
                <div className="flex-1 min-w-0 bg-white rounded-md p-4 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {actionLabels[item.action] || item.action}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                      {item.oldValue && item.newValue && (
                        <div className="mt-2 flex items-center space-x-2 text-sm">
                          <span className="text-gray-500">变更：</span>
                          <span className="text-red-500 line-through">{item.oldValue}</span>
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                          <span className="text-green-600 font-medium">{item.newValue}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {format(new Date(item.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.createdBy.name}
                        <span className="mx-1">·</span>
                        {item.createdBy.role === 'ADMIN' ? '管理员' : '前台'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
