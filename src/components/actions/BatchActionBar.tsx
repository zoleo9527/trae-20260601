import { Check, X, Tag, Square } from 'lucide-react';
import { useStore } from '@/store';
import { responsibilityNames, type ResponsibilityFlag } from '@/types';
import { useState } from 'react';

export function BatchActionBar() {
  const { selectedRecordIds, setSelectedRecords, batchConfirm, batchMarkResponsibility, records, currentRole } = useStore();
  const [showResponsibilityMenu, setShowResponsibilityMenu] = useState(false);
  
  if (selectedRecordIds.length === 0) return null;
  
  const selectedRecords = records.filter((r) => selectedRecordIds.includes(r.id));
  const canConfirm = currentRole === 'coach' && selectedRecords.every((r) => r.status === 'pending_coach_confirm');
  const canMarkResponsibility = currentRole === 'manager';
  
  const handleSelectAll = () => {
    const allIds = records.map((r) => r.id);
    setSelectedRecords(allIds);
  };
  
  const handleClear = () => {
    setSelectedRecords([]);
  };
  
  const handleBatchConfirm = () => {
    if (canConfirm) {
      batchConfirm(selectedRecordIds);
    }
  };
  
  const handleMarkResponsibility = (flag: ResponsibilityFlag) => {
    batchMarkResponsibility(selectedRecordIds, flag);
    setShowResponsibilityMenu(false);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-300">
            已选择 <span className="text-blue-400 font-bold">{selectedRecordIds.length}</span> 条记录
          </span>
          <button
            onClick={handleSelectAll}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <Square className="w-3.5 h-3.5" />
            全选
          </button>
          <button
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            取消选择
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {canConfirm && (
            <button
              onClick={handleBatchConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors"
            >
              <Check className="w-4 h-4" />
              批量确认
            </button>
          )}
          
          {canMarkResponsibility && (
            <div className="relative">
              <button
                onClick={() => setShowResponsibilityMenu(!showResponsibilityMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded transition-colors"
              >
                <Tag className="w-4 h-4" />
                批量标记责任
              </button>
              
              {showResponsibilityMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[140px]">
                  {(['none', 'reception', 'coach', 'both', 'unclear'] as ResponsibilityFlag[]).map((flag) => (
                    <button
                      key={flag}
                      onClick={() => handleMarkResponsibility(flag)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      {responsibilityNames[flag]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!canConfirm && !canMarkResponsibility && (
            <span className="text-sm text-slate-500">当前角色无可批量操作</span>
          )}
        </div>
      </div>
    </div>
  );
}
