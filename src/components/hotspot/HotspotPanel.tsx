import { ChevronRight, Flame, MapPin, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const HotspotPanel = () => {
  const { hotspots, selectedHotspotId, setSelectedHotspot, complaints } = useAppStore();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'rising':
        return '上升';
      case 'declining':
        return '下降';
      default:
        return '平稳';
    }
  };

  const getHotspotComplaints = (hotspotId: string) => {
    return complaints.filter(c => c.hotspotId === hotspotId);
  };

  const sortedHotspots = [...hotspots].sort((a, b) => b.complaintCount - a.complaintCount);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            重复投诉热点
          </h2>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {hotspots.length} 个区域
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
        {sortedHotspots.map((hotspot, index) => {
          const hotspotComplaints = getHotspotComplaints(hotspot.id);
          const isSelected = selectedHotspotId === hotspot.id;
          const rank = index + 1;
          
          return (
            <div
              key={hotspot.id}
              onClick={() => setSelectedHotspot(isSelected ? null : hotspot.id)}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md ${
                isSelected
                  ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-300 ring-2 ring-orange-200'
                  : 'bg-white border-slate-200 hover:border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                  rank === 1 ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                  rank === 2 ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
                  rank === 3 ? 'bg-gradient-to-br from-amber-500 to-yellow-500' :
                  'bg-gradient-to-br from-slate-400 to-slate-500'
                }`}>
                  {rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{hotspot.name}</h3>
                    {getTrendIcon(hotspot.trend)}
                    <span className={`text-xs ${
                      hotspot.trend === 'rising' ? 'text-red-500' :
                      hotspot.trend === 'declining' ? 'text-green-500' :
                      'text-slate-500'
                    }`}>
                      {getTrendText(hotspot.trend)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs">半径 {hotspot.radius} 米</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (hotspot.complaintCount / 15) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-orange-600">
                      {hotspot.complaintCount}次
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-orange-100 space-y-2">
                      <p className="text-xs text-slate-500 mb-2">该区域历史投诉：</p>
                      {hotspotComplaints.map(c => (
                        <div
                          key={c.id}
                          className="text-xs text-slate-600 bg-white/80 px-2 py-1.5 rounded border border-orange-100 flex items-center justify-between"
                        >
                          <span className="truncate">{c.title}</span>
                          <span className="text-slate-400 font-mono flex-shrink-0 ml-2">{c.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                  isSelected ? 'rotate-90 text-orange-500' : ''
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>TOP3 区域占总投诉 {Math.round((hotspots.slice(0, 3).reduce((s, h) => s + h.complaintCount, 0) / hotspots.reduce((s, h) => s + h.complaintCount, 0)) * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
