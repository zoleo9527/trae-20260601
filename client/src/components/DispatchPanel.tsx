import { useState } from 'react';
import { X, UserCheck, ArrowRight, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function DispatchPanel() {
  const { dispatchPanelOpen, setDispatchPanelOpen, tourGroups, dispatches, guides, selectedTourGroupId, dispatchGuide } =
    useAppStore();
  const [selectedGuideId, setSelectedGuideId] = useState<string>('');
  const [dispatched, setDispatched] = useState(false);

  const tourGroup = tourGroups.find((tg) => tg.id === selectedTourGroupId);
  const existingDispatch = dispatches.find((d) => d.tourGroupId === selectedTourGroupId);
  const selectedGuide = guides.find((g) => g.id === selectedGuideId);
  const availableGuides = guides.filter((g) => g.status === 'available');

  if (!dispatchPanelOpen || !tourGroup) return null;

  const handleDispatch = () => {
    if (!selectedGuideId) return;
    dispatchGuide(tourGroup.id, selectedGuideId);
    setDispatched(true);
  };

  const handleClose = () => {
    setDispatchPanelOpen(false);
    setSelectedGuideId('');
    setDispatched(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative ml-auto w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {dispatched ? '派遣成功 → 签到预览' : '导游派遣'}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!dispatched ? (
            <>
              <div className="mb-6">
                <div className="text-xs text-slate-400 font-mono mb-1">{tourGroup.groupCode}</div>
                <div className="text-base font-semibold text-slate-800">{tourGroup.tourName}</div>
                <div className="text-sm text-slate-500 mt-1">{tourGroup.route}</div>
                <div className="text-sm text-slate-500 mt-1">出团日期：{tourGroup.tourDate}</div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">选择导游</label>
                <select
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                >
                  <option value="">请选择可用导游…</option>
                  {availableGuides.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} · {g.phone}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGuide && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                  <div className="text-sm font-medium text-slate-700">导游信息</div>
                  <div className="mt-2 space-y-1 text-sm text-slate-600">
                    <div>姓名：{selectedGuide.name}</div>
                    <div>电话：{selectedGuide.phone}</div>
                    <div>状态：{selectedGuide.status === 'available' ? '可派遣' : '忙碌'}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">派遣成功</h3>
              <p className="text-sm text-slate-500 mb-6">导游将自动收到签到任务，无需额外通知</p>

              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <UserCheck className="w-5 h-5 text-[#1e3a5f]" />
                  <div>
                    <div className="font-medium text-slate-800">
                      {guides.find((g) => g.id === existingDispatch?.guideId || selectedGuideId)?.name}
                    </div>
                    <div className="text-xs text-slate-500">导游端已生成待签到任务</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">已派遣</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">待签到</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium">已签到</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {!dispatched && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleDispatch}
              disabled={!selectedGuideId}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all bg-[#1e3a5f] text-white hover:bg-[#2a4f7f] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              确认派遣
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
