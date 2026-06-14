import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Filter,
  X,
  History,
  AlertOctagon,
  Zap,
  UserRound,
} from "lucide-react";
import { useAppStore } from "@/store";
import { STUCK_PRESET_FILTERS } from "@/constants";
import type { CostumeStatus, UserRole, SizeConfirmStatus } from "@/types";
import { cn, isNodeStuck, formatDateTime } from "@/utils";
import StatCard from "@/components/common/StatCard";
import CostumeCard from "@/components/costume/CostumeCard";
import Avatar from "@/components/common/Avatar";

const STATUS_FILTERS: { key: CostumeStatus | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "roster_pending", label: "待确认名单" },
  { key: "sizing_pending", label: "待录入尺码" },
  { key: "size_confirm_pending", label: "待确认尺码" },
  { key: "approval_pending", label: "待审批" },
  { key: "ordering", label: "订购中" },
  { key: "archived", label: "已归档" },
];

const ROLE_FILTERS: { key: UserRole | "all"; label: string }[] = [
  { key: "all", label: "全部责任人" },
  { key: "admin", label: "教务" },
  { key: "teacher", label: "舞蹈老师" },
  { key: "principal", label: "校长" },
];

const SIZE_CONFIRM_FILTERS: { key: SizeConfirmStatus | "all"; label: string }[] = [
  { key: "all", label: "全部尺码状态" },
  { key: "pending", label: "待确认尺码" },
  { key: "exception", label: "尺码异常" },
  { key: "confirmed", label: "已确认" },
];

