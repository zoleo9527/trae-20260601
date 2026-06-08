import { AlertTriangle, ClipboardList, Send, Clock, Eye, Siren, MessageSquarePlus, CheckCircle2 } from 'lucide-react';
import { useAppStore, calcStuckDuration, formatStuckDuration, isStuckOver24h } from '../store/useAppStore';
import StatCard from './StatCard';
import TourGroupCard from './TourGroupCard';
import FilterBar from './FilterBar';

export default function DispatcherBoard() {
  const { tourGroups, dispatches, checkIns, fleetAssignments, guides, filteredTourGroups, setSelectedTourGroupId, setDispatchPanelOpen, setTimelineModalOpen, setFollowUpModalOpen } =
    useAppStore();

  const pendingCount = tourGroups.filter((tg) => tg.status === 'pending_dispatch').length;
  const todayDispatchCount = tourGroups.filter((tg) => tg.status === 'dispatched').length;
  const stuckCount = tourGroups.filter((tg) => tg.status === 'stuck').length;

  const stuckGroups = tourGroups
    .filter((tg) => tg.status === 'stuck')
    .sort((a, b) => calcStuckDuration(b.stuckAt) - calcStuckDuration(a.stuckAt));
  const filtered = filteredTourGroups();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="待派遣行程"
          value={pendingCount}
          icon={<ClipboardList className="w-5 h-5" />}
          accent="text-blue-600"
        />
        <StatCard
          label="今日已派遣"
          value={todayDispatchCount}
          icon={<Send className="w-5 h-5" />}
          accent="text-[#1e3a5f]"
        />
        <StatCard
          label="异常预警"
          value={stuckCount}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="text-amber-600"
          pulse={stuckCount > 0}
        />
      </div>

      {stuckGroups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">异常预警</h3>
            <span className="text-xs text-amber-500 ml-auto">按卡住时长由长到短排列</span>
          </div>
          <div className="space-y-2">
            {stuckGroups.map((tg) => {
              const dispatch = dispatches.find((d) => d.tourGroupId === tg.id);
              const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;
              const checkIn = checkIns.find((ci) => ci.tourGroupId === tg.id);
              const over24h = isStuckOver24h(tg.stuckAt);
              const durationMs = calcStuckDuration(tg.stuckAt);
              const latestFollowUp = tg.followUps.length > 0 ? tg.followUps[tg.followUps.length - 1] : null;
              return (
                <div
                  key={tg.id}
                  className={`bg-white rounded-lg px-4 py-3 ${
                    over24h
                      ? 'border-2 border-red-400 shadow-red-100 shadow-sm'
                      : 'border border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {over24h && <Siren className="w-4 h-4 text-red-500 shrink-0" />}
                        <span className="text-sm font-medium text-slate-800 truncate">{tg.tourName}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{tg.groupCode} · {guide?.name || '未指派'}</span>
                        {checkIn?.exception && <span className="text-amber-700">⚠ {checkIn.exception}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        over24h
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-amber-100 text-amber-700 border border-amber-300'
                      }`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        卡住 {formatStuckDuration(durationMs)}
                      </span>
                    </div>
                  </div>
                  {latestFollowUp && (
                    <div className={`mt-2 text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
                      over24h ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      <MessageSquarePlus className="w-3 h-3 shrink-0" />
                      <span className="truncate">最近跟进：{latestFollowUp.content}</span>
                      <span className="shrink-0 text-slate-400 ml-1">{new Date(latestFollowUp.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        setSelectedTourGroupId(tg.id);
                        setFollowUpModalOpen(true);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                        over24h
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <MessageSquarePlus className="w-3.5 h-3.5" />
                      添加跟进
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTourGroupId(tg.id);
                        setFollowUpModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      标记已处理
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTourGroupId(tg.id);
                        setTimelineModalOpen(true);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                        over24h
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      查看详情
                    </button>
                    {tg.followUps.length > 0 && (
                      <span className="text-xs text-slate-400 ml-auto">{tg.followUps.length}条跟进</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <FilterBar />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">暂无匹配的行程记录</div>
        )}
        {filtered.map((tg) => {
          const dispatch = dispatches.find((d) => d.tourGroupId === tg.id);
          const checkIn = checkIns.find((ci) => ci.tourGroupId === tg.id);
          const fleet = fleetAssignments.find((f) => f.tourGroupId === tg.id);
          const guide = dispatch ? guides.find((g) => g.id === dispatch.guideId) : undefined;

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
              showActions={tg.status === 'pending_dispatch'}
              actionLabel="派遣导游"
              onAction={() => {
                setSelectedTourGroupId(tg.id);
                setDispatchPanelOpen(true);
              }}
              onFollowUp={tg.status === 'stuck' ? () => {
                setSelectedTourGroupId(tg.id);
                setFollowUpModalOpen(true);
              } : undefined}
              onResolve={tg.status === 'stuck' ? () => {
                setSelectedTourGroupId(tg.id);
                setFollowUpModalOpen(true);
              } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
