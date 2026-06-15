import { InspectionFilter } from '@/components/business/InspectionFilter';
import { InspectionCard } from '@/components/business/InspectionCard';
import { useInspectionStore } from '@/store/useInspectionStore';
import { useUserStore } from '@/store/useUserStore';
import { Plus, LayoutGrid, List, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function InspectionList() {
  const { getFilteredInspections, setFilters } = useInspectionStore();
  const { currentRole } = useUserStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setFilters({ status: [status as any], onlyMine: false });
    }
    const action = searchParams.get('action');
    if (action === 'create') {
      setFilters({ status: undefined, onlyMine: false });
    }
  }, [searchParams]);

  const inspections = getFilteredInspections(currentRole);

  const roleSubtitle: Record<string, string> = {
    manager: '审核验机申请、处理争议、查看全量数据',
    dispatcher: '分配设备与司机、跟踪出场进度',
    technician: '执行出场验机、记录问题、维修处理',
    driver: '签收确认设备、查看验机结果',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">出场验机管理</h2>
          <p className="text-sm text-slate-500 mt-1">{roleSubtitle[currentRole] || '管理设备出场验机流程'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'grid' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <List size={16} />
            </button>
          </div>
          {currentRole === 'manager' && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors shadow-sm">
              <Plus size={16} />
              新建验机单
            </button>
          )}
        </div>
      </div>

      <InspectionFilter />

      {inspections.length > 0 ? (
        <div
          className={cn(
            'gap-4',
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
              : 'flex flex-col'
          )}
        >
          {inspections.map((inspection) => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <ClipboardList size={24} className="text-slate-400" />
          </div>
          <h3 className="text-base font-medium text-slate-700 mb-1">暂无验机记录</h3>
          <p className="text-sm text-slate-500">调整筛选条件或创建新的验机单</p>
        </div>
      )}
    </div>
  );
}
