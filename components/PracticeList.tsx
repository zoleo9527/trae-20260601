import { PracticeRecord, PracticeStatus } from '../types';

interface PracticeListProps {
  records: PracticeRecord[];
  onViewDetail: (record: PracticeRecord) => void;
  onHandle: (record: PracticeRecord) => void;
}

const statusConfig: Record<PracticeStatus, { label: string; className: string }> = {
  '待处理': { label: '待处理', className: 'bg-yellow-100 text-yellow-700' },
  '已确认': { label: '已确认', className: 'bg-blue-100 text-blue-700' },
  '已退回': { label: '已退回', className: 'bg-red-100 text-red-700' },
  '已完成': { label: '已完成', className: 'bg-green-100 text-green-700' },
};

export function PracticeList({ records, onViewDetail, onHandle }: PracticeListProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">陪练打卡记录</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {records.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">暂无记录</div>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-gray-800">{record.studentName}</span>
                    <span className="text-sm text-gray-500">{record.instrument}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[record.status].className}`}>
                      {statusConfig[record.status].label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="mr-4">📅 {record.practiceDate}</span>
                    <span className="mr-4">⏱️ {record.duration}分钟</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">练习内容：</span>{record.content}
                  </div>
                  {record.note && (
                    <div className="mt-1 text-sm text-primary-600">
                      <span className="font-medium">备注：</span>{record.note}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onViewDetail(record)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    查看
                  </button>
                  {record.status === '待处理' && (
                    <button
                      onClick={() => onHandle(record)}
                      className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      处理
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
