import { useStore } from '@/store';
import { RecordCard } from './RecordCard';
import { Filter, List } from 'lucide-react';
import type { RecordStatus } from '@/types';
import { statusNames } from '@/types';

export function RecordList() {
  const { getFilteredRecords, selectedRecordIds, filterStatus, setFilterStatus } = useStore();
  const records = getFilteredRecords();
  
  const statusOptions: (RecordStatus | 'all')[] = [
    'all',
    'pending_coach_confirm',
    'pending_reception_handle',
    'pending_manager_audit',
    'disputed',
    'completed'
  ];
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-semibold text-slate-100">排班与课时记录</h2>
          <span className="text-sm text-slate-500">({records.length})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as RecordStatus | 'all')}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? '全部状态' : statusNames[status]}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <List className="w-12 h-12 mb-3 opacity-50" />
            <p>暂无记录</p>
          </div>
        ) : (
          records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              isSelected={selectedRecordIds.includes(record.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
