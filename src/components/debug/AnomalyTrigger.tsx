import { useState } from 'react';
import { Bug, Clock, AlertTriangle, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/store';

export function AnomalyTrigger() {
  const { records, simulateOverdue, simulateDispute, simulateDataInconsistency } = useStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id || '');
  
  const pendingRecords = records.filter((r) => r.status !== 'completed');
  
  if (pendingRecords.length === 0) return null;
  
  return (
    <div className="fixed bottom-20 left-6 z-30">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors w-full"
        >
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="font-medium">异常模拟工具</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-auto" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-auto" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">选择记录</label>
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {pendingRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.studentName} - {r.coachName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => simulateOverdue(selectedRecordId)}
                className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium rounded transition-colors"
              >
                <Clock className="w-3.5 h-3.5" />
                模拟超时（触发红色脉动）
              </button>
              
              <button
                onClick={() => simulateDispute(selectedRecordId)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium rounded transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                模拟争议（触发责任待澄清）
              </button>
              
              <button
                onClick={() => simulateDataInconsistency(selectedRecordId)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-xs font-medium rounded transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                模拟数据不一致
              </button>
            </div>
            
            <p className="text-xs text-slate-500 pt-1 border-t border-slate-700">
              点击按钮可直接验证异常提醒和流程处理
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
