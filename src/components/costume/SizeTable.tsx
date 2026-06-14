import { useState, useMemo } from "react";
import { History, Check, AlertTriangle, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store";
import { SIZE_CONFIRM_META, SIZE_OPTIONS } from "@/constants";
import type { Costume, StudentSize, SizeConfirmStatus } from "@/types";
import { cn, formatDateTime } from "@/utils";
import StatusBadge from "../common/StatusBadge";
import Avatar from "../common/Avatar";

interface Props {
  costume: Costume;
}

type EditableField = "height" | "weight" | "chest" | "waist" | "hips" | "size";

interface EditingState {
  studentId: string;
  field: EditableField;
}

interface ConfirmModalState {
  studentId: string;
  mode: "confirm" | "exception";
  reason: string;
  presetReasons: string[];
}

const CONFIRM_PRESETS = [
  "现场量体确认，尺码合身",
  "对照身高体重表，按标准尺码确认",
  "家长提供数据确认无误",
  "按去年演出记录参考确认",
];

const EXCEPTION_PRESETS = [
  "身高/体重超出标准尺码范围，需定制",
  "三围数据异常，需与家长复核",
  "学生近期可能长高，建议订大一号",
  "尺码表缺失，需联系供应商确认",
  "特殊体型，需单独备注版型调整",
];

export default function SizeTable({ costume }: Props) {
  const {
    currentUser,
    updateStudentSize,
    setStudentConfirmStatus,
    addStudent,
    removeStudent,
    openSizeHistory,
    addRecentStudent,
    bulkConfirmAllSizes,
  } = useAppStore();

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editRemark, setEditRemark] = useState("");
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const canEditSize = currentUser.role === "admin";
  const canConfirm = currentUser.role === "teacher";

  const grouped = useMemo(() => {
    const exception: StudentSize[] = [];
    const pending: StudentSize[] = [];
    const confirmed: StudentSize[] = [];
    costume.studentSizes.forEach((s) => {
      if (s.confirmStatus === "exception") exception.push(s);
      else if (s.confirmStatus === "pending") pending.push(s);
      else confirmed.push(s);
    });
    return { exception, pending, confirmed };
  }, [costume.studentSizes]);

  const confirmedCount = grouped.confirmed.length;
  const totalCount = costume.studentSizes.length;
  const progress = totalCount === 0 ? 0 : (confirmedCount / totalCount) * 100;

  const handleStartEdit = (studentId: string, field: EditableField, currentValue: string | number | undefined) => {
    if (!canEditSize) return;
    setEditing({ studentId, field });
    setEditValue(String(currentValue ?? ""));
  };

  const handleCommitEdit = (student: StudentSize) => {
    if (!editing) return;
    const { field } = editing;
    const isNumeric = ["height", "weight", "chest", "waist", "hips"].includes(field);
    const parsed: string | number | undefined = isNumeric
      ? editValue === ""
        ? undefined
        : Number(editValue)
      : editValue;
    updateStudentSize(
      costume.id,
      student.id,
      [{ field, value: parsed }],
      editRemark || `修改${field}字段`
    );
    setEditing(null);
    setEditValue("");
    setEditRemark("");
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !canEditSize) return;
    addStudent(costume.id, newStudentName.trim());
    setNewStudentName("");
    setShowAdd(false);
  };

  const openConfirmModal = (student: StudentSize, mode: "confirm" | "exception") => {
    if (!canConfirm) return;
    setConfirmModal({
      studentId: student.id,
      mode,
      reason: "",
      presetReasons: mode === "confirm" ? CONFIRM_PRESETS : EXCEPTION_PRESETS,
    });
  };

  const handleSubmitConfirm = () => {
    if (!confirmModal) return;
    const finalReason =
      confirmModal.reason.trim() ||
      (confirmModal.mode === "confirm" ? "老师确认尺码无误" : "异常原因待补充");
    const status: SizeConfirmStatus = confirmModal.mode === "confirm" ? "confirmed" : "exception";
    setStudentConfirmStatus(costume.id, confirmModal.studentId, status, finalReason);
    setConfirmModal(null);
  };

  const handleBulkConfirm = () => {
    if (!canConfirm) return;
    const r = prompt("请输入批量确认依据（必填）：", "对照身高体重表及家长提供信息，批量确认全部学生尺码");
    if (r && r.trim()) {
      bulkConfirmAllSizes(costume.id, r.trim());
    }
  };

  const renderCell = (student: StudentSize, field: EditableField, numeric = false) => {
    const value = student[field];
    const isEditing = editing?.studentId === student.id && editing?.field === field;

    if (isEditing) {
      if (field === "size") {
        return (
          <select
            autoFocus
            className="input !py-1 !px-2 text-xs"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleCommitEdit(student)}
          >
            <option value="">--</option>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        );
      }
      return (
        <input
          autoFocus
          type={numeric ? "number" : "text"}
          className="input !py-1 !px-2 text-xs w-20"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleCommitEdit(student)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommitEdit(student);
            if (e.key === "Escape") setEditing(null);
          }}
        />
      );
    }

    const display = numeric ? value ?? "—" : value || "—";
    return (
      <span
        className={cn(
          "inline-block min-w-[3ch]",
          canEditSize && "hover:bg-cream-100 px-1.5 py-0.5 rounded cursor-text"
        )}
        onClick={() => handleStartEdit(student.id, field, value)}
        title={canEditSize ? "点击编辑" : undefined}
      >
        {display}
      </span>
    );
  };

  const renderStudentRow = (student: StudentSize, idx: number, totalInGroup: number) => {
    const isException = student.confirmStatus === "exception";
    const isPending = student.confirmStatus === "pending";
    const lastLog =
      student.changeLogs.length > 0
        ? [...student.changeLogs].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
        : null;

    return (
      <tr
        key={student.id}
        className={cn(
          "border-t border-cream-100 transition-colors",
          idx < totalInGroup - 1 && "bg-cream-50/30",
          isException && "bg-ochre-50/70 hover:bg-ochre-50",
          isPending && !isException && "hover:bg-wine-50/40"
        )}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink-800">{student.studentName}</span>
            {canEditSize && (
              <button
                onClick={() => {
                  if (confirm(`确认删除学生「${student.studentName}」？`)) {
                    removeStudent(costume.id, student.id);
                  }
                }}
                className="text-ink-300 hover:text-ochre-600 transition-opacity"
                title="删除"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </td>
        <td className="text-right px-3 py-3 text-ink-700 tabular-nums">
          {renderCell(student, "height", true)}
        </td>
        <td className="text-right px-3 py-3 text-ink-700 tabular-nums">
          {renderCell(student, "weight", true)}
        </td>
        <td className="text-right px-3 py-3 text-ink-700 tabular-nums">
          {renderCell(student, "chest", true)}
        </td>
        <td className="text-right px-3 py-3 text-ink-700 tabular-nums">
          {renderCell(student, "waist", true)}
        </td>
        <td className="text-right px-3 py-3 text-ink-700 tabular-nums">
          {renderCell(student, "hips", true)}
        </td>
        <td className="text-center px-3 py-3 font-medium text-wine-700">
          {renderCell(student, "size")}
        </td>
        <td className="text-center px-3 py-3">
          <span className={cn("chip", SIZE_CONFIRM_META[student.confirmStatus].color)}>
            {SIZE_CONFIRM_META[student.confirmStatus].label}
          </span>
        </td>
        <td className="px-3 py-3 text-xs max-w-[260px]">
          {student.remark ? (
            <div className="space-y-1">
              <p
                className={cn(
                  "leading-relaxed",
                  isException ? "text-ochre-700 font-medium" : "text-ink-600"
                )}
              >
                {student.remark}
              </p>
              {lastLog && (
                <div className="flex items-center gap-1.5 text-[10px] text-ink-400 flex-wrap">
                  <Avatar name={lastLog.operatorName} role={lastLog.operatorRole} size="xs" />
                  <span>{lastLog.operatorName}</span>
                  <span>·</span>
                  <span>{formatDateTime(lastLog.timestamp)}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-ink-300">—</span>
          )}
        </td>
        <td className="text-center px-3 py-3">
          <div className="flex items-center justify-center gap-1">
            {canConfirm && student.confirmStatus !== "confirmed" && (
              <button
                onClick={() => openConfirmModal(student, "confirm")}
                className="p-1.5 rounded hover:bg-forest-100 text-forest-700 transition-colors"
                title="确认尺码（需填写依据）"
              >
                <Check size={14} />
              </button>
            )}
            {canConfirm && student.confirmStatus !== "exception" && (
              <button
                onClick={() => openConfirmModal(student, "exception")}
                className="p-1.5 rounded hover:bg-ochre-100 text-ochre-700 transition-colors"
                title="标记异常（需填写原因）"
              >
                <AlertTriangle size={14} />
              </button>
            )}
            {student.changeLogs.length > 0 && (
              <button
                onClick={() => {
                  addRecentStudent(costume.id, student.id, student.studentName);
                  openSizeHistory(costume.id, student.id);
                }}
                className="p-1.5 rounded hover:bg-wine-50 text-wine-700 transition-colors"
                title="查看修改历史"
              >
                <History size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderGroup = (
    title: string,
    students: StudentSize[],
    tone: "exception" | "pending" | "confirmed"
  ) => {
    if (students.length === 0) return null;
    const toneConfig = {
      exception: {
        bg: "bg-ochre-50",
        border: "border-ochre-200",
        text: "text-ochre-700",
        icon: <AlertTriangle size={14} />,
      },
      pending: {
        bg: "bg-ink-50",
        border: "border-ink-200",
        text: "text-ink-700",
        icon: <AlertCircle size={14} />,
      },
      confirmed: {
        bg: "bg-forest-50",
        border: "border-forest-200",
        text: "text-forest-700",
        icon: <Check size={14} />,
      },
    }[tone];

    return (
      <>
        <tr className={cn("border-t-2", toneConfig.border)}>
          <td
            colSpan={10}
            className={cn("px-4 py-2.5 text-xs font-medium flex items-center gap-2", toneConfig.bg, toneConfig.text)}
          >
            {toneConfig.icon}
            {title}
            <span className="ml-1 opacity-70">（{students.length} 人）</span>
          </td>
        </tr>
        {students.map((s, i) => renderStudentRow(s, i, students.length))}
      </>
    );
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-cream-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-base font-semibold text-ink-900">尺码确认表</h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-ink-500">
                {confirmedCount}/{totalCount} 已确认
              </span>
            </div>
            <StatusBadge status={costume.status} />
            {grouped.exception.length > 0 && (
              <span className="chip bg-ochre-50 text-ochre-700 border-ochre-200 text-[11px]">
                <AlertTriangle size={11} />
                {grouped.exception.length} 条异常待处理
              </span>
            )}
            {grouped.pending.length > 0 && (
              <span className="chip bg-ink-50 text-ink-600 border-ink-200 text-[11px]">
                <AlertCircle size={11} />
                {grouped.pending.length} 人待确认
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canConfirm && grouped.pending.length > 0 && (
            <button onClick={handleBulkConfirm} className="btn btn-success">
              <Check size={14} />
              一键确认剩余 {grouped.pending.length} 人
            </button>
          )}
          {canEditSize && (
            <button onClick={() => setShowAdd(!showAdd)} className="btn btn-secondary">
              <Plus size={14} />
              添加学生
            </button>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="px-5 py-3 bg-cream-50 border-b border-cream-200 flex items-center gap-2 flex-wrap">
          <input
            autoFocus
            className="input max-w-xs"
            placeholder="请输入学生姓名"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
          />
          <button onClick={handleAddStudent} className="btn btn-primary">
            确认添加
          </button>
          <button
            onClick={() => {
              setShowAdd(false);
              setNewStudentName("");
            }}
            className="btn btn-ghost"
          >
            取消
          </button>
        </div>
      )}

      {editing && canEditSize && (
        <div className="px-5 py-2 bg-wine-50 border-b border-wine-100 flex items-center gap-2 text-xs">
          <span className="text-wine-700">编辑备注（将记录到修改日志）：</span>
          <input
            autoFocus
            className="input !py-1 flex-1 max-w-sm text-xs"
            placeholder="请说明修改原因，如：家长反映孩子近期长高"
            value={editRemark}
            onChange={(e) => setEditRemark(e.target.value)}
          />
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cream-100 text-ink-600 text-xs">
              <th className="text-left px-4 py-3 font-medium w-28">学生姓名</th>
              <th className="text-right px-3 py-3 font-medium">身高</th>
              <th className="text-right px-3 py-3 font-medium">体重</th>
              <th className="text-right px-3 py-3 font-medium">胸围</th>
              <th className="text-right px-3 py-3 font-medium">腰围</th>
              <th className="text-right px-3 py-3 font-medium">臀围</th>
              <th className="text-center px-3 py-3 font-medium w-20">尺码</th>
              <th className="text-center px-3 py-3 font-medium w-28">确认状态</th>
              <th className="text-left px-3 py-3 font-medium min-w-[220px]">
                确认依据 / 异常原因
              </th>
              <th className="text-center px-3 py-3 font-medium w-28">操作</th>
            </tr>
          </thead>
          <tbody>
            {costume.studentSizes.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-ink-400 text-sm">
                  暂无学生数据，请先添加学生再录入尺码
                </td>
              </tr>
            ) : (
              <>
                {renderGroup("异常待处理（需优先跟进）", grouped.exception, "exception")}
                {renderGroup("待老师确认尺码", grouped.pending, "pending")}
                {renderGroup("已确认", grouped.confirmed, "confirmed")}
              </>
            )}
          </tbody>
        </table>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />
          <div className="relative card w-full max-w-md p-6 shadow-card-hover animate-in">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-ink-900">
                  {confirmModal.mode === "confirm" ? "确认学生尺码" : "标记尺码异常"}
                </h3>
                <p className="text-xs text-ink-500 mt-1">
                  {confirmModal.mode === "confirm"
                    ? "请选择或填写确认依据，将记录在学生尺码档案中"
                    : "请选择或填写异常原因，便于后续跟进处理"}
                </p>
              </div>
              <button
                onClick={() => setConfirmModal(null)}
                className="p-1.5 rounded hover:bg-cream-200 text-ink-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {confirmModal.presetReasons.map((p) => {
                  const active = confirmModal.reason === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setConfirmModal({ ...confirmModal, reason: p })}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs border transition-all text-left",
                        active
                          ? confirmModal.mode === "confirm"
                            ? "bg-forest-700 text-white border-forest-700"
                            : "bg-ochre-700 text-white border-ochre-700"
                          : "bg-white text-ink-600 border-cream-300 hover:border-wine-300 hover:text-wine-700"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="label">
                  {confirmModal.mode === "confirm" ? "确认依据" : "异常原因"}
                  <span className="text-ochre-600 ml-1">*</span>
                </label>
                <textarea
                  autoFocus
                  className="input min-h-[90px]"
                  placeholder={
                    confirmModal.mode === "confirm"
                      ? "请描述您如何确认此学生尺码，如：现场量体身高128cm，按S码确认"
                      : "请描述异常情况，如：身高140cm但标准L码裙长偏短，需定制加长"
                  }
                  value={confirmModal.reason}
                  onChange={(e) =>
                    setConfirmModal({ ...confirmModal, reason: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-cream-200">
              <button onClick={() => setConfirmModal(null)} className="btn btn-ghost">
                取消
              </button>
              <button
                onClick={handleSubmitConfirm}
                disabled={!confirmModal.reason.trim()}
                className={cn(
                  "btn disabled:opacity-50 disabled:cursor-not-allowed",
                  confirmModal.mode === "confirm" ? "btn-success" : "btn-secondary"
                )}
              >
                {confirmModal.mode === "confirm" ? (
                  <>
                    <Check size={14} />
                    确认尺码
                  </>
                ) : (
                  <>
                    <AlertTriangle size={14} />
                    提交异常
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
