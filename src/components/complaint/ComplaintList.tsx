import { CheckCircle, Clock, Flame, List, Loader, XCircle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ComplaintCard } from './ComplaintCard';

export const ComplaintList = () => {
  const { getFilteredComplaints, statusFilter, setStatusFilter } = useAppStore();
  const complaints = getFilteredComplaints();

  const statusFilters = [
    { key: 'all', label: '全部', icon: List },
    { key: 'pending', label: '待派单', icon: Clock },
    { key: 'assigned', label: '已派单', icon: Loader },
    { key: 'processing', label: '处理中', icon: Loader },
    { key: 'completed', label: '待关闭', icon: CheckCircle },
    { key: 'closed', label: '已关闭', icon: XCircle }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <List className="w-4 h-4 text-cyan-600" />
            投诉工单列表
          </h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {complaints.length} 条
          </span>
        </div>
        
        <div className="flex gap-1 flex-wrap">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <List className="w-8 h-8" />
            </div>
            <p className="text-sm">暂无投诉工单</p>
          </div>
        ) : (
          complaints.map((complaint, index) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              index={index}
            />
          ))
        )}
      </div>

      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>本月共处理 {complaints.filter(c => c.status === 'closed').length} 单投诉</span>
        </div>
      </div>
    </div>
  );
};
