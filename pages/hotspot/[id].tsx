import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { prisma } from "@/lib/prisma";
import { getServerAuth, SessionUser, roleLabel } from "@/lib/auth";
import {
  formatTime,
  formatRelativeTime,
  statusLabel,
  statusColor,
  urgencyLabel,
  urgencyColor,
  actionLabel,
  actionIcon,
  formatFileSize,
} from "@/lib/format";
import { HotspotStatus, UserRole } from "@/lib/types";
import Layout from "@/components/Layout";

interface DispatchOrderView {
  id: string;
  orderNo: string;
  instructions: string;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  assignee: { id: string; name: string; role: string; phone: string | null } | null;
  acceptor: { id: string; name: string; role: string } | null;
}

interface CommentView {
  id: string;
  actionType: string;
  content: string;
  createdAt: string;
  author: { name: string; role: string };
}

interface AttachmentView {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploader: { name: string };
}

interface HotspotDetail {
  id: string;
  title: string;
  location: string;
  description: string;
  bikeCount: number;
  urgency: number;
  status: string;
  submittedAt: string;
  dispatchedAt: string | null;
  completedAt: string | null;
  submitter: { name: string; role: string };
  dispatcher: { name: string; role: string } | null;
  dispatchOrders: DispatchOrderView[];
  comments: CommentView[];
  attachments: AttachmentView[];
}

interface Props {
  user: SessionUser;
  hotspot: HotspotDetail;
  allInspectors: { id: string; name: string; phone: string | null }[];
}

type ModalType =
  | null
  | "dispatch"
  | "accept"
  | "update"
  | "complete"
  | "comment"
  | "attach";

