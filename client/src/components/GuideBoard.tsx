import { CheckCircle, Clock, AlertCircle, Eye } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import TourGroupCard from './TourGroupCard';

export default function GuideBoard() {
  const { tourGroups, dispatches, checkIns, fleetAssignments, guides, setSelectedTourGroupId, setCheckInModalOpen, setTimelineModalOpen } =
    useAppStore();

  const guideId = 'g4';
  const myDispatches = dispatches.filter((d) => d.guideId === guideId);
  const myTourGroupIds = myDispatches.map((d) => d.tourGroupId);
  const myTourGroups = tourGroups.filter((tg) => myTourGroupIds.includes(tg.id));

  const pendingCheckIns = myTourGroups.filter((tg) => {
    const ci = checkIns.find((c) => c.tourGroupId === tg.id);
    return ci?.checkInStatus === 'pending';
  });

  const completedCheckIns = myTourGroups.filter((tg) => {
    const ci = checkIns.find((c) => c.tourGroupId === tg.id);
    return ci?.checkInStatus === 'checked_in';
  });

  const exceptionCheckIns = myTourGroups.filter((tg) => {
    const ci = checkIns.find((c) => c.tourGroupId === tg.id);
    return ci?.checkInStatus === 'exception';
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-amber-100">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-800 tracking-tight">{pendingCheckIns.length}</div>
            <div className="text-sm text-amber-600 mt-0.5">待签到任务</div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-800 tracking-tight">{completedCheckIns.length}</div>
            <div className="text-sm text-emerald-600 mt-0.5">已签到</div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-red-100">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-800 tracking-tight">{exceptionCheckIns.length}</div>
            <div className="text-sm text-red-600 mt-0.5">异常上报</div>
          </div>
        </div>
      </div>

      {pendingCheckIns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            待签到任务
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              派遣已生成，请确认到达
            </span>
          </h3>
          <div className="space-y-3">
            {pendingCheckIns.map((tg) => {
              const dispatch = dispatches.find((d) => d.tourGroupId === tg.id);
              const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;
              const fleet = fleetAssignments.find((f) => f.tourGroupId === tg.id);
              return (
                <TourGroupCard
                  key={tg.id}
                  tourGroup={tg}
                  dispatch={dispatch}
                  checkIn={checkIns.find((ci) => ci.tourGroupId === tg.id)}
                  fleet={fleet}
                  guide={guide}
                  showActions
                  actionLabel="确认签到"
                  onAction={() => {
                    setSelectedTourGroupId(tg.id);
                    setCheckInModalOpen(true);
                  }}
                  onClick={() => {
                    setSelectedTourGroupId(tg.id);
                    setTimelineModalOpen(true);
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">全部任务</h3>
        <div className="space-y-3">
          {myTourGroups.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">暂无派遣任务</div>
          )}
          {myTourGroups.map((tg) => {
            const dispatch = dispatches.find((d) => d.tourGroupId === tg.id);
            const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;
            const checkIn = checkIns.find((ci) => ci.tourGroupId === tg.id);
            const fleet = fleetAssignments.find((f) => f.tourGroupId === tg.id);
            return (
              <TourGroupCard
                key={tg.id}
                tourGroup={tg}
                dispatch={dispatch}
                checkIn={checkIn}
                fleet={fleet}
                guide={guide}
                onClick={() => {
                  setSelectedTourGroupId(tg.id);
                  setTimelineModalOpen(true);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
