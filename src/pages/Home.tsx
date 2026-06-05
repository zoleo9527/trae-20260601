import { BatchActionBar } from '@/components/actions/BatchActionBar';
import { AnomalyTrigger } from '@/components/debug/AnomalyTrigger';
import { TopBar } from '@/components/layout/TopBar';
import { RecordDetailPanel } from '@/components/records/RecordDetailPanel';
import { RecordList } from '@/components/records/RecordList';
import { isRecordVisible, useStore } from '@/store';
import { useEffect } from 'react';

export default function Home() {
  const { showDetailPanel, currentRole, filterStatus, selectedRecordIds, activeRecordId, records, setSelectedRecords, setActiveRecord, setShowDetailPanel } = useStore();
  
  useEffect(() => {
    const visibleIds = records.filter((r) => isRecordVisible(r, currentRole, filterStatus)).map((r) => r.id);
    const validSelectedIds = selectedRecordIds.filter((id) => visibleIds.includes(id));
    if (validSelectedIds.length !== selectedRecordIds.length) {
      setSelectedRecords(validSelectedIds);
    }
    if (activeRecordId && !visibleIds.includes(activeRecordId)) {
      setActiveRecord(null);
      setShowDetailPanel(false);
    }
  }, [currentRole, filterStatus, records, selectedRecordIds, activeRecordId, setSelectedRecords, setActiveRecord, setShowDetailPanel]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <TopBar />
      
      <main className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 p-4 flex-shrink-0">
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <h3 className="text-sm font-semibold text-slate-200 mb-2">📋 使用说明</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• 切换顶部角色查看不同待办</li>
                <li>• 点击卡片查看详情并处理</li>
                <li>• 勾选卡片可批量操作</li>
                <li>• 左下角可模拟异常场景</li>
              </ul>
            </div>
            
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h3 className="text-sm font-semibold text-amber-400 mb-2">⚠️ 责任标记规则</h3>
              <ul className="text-xs text-amber-300/80 space-y-1.5">
                <li>• 退回 ≥2 次自动标记风险</li>
                <li>• 双方备注不一致触发</li>
                <li>• 店长可最终认定责任</li>
              </ul>
            </div>
            
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-400 mb-2">🎯 流程节点</h3>
              <ul className="text-xs text-purple-300/80 space-y-1.5">
                <li><span className="text-amber-400">●</span> 待教练确认</li>
                <li><span className="text-orange-400">●</span> 待前台处理</li>
                <li><span className="text-red-400">●</span> 待店长仲裁</li>
                <li><span className="text-purple-400">●</span> 有争议</li>
                <li><span className="text-emerald-400">●</span> 已完成</li>
              </ul>
            </div>
          </div>
        </aside>
        
        <section className={`flex-1 p-6 overflow-hidden transition-all duration-300 ${showDetailPanel ? 'pr-[500px]' : ''}`}>
          <div className="h-full max-w-4xl mx-auto">
            <RecordList />
          </div>
        </section>
      </main>
      
      <RecordDetailPanel />
      <BatchActionBar />
      <AnomalyTrigger />
      
      {selectedRecordIds.length > 0 && <div className="h-16" />}
    </div>
  );
}