export default function HotspotDetailPage({ user, hotspot, allInspectors }: Props) {
  const router = useRouter();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionRemark, setActionRemark] = useState("");
  const [dispatchAssignee, setDispatchAssignee] = useState("");
  const [dispatchInstructions, setDispatchInstructions] = useState("");
  const [newComment, setNewComment] = useState("");
  const [attachFilename, setAttachFilename] = useState("");

  const myDispatch = useMemo(
    () => hotspot.dispatchOrders.find((d) => d.assignee?.id === user.id),
    [hotspot.dispatchOrders, user.id]
  );

  const canDispatch =
    (user.role === UserRole.DISPATCHER || user.role === UserRole.AREA_MANAGER) &&
    hotspot.status === HotspotStatus.PENDING;
  const canAccept =
    user.role === UserRole.INSPECTOR &&
    !!myDispatch &&
    !myDispatch.acceptedAt &&
    hotspot.status === HotspotStatus.DISPATCHED;
  const canUpdate =
    user.role === UserRole.INSPECTOR &&
    hotspot.status === HotspotStatus.IN_PROGRESS;
  const canComplete =
    (user.role === UserRole.INSPECTOR ||
      user.role === UserRole.DISPATCHER ||
      user.role === UserRole.AREA_MANAGER) &&
    (hotspot.status === HotspotStatus.IN_PROGRESS ||
      hotspot.status === HotspotStatus.DISPATCHED);

  const closeModal = () => {
    setModalType(null);
    setActionRemark("");
    setDispatchAssignee("");
    setDispatchInstructions("");
    setNewComment("");
    setAttachFilename("");
    setFormError("");
  };

  const doAction = async (url: string, body: Record<string, any>) => {
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        router.reload();
      } else {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error || "操作失败");
      }
    } catch {
      setFormError("网络错误");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchAssignee || !dispatchInstructions.trim()) {
      setFormError("请选择处理人并填写派单说明");
      return;
    }
    await doAction(`/api/hotspots/${hotspot.id}/dispatch`, {
      instructions: dispatchInstructions.trim(),
      assigneeId: dispatchAssignee,
    });
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myDispatch) return;
    await doAction(`/api/hotspots/${hotspot.id}/accept`, {
      dispatchId: myDispatch.id,
      remark: actionRemark.trim() || undefined,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionRemark.trim()) {
      setFormError("请填写更新内容");
      return;
    }
    await doAction(`/api/hotspots/${hotspot.id}/update`, {
      dispatchId: myDispatch?.id,
      content: actionRemark.trim(),
    });
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    await doAction(`/api/hotspots/${hotspot.id}/complete`, {
      dispatchId: myDispatch?.id,
      content: actionRemark.trim() || undefined,
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setFormError("请填写备注内容");
      return;
    }
    await doAction(`/api/hotspots/${hotspot.id}/comment`, {
      content: newComment.trim(),
    });
  };

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attachFilename.trim()) {
      setFormError("请填写文件名");
      return;
    }
    await doAction(`/api/hotspots/${hotspot.id}/attach`, {
      filename: attachFilename.trim(),
      fileType: "image/jpeg",
      fileSize: 1024000,
    });
  };

  const modalTitle = {
    dispatch: "调度派单",
    accept: "确认接单",
    update: "进度更新",
    complete: "标记处理完成",
    comment: "添加备注",
    attach: "上传附件（占位）",
  } as const;

  const submitLabel = {
    dispatch: "确认派单",
    accept: "确认接单",
    update: "提交更新",
    complete: "确认完成",
    comment: "提交备注",
    attach: "确认上传",
  } as const;

  const submitColor = {
    dispatch: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400",
    accept: "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400",
    update: "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400",
    complete: "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400",
    comment: "bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400",
    attach: "bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400",
  } as const;

  const onSubmit = {
    dispatch: handleDispatch,
    accept: handleAccept,
    update: handleUpdate,
    complete: handleComplete,
    comment: handleComment,
    attach: handleAttach,
  } as const;

  return (
    <>
      <Head>
        <title>{hotspot.title} - 热点详情</title>
      </Head>
      <Layout user={user}>
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600">
              ← 返回列表
            </Link>
            <span>/</span>
            <span className="text-gray-700">热点详情</span>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{hotspot.title}</h1>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${statusColor(
                        hotspot.status as HotspotStatus
                      )}`}
                    >
                      {statusLabel(hotspot.status as HotspotStatus)}
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${urgencyColor(
                        hotspot.urgency
                      )}`}
                    >
                      {urgencyLabel(hotspot.urgency)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                    <span>📍</span>
                    <span>{hotspot.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                {canDispatch && (
                  <button
                    onClick={() => setModalType("dispatch")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    📋 调度派单
                  </button>
                )}
                {canAccept && (
                  <button
                    onClick={() => setModalType("accept")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    ✅ 接单
                  </button>
                )}
                {canUpdate && (
                  <button
                    onClick={() => setModalType("update")}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    📊 进度更新
                  </button>
                )}
                {canComplete && (
                  <button
                    onClick={() => setModalType("complete")}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg shadow-sm transition"
                  >
                    🎉 标记完成
                  </button>
                )}
                <button
                  onClick={() => setModalType("comment")}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                >
                  💬 添加备注
                </button>
                <button
                  onClick={() => setModalType("attach")}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition"
                >
                  📎 上传附件
                </button>
              </div>
            </div>

            <div className="px-6 py-5 grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-5">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">情况描述</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{hotspot.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">现场车辆</div>
                    <div className="text-lg font-semibold text-gray-900 mt-0.5">
                      {hotspot.bikeCount} 辆
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">提交时间</div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">
                      {formatTime(hotspot.submittedAt)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">提交人</div>
                    <div className="text-sm font-medium text-gray-900 mt-0.5">
                      {hotspot.submitter.name}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500 mb-3">责任链</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {hotspot.submitter.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {hotspot.submitter.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {roleLabel(hotspot.submitter.role as any)} · 提交热点
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-300 text-lg">→</div>

                    {hotspot.dispatcher ? (
                      <>
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {hotspot.dispatcher.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {hotspot.dispatcher.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {roleLabel(hotspot.dispatcher.role as any)} · 调度派单
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-300 text-lg">→</div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-2.5 opacity-60">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                          ?
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">等待调度</div>
                          <div className="text-xs text-gray-400">调度员</div>
                        </div>
                      </div>
                    )}

                    {hotspot.dispatchOrders[0]?.assignee ? (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {hotspot.dispatchOrders[0].assignee.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {hotspot.dispatchOrders[0].assignee.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {roleLabel(hotspot.dispatchOrders[0].assignee.role as any)} ·{" "}
                            {hotspot.dispatchOrders[0].acceptedAt ? "处理中" : "待接单"}
                          </div>
                        </div>
                      </div>
                    ) : hotspot.dispatcher ? (
                      <div className="flex items-center gap-2 bg-gray-50 border border-dashed border-gray-300 rounded-lg px-4 py-2.5 opacity-60">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs">
                          ?
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">待指派</div>
                          <div className="text-xs text-gray-400">处理人</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {hotspot.dispatchOrders.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">调度派单信息</div>
                    {hotspot.dispatchOrders.map((d) => (
                      <div
                        key={d.id}
                        className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-blue-900">
                            派单编号：{d.orderNo}
                          </div>
                          <div className="text-xs text-gray-500">{formatTime(d.createdAt)}</div>
                        </div>
                        <div className="text-sm text-gray-700">{d.instructions}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-blue-100 mt-2 flex-wrap">
                          <span>
                            指派给：
                            <span className="text-gray-700">{d.assignee?.name || "-"}</span>
                          </span>
                          <span>
                            接单时间：
                            <span className="text-gray-700">
                              {d.acceptedAt ? formatTime(d.acceptedAt) : "未接单"}
                            </span>
                          </span>
                          <span>
                            完成时间：
                            <span className="text-gray-700">
                              {d.completedAt ? formatTime(d.completedAt) : "-"}
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-3">
                    附件（{hotspot.attachments.length}）
                  </div>
                  {hotspot.attachments.length === 0 ? (
                    <div className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-lg">
                      暂无附件
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {hotspot.attachments.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-lg">
                            {a.fileType.startsWith("image")
                              ? "🖼️"
                              : a.fileType.includes("pdf")
                              ? "📄"
                              : "📎"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {a.filename}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(a.fileSize)} · {formatRelativeTime(a.uploadedAt)} ·{" "}
                              {a.uploader.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">操作留痕 · 历史备注</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                全部 {hotspot.comments.length} 条记录，按时间倒序
              </p>
            </div>
            <div className="px-6 py-5">
              <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                {hotspot.comments.map((c) => (
                  <li key={c.id} className="ml-5 relative">
                    <span className="absolute -left-[30px] flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-gray-200 text-sm shadow-sm">
                      {actionIcon(c.actionType as any)}
                    </span>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-[10px] font-medium">
                            {c.author.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {c.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({roleLabel(c.author.role as any)})
                          </span>
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-200 text-gray-600">
                            {actionLabel(c.actionType as any)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">{formatTime(c.createdAt)}</div>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {c.content}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {modalType && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">{modalTitle[modalType]}</h3>
              </div>

              <form onSubmit={onSubmit[modalType]} className="p-6 space-y-4">
                {modalType === "dispatch" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        指派处理人
                      </label>
                      <select
                        value={dispatchAssignee}
                        onChange={(e) => setDispatchAssignee(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      >
                        <option value="">请选择巡检员</option>
                        {allInspectors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name}
                            {i.phone ? ` (${i.phone})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        派单说明
                      </label>
                      <textarea
                        value={dispatchInstructions}
                        onChange={(e) => setDispatchInstructions(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        placeholder="请填写调度指令，如：从XX停车场调运XX辆车至该地点"
                      />
                    </div>
                  </>
                )}

                {(modalType === "accept" ||
                  modalType === "update" ||
                  modalType === "complete") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {modalType === "complete" ? "完成说明（可选）" : "内容说明"}
                    </label>
                    <textarea
                      value={actionRemark}
                      onChange={(e) => setActionRemark(e.target.value)}
                      rows={modalType === "accept" ? 2 : 4}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder={
                        modalType === "accept"
                          ? "可填写接单备注（可选）"
                          : modalType === "update"
                          ? "请描述当前处理进度"
                          : "请填写处理结果说明，如：共转运XX辆，现场已清理完毕"
                      }
                    />
                  </div>
                )}

                {modalType === "comment" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      备注内容
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="输入备注内容..."
                    />
                  </div>
                )}

                {modalType === "attach" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      文件名
                    </label>
                    <input
                      type="text"
                      value={attachFilename}
                      onChange={(e) => setAttachFilename(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="例如：现场照片_0610.jpg"
                    />
                    <p className="text-xs text-gray-400 mt-1">演示模式，实际将创建占位记录</p>
                  </div>
                )}

                {formError && <div className="text-sm text-red-600">{formError}</div>}
              </form>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  onClick={onSubmit[modalType]}
                  disabled={formLoading}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition ${submitColor[modalType]}`}
                >
                  {formLoading ? "提交中..." : submitLabel[modalType]}
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await getServerAuth(context);
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const { id } = context.params!;
  const hotspotRaw = await prisma.hotspotArea.findUnique({
    where: { id: id as string },
    include: {
      submitter: { select: { name: true, role: true } },
      dispatcher: { select: { name: true, role: true } },
      dispatchOrders: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: { select: { id: true, name: true, role: true, phone: true } },
          acceptor: { select: { id: true, name: true, role: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, role: true } } },
      },
      attachments: {
        orderBy: { uploadedAt: "desc" },
        include: { uploader: { select: { name: true } } },
      },
    },
  });

  if (!hotspotRaw) {
    return { notFound: true };
  }

  const allInspectors = await prisma.user.findMany({
    where: { role: UserRole.INSPECTOR },
    select: { id: true, name: true, phone: true },
    orderBy: { name: "asc" },
  });

  const hotspot: HotspotDetail = {
    ...hotspotRaw,
    submittedAt: hotspotRaw.submittedAt.toISOString(),
    dispatchedAt: hotspotRaw.dispatchedAt?.toISOString() || null,
    completedAt: hotspotRaw.completedAt?.toISOString() || null,
    dispatchOrders: hotspotRaw.dispatchOrders.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      acceptedAt: d.acceptedAt?.toISOString() || null,
      completedAt: d.completedAt?.toISOString() || null,
    })),
    comments: hotspotRaw.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    attachments: hotspotRaw.attachments.map((a) => ({
      ...a,
      uploadedAt: a.uploadedAt.toISOString(),
    })),
  };

  return { props: { user, hotspot, allInspectors } };
};
