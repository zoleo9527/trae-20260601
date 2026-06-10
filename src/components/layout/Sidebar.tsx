import { Flame, List } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ComplaintList } from '../complaint/ComplaintList';
import { HotspotPanel } from '../hotspot/HotspotPanel';

export const Sidebar = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="w-[400px] flex flex-col bg-white border-r border-slate-200 h-full">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'list'
              ? 'text-cyan-600 bg-cyan-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <List className="w-4 h-4" />
          投诉工单
          {activeTab === 'list' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-cyan-500 rounded-full" />
          )}
        </button>
        <div className="w-px bg-slate-200 my-2" />
        <button
          onClick={() => setActiveTab('hotspots')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all relative ${
            activeTab === 'hotspots'
              ? 'text-orange-600 bg-orange-50/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Flame className="w-4 h-4" />
          热点区域
          {activeTab === 'hotspots' && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-500 rounded-full" />
          )}
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'list' ? (
          <ComplaintList />
        ) : (
          <HotspotPanel />
        )}
      </div>
    </div>
  );
};
