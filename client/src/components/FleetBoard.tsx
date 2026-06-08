import { CheckCircle, Clock, AlertTriangle, Truck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FLEET_STATUS_LABELS } from '../types';
import type { FleetStatus } from '../types';

const fleetStatusStyles: Record<FleetStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  delayed: 'bg-amber-50 text-amber-700 border-amber-300',
};

export default function FleetBoard() {
  const { tourGroups, dispatches, checkIns, fleetAssignments, guides, confirmFleet } = useAppStore();

  const assignedFleet = fleetAssignments.filter((fa) => {
    const tg = tourGroups.find((t) => t.id === fa.tourGroupId);
    return tg && tg.status !== 'pending_dispatch';
  });

  const pendingCount = assignedFleet.filter((f) => f.fleetStatus === 'pending').length;
  const readyCount = assignedFleet.filter((f) => f.fleetStatus === 'ready').length;
  const delayedCount = assignedFleet.filter((f) => f.fleetStatus === 'delayed').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-slate-50">
            <Clock className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">{pendingCount}</div>
            <div className="text-sm text-slate-500 mt-0.5">待确认车辆</div>
          </div>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-emerald-50">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-800 tracking-tight">{readyCount}</div>
            <div className="text-sm text-emerald-600 mt-0.5">已就位</div>
          </div>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-amber-50">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-800 tracking-tight">{delayedCount}</div>
            <div className="text-sm text-amber-600 mt-0.5">延误</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">车辆排班</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">团号</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">行程名称</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">导游</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">车牌号</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">司机</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">状态</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {assignedFleet.map((fa) => {
                const tg = tourGroups.find((t) => t.id === fa.tourGroupId);
                const dispatch = dispatches.find((d) => d.tourGroupId === fa.tourGroupId);
                const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;
                return (
                  <tr key={fa.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{tg?.groupCode}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{tg?.tourName}</td>
                    <td className="px-4 py-3 text-slate-600">{guide?.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{fa.plateNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{fa.driverName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${fleetStatusStyles[fa.fleetStatus]}`}
                      >
                        {fa.fleetStatus === 'delayed' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse" />}
                        {FLEET_STATUS_LABELS[fa.fleetStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {fa.fleetStatus !== 'ready' && (
                        <button
                          onClick={() => confirmFleet(fa.tourGroupId)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1e3a5f] text-white hover:bg-[#2a4f7f] transition"
                        >
                          确认就位
                        </button>
                      )}
                      {fa.fleetStatus === 'ready' && (
                        <span className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          已确认
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