export default function Home() {
  const navigate = useNavigate();
  const {
    costumes,
    filters,
    setFilters,
    resetFilters,
    getFilteredCostumes,
    getRecentCostumes,
    createCostume,
    recentStudents,
  } = useAppStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newClasses, setNewClasses] = useState("");

  const stats = useMemo(() => {
    const pending = costumes.filter(
      (c) =>
        c.status === "roster_pending" ||
        c.status === "sizing_pending" ||
        c.status === "size_confirm_pending"
    ).length;
    const inProgress = costumes.filter(
      (c) =>
        c.status !== "archived" &&
        c.status !== "roster_pending" &&
        c.status !== "sizing_pending" &&
        c.status !== "size_confirm_pending"
    ).length;
    const done = costumes.filter((c) => c.status === "archived").length;
    const hasException = costumes.filter((c) =>
      c.studentSizes.some((s) => s.confirmStatus === "exception")
    ).length;
    const stuckCount = costumes.filter((c) => isNodeStuck(c)).length;
    return { pending, inProgress, done, hasException, stuckCount, total: costumes.length };
  }, [costumes]);

  const filtered = getFilteredCostumes();
  const recent = getRecentCostumes();

  const handleCreate = () => {
    if (!newName.trim()) return;
    const c = createCostume({
      name: newName.trim(),
      performanceDate: newDate,
      classes: newClasses.trim(),
    });
    setNewName("");
    setNewDate("");
    setNewClasses("");
    setShowCreate(false);
    useAppStore.getState().addRecentOpened(c.id);
    window.location.href = `/costumes/${c.id}`;
  };

  const hasAnyFilter =
    filters.status ||
    filters.assigneeRole ||
    filters.stuckPreset ||
    filters.sizeConfirmStatus ||
    (filters.keyword && filters.keyword.trim());

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink-900">工作台</h1>
          <p className="text-sm text-ink-500 mt-1">
            追踪演出服装全流程进度 · 明确责任人和每个节点的时间线
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          <Plus size={16} />
          新建演出服装任务
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="待处理（需行动）"
          value={stats.pending}
          icon={<Clock size={20} />}
          tone="ochre"
          onClick={() =>
            setFilters({
              status: "roster_pending",
              assigneeRole: undefined,
              keyword: undefined,
              stuckPreset: undefined,
              sizeConfirmStatus: undefined,
            })
          }
        />
        <StatCard
          label="超时卡住"
          value={stats.stuckCount}
          icon={<AlertOctagon size={20} />}
          tone="wine"
          onClick={() =>
            setFilters({
              stuckPreset: "stuck_any",
              status: undefined,
              assigneeRole: undefined,
              keyword: undefined,
              sizeConfirmStatus: undefined,
            })
          }
        />
        <StatCard
          label="进行中"
          value={stats.inProgress}
          icon={<Loader2 size={20} />}
          tone="wine"
        />
        <StatCard
          label="已完成归档"
          value={stats.done}
          icon={<CheckCircle2 size={20} />}
          tone="forest"
        />
        <StatCard
          label="含尺码异常"
          value={stats.hasException}
          icon={<AlertTriangle size={20} />}
          tone="gold"
          onClick={() =>
            setFilters({
              sizeConfirmStatus: "exception",
              status: undefined,
              assigneeRole: undefined,
              keyword: undefined,
              stuckPreset: undefined,
            })
          }
        />
      </div>

      {recent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-wine-700" />
            <h2 className="font-serif text-lg font-semibold text-ink-800">最近打开</h2>
            <span className="text-xs text-ink-400">（最多保留 5 条）</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {recent.map((c) => (
              <CostumeCard key={c.id} costume={c} compact />
            ))}
          </div>
        </section>
      )}

      {recentStudents.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <UserRound size={16} className="text-ochre-700" />
            <h2 className="font-serif text-lg font-semibold text-ink-800">最近查看学生</h2>
            <span className="text-xs text-ink-400">（最多保留 10 条）</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {recentStudents.map((r) => {
              const costume = costumes.find((c) => c.id === r.costumeId);
              if (!costume) return null;
              const student = costume.studentSizes.find((s) => s.id === r.studentId);
              if (!student) return null;
              return (
                <div
                  key={`${r.costumeId}-${r.studentId}`}
                  onClick={() => navigate(`/costumes/${r.costumeId}/student/${r.studentId}`)}
                  className="card card-hover p-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar name={r.studentName} role="teacher" size="sm" />
                    <span className="font-medium text-sm text-ink-800 truncate">{r.studentName}</span>
                  </div>
                  <p className="text-xs text-ink-500 truncate">{costume.name}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-ink-400">
                    <span>{formatDateTime(r.timestamp)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard size={16} className="text-wine-700" />
          <h2 className="font-serif text-lg font-semibold text-ink-800">
            全部任务 <span className="text-sm font-normal text-ink-400">（{filtered.length}）</span>
          </h2>
        </div>

        <div className="card p-4 mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                className="input pl-9"
                placeholder="搜索演出名称、班级、处理人..."
                value={filters.keyword || ""}
                onChange={(e) => setFilters({ keyword: e.target.value })}
              />
            </div>
            {hasAnyFilter && (
              <button
                onClick={resetFilters}
                className="btn btn-ghost text-sm text-ink-500"
              >
                <X size={14} />
                清除筛选
              </button>
            )}
          </div>

          <div className="divider" />

          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Zap size={14} className="text-ochre-600 shrink-0" />
              <span className="text-xs text-ink-500 shrink-0 w-14">快捷筛选</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilters({ stuckPreset: undefined, sizeConfirmStatus: undefined })}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs border transition-all",
                    !filters.stuckPreset && !filters.sizeConfirmStatus
                      ? "bg-ochre-700 text-white border-ochre-700 shadow-sm"
                      : "bg-white text-ink-600 border-cream-300 hover:border-ochre-300 hover:text-ochre-700"
                  )}
                >
                  不筛选
                </button>
                {STUCK_PRESET_FILTERS.map((f) => {
                  const active = filters.stuckPreset === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() =>
                        setFilters({
                          stuckPreset: active ? undefined : f.key,
                          sizeConfirmStatus: undefined,
                        })
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        active
                          ? "bg-ochre-700 text-white border-ochre-700 shadow-sm"
                          : "bg-white text-ink-600 border-cream-300 hover:border-ochre-300 hover:text-ochre-700"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-ink-400 shrink-0" />
              <span className="text-xs text-ink-500 shrink-0 w-14">按状态</span>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map((f) => {
                  const active = filters.status === f.key || (!filters.status && f.key === "all");
                  return (
                    <button
                      key={f.key}
                      onClick={() =>
                        setFilters({ status: f.key === "all" ? undefined : (f.key as CostumeStatus) })
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        active
                          ? "bg-wine-700 text-white border-wine-700 shadow-sm"
                          : "bg-white text-ink-600 border-cream-300 hover:border-wine-300 hover:text-wine-700"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-ink-400 shrink-0" />
              <span className="text-xs text-ink-500 shrink-0 w-14">按责任人</span>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_FILTERS.map((f) => {
                  const active =
                    filters.assigneeRole === f.key ||
                    (!filters.assigneeRole && f.key === "all");
                  return (
                    <button
                      key={f.key}
                      onClick={() =>
                        setFilters({
                          assigneeRole: f.key === "all" ? undefined : (f.key as UserRole),
                        })
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        active
                          ? "bg-wine-700 text-white border-wine-700 shadow-sm"
                          : "bg-white text-ink-600 border-cream-300 hover:border-wine-300 hover:text-wine-700"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} className="text-ink-400 shrink-0" />
              <span className="text-xs text-ink-500 shrink-0 w-14">按尺码</span>
              <div className="flex flex-wrap gap-1.5">
                {SIZE_CONFIRM_FILTERS.map((f) => {
                  const active =
                    filters.sizeConfirmStatus === f.key ||
                    (!filters.sizeConfirmStatus && f.key === "all");
                  return (
                    <button
                      key={f.key}
                      onClick={() =>
                        setFilters({
                          sizeConfirmStatus:
                            f.key === "all" ? undefined : (f.key as SizeConfirmStatus),
                        })
                      }
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border transition-all",
                        active
                          ? "bg-forest-700 text-white border-forest-700 shadow-sm"
                          : "bg-white text-ink-600 border-cream-300 hover:border-forest-300 hover:text-forest-700"
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <LayoutDashboard size={40} className="mx-auto text-ink-200 mb-3" />
            <p className="text-ink-400 text-sm">暂无匹配的演出服装任务</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <CostumeCard key={c.id} costume={c} />
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          />
          <div className="relative card w-full max-w-md p-6 shadow-card-hover">
            <h3 className="font-serif text-lg font-semibold text-ink-900 mb-4">
              新建演出服装任务
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">演出名称 *</label>
                <input
                  autoFocus
                  className="input"
                  placeholder="如：2026 暑期汇演·少儿芭蕾《天鹅湖》"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">演出日期</label>
                <input
                  type="date"
                  className="input"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label">关联班级</label>
                <input
                  className="input"
                  placeholder="如：少儿芭蕾初级A班、B班"
                  value={newClasses}
                  onChange={(e) => setNewClasses(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost">
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建任务
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
