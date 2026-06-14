import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  Calendar,
  Users,
  Wallet,
  GraduationCap,
  FileText,
  Clock,
  UserRound,
  MessageSquareText,
  AlertOctagon,
  Timer,
} from "lucide-react";
import { useAppStore } from "@/store";
import { STATUS_META, ROLE_META } from "@/constants";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  getDaysInCurrentNode,
  isNodeStuck,
  getStuckDays,
  formatDurationDays,
} from "@/utils";
import StatusBadge from "@/components/common/StatusBadge";
import Avatar from "@/components/common/Avatar";
import RoleBadge from "@/components/common/RoleBadge";
import Timeline from "@/components/common/Timeline";
import SizeTable from "@/components/costume/SizeTable";
import SizeHistoryModal from "@/components/costume/SizeHistoryModal";
import ActionBar from "@/components/costume/ActionBar";

export default function CostumeDetail() {
  const { id = "" } = useParams();
  const { getCostumeById, addRecentOpened, sizeHistoryStudentId } = useAppStore();
  const costume = getCostumeById(id);

  useEffect(() => {
    if (id) addRecentOpened(id);
  }, [id, addRecentOpened]);

  if (!costume) {
    return <Navigate to="/" replace />;
  }

  const meta = STATUS_META[costume.status];
  const roleMeta = ROLE_META[costume.currentAssigneeRole];
  const exceptionCount = costume.studentSizes.filter(
    (s) => s.confirmStatus === "exception"
  ).length;
  const daysInNode = getDaysInCurrentNode(costume);
  const stuck = isNodeStuck(costume);
  const stuckDays = getStuckDays(costume);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 pb-32">
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-2xl font-semibold text-ink-900">
            {costume.name}
          </h1>
          <StatusBadge status={costume.status} />
          {stuck && (
            <span className="chip bg-wine-50 text-wine-700 border-wine-300 text-xs">
              <AlertOctagon size={12} />
              此节点超时 {stuckDays} 天，需关注
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-ink-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            演出日期：{formatDate(costume.performanceDate) || "—"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            服装套数：{costume.totalSets}
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet size={14} />
            预算：{formatCurrency(costume.budget)}
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap size={14} />
            班级：{costume.classes || "—"}
          </span>
          <span className={cn("flex items-center gap-1.5 chip border-dashed", roleMeta.color)}>
            <Timer size={12} />
            此节点已停留 {formatDurationDays(daysInNode)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={cn("card p-4", stuck && "ring-1 ring-wine-300 bg-wine-50/40")}>
              <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                <Clock size={12} />
                当前节点
              </div>
              <StatusBadge status={costume.status} />
              <p className="text-sm text-ink-600 mt-2 leading-relaxed">{meta.description}</p>
              <div className={cn("mt-2 text-xs flex items-center gap-1", stuck ? "text-wine-700 font-medium" : "text-ink-500")}>
                <Timer size={11} />
                已停留 {formatDurationDays(daysInNode)}
                {stuck && <span>（超时 {stuckDays} 天）</span>}
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                <UserRound size={12} />
                当前处理人
              </div>
              <Avatar
                name={costume.currentAssignee}
                role={costume.currentAssigneeRole}
                size="md"
                showName
              />
              <div className="mt-2">
                <RoleBadge role={costume.currentAssigneeRole} />
              </div>
              <p className="text-xs text-ink-500 mt-2">
                需由「{roleMeta.label}」推动此节点
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                <FileText size={12} />
                尺码进度
              </div>
              {costume.studentSizes.length > 0 ? (
                <>
                  <div className="font-serif text-2xl font-semibold text-wine-700">
                    {costume.studentSizes.filter((s) => s.confirmStatus === "confirmed").length}
                    <span className="text-sm font-normal text-ink-400">
                      {" "}/ {costume.studentSizes.length}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-cream-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-forest-500 transition-all"
                      style={{
                        width: `${
                          (costume.studentSizes.filter((s) => s.confirmStatus === "confirmed")
                            .length /
                            costume.studentSizes.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  {exceptionCount > 0 && (
                    <p className="text-xs text-ochre-600 mt-2 flex items-center gap-1">
                      <MessageSquareText size={12} />
                      {exceptionCount} 条异常需处理
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-400">暂无学生尺码数据</p>
              )}
            </div>
          </div>

          {costume.remark && (
            <div className="card p-5">
              <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
                <MessageSquareText size={12} />
                备注说明
              </div>
              <p className="text-sm text-ink-700 leading-relaxed border-l-2 border-gold-400 pl-3">
                {costume.remark}
              </p>
            </div>
          )}

          <SizeTable costume={costume} />
        </div>

        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-wine-700" />
              <h2 className="font-serif text-base font-semibold text-ink-900">
                流程时间线
              </h2>
            </div>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin pr-1 -mr-1">
              <Timeline currentStatus={costume.status} entries={costume.timeline} />
            </div>
            <div className={cn("divider mt-4 mb-4")} />
            <div className="text-xs text-ink-400 space-y-1">
              <div className="flex justify-between">
                <span>创建时间</span>
                <span className="text-ink-600">{formatDateTime(costume.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>最近更新</span>
                <span className="text-ink-600">{formatDateTime(costume.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionBar costume={costume} />

      {sizeHistoryStudentId && <SizeHistoryModal costume={costume} />}
    </div>
  );
}
