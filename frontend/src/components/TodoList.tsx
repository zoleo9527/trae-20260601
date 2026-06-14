import { useState } from 'react';
import { ExamTrackRecord, ExamTrackStatus, UserRole } from '../types';
import { getStatusLabel, getStatusColor, formatDate, getTrackTypeLabel } from '../utils';
import { RecordDetailDrawer } from './RecordDetailDrawer';

interface TodoListProps {
  records: ExamTrackRecord[];
  currentRole: UserRole;
  onRefresh: () => void;
}

export const TodoList = ({ records, currentRole, onRefresh }: TodoListProps) => {
  const [selectedRecord, setSelectedRecord] = useState<ExamTrackRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const getTodoRecords = () => {
    if (currentRole === UserRole.TEACHER) {
      return records.filter(r => 
        r.status === ExamTrackStatus.DRAFT ||
        r.status === ExamTrackStatus.REJECTED ||
        r.status === ExamTrackStatus.IN_PRACTICE
      );
    }
    if (currentRole === UserRole.ADMIN) {
      return records.filter(r =>
        r.status === ExamTrackStatus.SUBMITTED_BY_TEACHER ||
        r.status === ExamTrackStatus.REVIEWING_BY_ADMIN ||
        r.status === ExamTrackStatus.COMPLETED
      );
    }
    if (currentRole === UserRole.CONSULTANT) {
      return records.filter(r =>
        r.status === ExamTrackStatus.IN_PRACTICE ||
        r.status === ExamTrackStatus.COMPLETED
      );
    }
    return records;
  };

  const todoRecords = getTodoRecords();

  const handleViewDetail = (record: ExamTrackRecord) => {
    setSelectedRecord(record);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRecord(null);
    onRefresh();
  };

  if (todoRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-gray-500">暂无待办任务</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {todoRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetail(record)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-semibold text-gray-900">{record.studentName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                    {getStatusLabel(record.status)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">乐器:</span>
                    {record.instrument}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">级别:</span>
                    {record.examLevel}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">曲目:</span>
                    {record.trackName}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${record.trackType === 'required' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {getTrackTypeLabel(record.trackType)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">进度:</span>
                  <div className="flex-1 max-w-xs">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${record.practicePlan.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{record.practicePlan.progress}%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">更新时间</div>
                <div className="text-xs text-gray-500">{formatDate(record.updatedAt)}</div>
              </div>
            </div>
            
            {record.rejectReason && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="text-xs font-medium text-red-700 mb-1">退回原因</div>
                <p className="text-sm text-red-600">{record.rejectReason}</p>
              </div>
            )}
            
            {record.supplementNotes && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-xs font-medium text-purple-700 mb-1">补充备注</div>
                <p className="text-sm text-purple-600">{record.supplementNotes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isDrawerOpen && selectedRecord && (
        <RecordDetailDrawer
          record={selectedRecord}
          currentRole={currentRole}
          onClose={handleCloseDrawer}
        />
      )}
    </>
  );
};
