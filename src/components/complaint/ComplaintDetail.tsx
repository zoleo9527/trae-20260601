import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Building2,
  ChefHat,
  Phone,
  MapPin,
  MessageSquare,
  Star,
  ChevronDown,
  ChevronUp,
  Check,
  Send,
  FileText,
  Printer,
  PhoneCall,
  TrendingUp,
  HandshakeIcon,
  MessageCircle,
  Save,
} from "lucide-react";
import type { ComplaintStatus, VisitMethod } from "@/types";

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const complaint = useAppStore((s) => s.complaints.find((c) => c.id === id));
  const verification = useAppStore((s) =>
    complaint?.verificationId
      ? s.verifications.find((v) => v.id === complaint.verificationId)
      : undefined
  );
  const updateComplaintStatus = useAppStore((s) => s.updateComplaintStatus);
  const addVisitLog = useAppStore((s) => s.addVisitLog);
  const updateKitchenNote = useAppStore((s) => s.updateKitchenNote);
  const currentRole = useAppStore((s) => s.currentRole);

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [visitMethod, setVisitMethod] = useState<VisitMethod>("phone");
  const [visitResult, setVisitResult] = useState("");
  const [visitFeedback, setVisitFeedback] = useState("");
  const [satisfaction, setSatisfaction] = useState(5);
  const [kitchenNoteInput, setKitchenNoteInput] = useState("");

  useEffect(() => {
    if (complaint?.kitchenNote) {
      setKitchenNoteInput(complaint.kitchenNote);
    }
  }, [complaint?.kitchenNote]);

  const operatorName =
    currentRole === "floor_manager"
      ? "陈静"
      : currentRole === "kitchen_lead"
      ? "赵刚"
      : "张婷";

  const getTimelineSteps = () => {
    if (!complaint) return [];

    const steps: {
      key: string;
      title: string;
      time?: string;
      operator?: string;
      description?: string;
      status: "done" | "current" | "pending";
    }[] = [];

    steps.push({
      key: "verify",
      title: "核销完成",
      time: verification?.verifyTime,
      operator: verification?.cashier,
      status: "done",
    });

    const statusOrder: ComplaintStatus[] = [
      "pending",
      "processing",
      "to_visit",
      "completed",
    ];
    const currentIndex = statusOrder.indexOf(complaint.status);

    const statusMap: Record<
      string,
      { title: string; operator?: string; description?: string; time?: string }
    > = {
      pending: {
        title: "客诉受理",
        operator: complaint.handler,
        time: complaint.createTime,
      },
      processing: {
        title: "后厨处理",
        operator: complaint.handler,
        description: complaint.kitchenNote,
      },
      to_visit: {
        title: "待回访",
        operator: complaint.handler,
      },
      completed: {
        title: "回访完成",
        operator: complaint.visitLogs[complaint.visitLogs.length - 1]?.visitor,
        time: complaint.visitLogs[complaint.visitLogs.length - 1]?.visitTime,
      },
    };

    statusOrder.forEach((status, idx) => {
      if (complaint.status === "escalated" && idx > currentIndex) return;

      const stepInfo = statusMap[status];
      let stepStatus: "done" | "current" | "pending";

      if (complaint.status === "escalated") {
        stepStatus = idx <= currentIndex ? "done" : "pending";
      } else {
        if (idx < currentIndex) stepStatus = "done";
        else if (idx === currentIndex) stepStatus = "current";
        else stepStatus = "pending";
      }

      if (status === "to_visit" && complaint.visitLogs.length > 0) {
        stepStatus = "current";
      }
      if (status === "completed" && complaint.status === "completed") {
        stepStatus = "done";
      }

      steps.push({
        key: status,
        title: stepInfo.title,
        time: stepInfo.time,
        operator: stepInfo.operator,
        description: stepInfo.description,
        status: stepStatus,
      });
    });

    return steps;
  };

  const getAvailableActions = () => {
    if (!complaint) return [];

    const actions: { status: ComplaintStatus; label: string; primary?: boolean }[] = [];

    switch (complaint.status) {
      case "pending":
        actions.push({ status: "processing", label: "受理客诉", primary: true });
        break;
      case "processing":
        actions.push({ status: "to_visit", label: "标记待回访", primary: true });
        break;
      case "to_visit":
        actions.push({ status: "completed", label: "完成回访", primary: true });
        break;
    }

    if (complaint.status !== "escalated" && complaint.status !== "completed") {
      actions.push({ status: "escalated", label: "升级处理" });
    }

    return actions;
  };

  const handleStatusUpdate = (status: ComplaintStatus) => {
    if (!complaint) return;
    updateComplaintStatus(complaint.id, status, operatorName);
  };

  const handleAddVisitLog = () => {
    if (!complaint || !visitResult.trim()) return;

    addVisitLog(complaint.id, {
      visitor: operatorName,
      visitTime: new Date().toISOString().replace("T", " ").slice(0, 19),
      method: visitMethod,
      result: visitResult.trim(),
      feedback: visitFeedback.trim(),
      satisfaction,
    });

    setVisitResult("");
    setVisitFeedback("");
    setSatisfaction(5);
  };

  const handleSaveKitchenNote = () => {
    if (!complaint || !kitchenNoteInput.trim()) return;

    updateKitchenNote(complaint.id, kitchenNoteInput.trim());

    if (complaint.status === "processing") {
      updateComplaintStatus(complaint.id, "to_visit", operatorName);
    } else if (complaint.status === "pending") {
      updateComplaintStatus(complaint.id, "processing", operatorName);
    }

    setKitchenNoteInput("");
  };

  if (!complaint) {
    return (
      <div className="p-10 text-center text-ink-500">未找到该客诉记录</div>
    );
  }

  const timelineSteps = getTimelineSteps();
  const actions = getAvailableActions();
  const showVisitForm =
    complaint.status === "to_visit" || complaint.status === "processing";
  const sortedVisitLogs = [...complaint.visitLogs].sort(
    (a, b) =>
      new Date(b.visitTime).getTime() - new Date(a.visitTime).getTime()
  );

  const firstLogId = sortedVisitLogs.length > 0 ? sortedVisitLogs[0].id : null;
  const activeExpandedId = expandedLogId ?? firstLogId;

  const showKitchenNoteForm =
    (complaint.status === "pending" || complaint.status === "processing") &&
    (complaint.responsibleParty === "kitchen" ||
      complaint.responsibleParty === "both" ||
      currentRole === "kitchen_lead");

  const visitMethodOptions: {
    value: VisitMethod;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { value: "phone", label: "电话", icon: <Phone className="w-4 h-4" /> },
    { value: "onsite", label: "现场", icon: <MapPin className="w-4 h-4" /> },
    { value: "wechat", label: "微信", icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => navigate("/complaints")}
          className="p-2 rounded-lg hover:bg-ink-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink-600" />
        </button>
        <div>
          <div className="text-sm text-ink-500">客诉单号</div>
          <div className="text-xl font-bold text-ink-900 font-mono">
            {complaint.id}
          </div>
        </div>
        <div className="ml-2 flex items-center gap-2">
          <StatusBadge type="complaint" value={complaint.status} />
          <StatusBadge type="severity" value={complaint.severity} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-flame-600" />
              客诉信息
            </div>
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow
                icon={<MessageSquare className="w-4 h-4" />}
                label="客诉来源"
                value={complaint.source}
              />
              <DetailRow
                icon={<FileText className="w-4 h-4" />}
                label="关联核销单"
                value={
                  verification ? (
                    <Link
                      to={`/verification/${verification.id}`}
                      className="text-brand-600 hover:text-brand-700 font-mono hover:underline"
                    >
                      {verification.id}
                    </Link>
                  ) : (
                    <span className="text-ink-400">无</span>
                  )
                }
              />
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="责任方"
                value={
                  complaint.responsibleParty === "front"
                    ? "前厅"
                    : complaint.responsibleParty === "kitchen"
                    ? "后厨"
                    : "共同"
                }
              />
              <DetailRow
                icon={<Building2 className="w-4 h-4" />}
                label="处理人"
                value={complaint.handler}
              />
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="创建时间"
                value={
                  <span className="font-mono">{complaint.createTime}</span>
                }
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="截止时间"
                value={
                  complaint.deadline ? (
                    <span className="font-mono text-flame-600">
                      {complaint.deadline}
                    </span>
                  ) : (
                    <span className="text-ink-400">无</span>
                  )
                }
              />
            </div>
            <div className="mt-5 pt-5 border-t border-ink-100">
              <div className="text-xs text-ink-400 mb-2">投诉内容</div>
              <p className="text-sm text-ink-800 leading-relaxed">
                {complaint.content}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" />
              处理时间线
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-ink-200"></div>
              <div className="space-y-6">
                {timelineSteps.map((step, idx) => {
                  const isLast = idx === timelineSteps.length - 1;
                  return (
                    <div key={step.key} className="relative pl-10">
                      <div
                        className={`absolute left-0 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-card ${
                          step.status === "done"
                            ? "bg-green-500 text-white"
                            : step.status === "current"
                            ? "bg-flame-500 text-white"
                            : "bg-ink-200 text-ink-400"
                        }`}
                      >
                        {step.status === "done" ? (
                          <Check className="w-4 h-4" />
                        ) : step.status === "current" ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse-dot"></div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-ink-400"></div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className={`text-sm font-medium ${
                              step.status === "pending"
                                ? "text-ink-400"
                                : "text-ink-900"
                            }`}
                          >
                            {step.title}
                          </span>
                          {step.status === "current" && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-flame-50 text-flame-600 font-medium">
                              进行中
                            </span>
                          )}
                        </div>
                        {step.time && (
                          <div className="text-xs text-ink-400 mt-0.5 font-mono">
                            {step.time}
                          </div>
                        )}
                        {step.operator && (
                          <div className="text-xs text-ink-500 mt-0.5">
                            操作人：{step.operator}
                          </div>
                        )}
                        {step.description && (
                          <p className="text-xs text-ink-600 mt-1 bg-ink-50 p-2 rounded-lg">
                            {step.description}
                          </p>
                        )}
                      </div>
                      {isLast && <div className="h-0"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {complaint.kitchenNote && !showKitchenNoteForm && (
            <div className="bg-flame-50/50 rounded-xl shadow-card p-6 border-l-4 border-flame-500">
              <div className="flex items-start gap-2">
                <ChefHat className="w-5 h-5 text-flame-600 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">
                    后厨处理备注
                  </div>
                  <p className="text-sm text-ink-600 mt-1 leading-relaxed">
                    {complaint.kitchenNote}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showKitchenNoteForm && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-flame-600" />
                后厨处理录入
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    处理说明
                  </label>
                  <textarea
                    value={kitchenNoteInput}
                    onChange={(e) => setKitchenNoteInput(e.target.value)}
                    placeholder="请输入后厨处理说明..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-flame-500/20 focus:border-flame-500 transition-shadow"
                  />
                </div>
                <button
                  onClick={handleSaveKitchenNote}
                  disabled={!kitchenNoteInput.trim()}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-flame-600 text-white hover:bg-flame-700 transition-colors disabled:bg-ink-200 disabled:text-ink-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存处理结果并进入待回访
                </button>
              </div>
            </div>
          )}

          {sortedVisitLogs.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-brand-600" />
                回访记录
                <span className="text-xs text-ink-400 font-normal">
                  共 {sortedVisitLogs.length} 条
                </span>
              </div>
              <div className="space-y-3">
                {sortedVisitLogs.map((log, idx) => {
                  const isExpanded = activeExpandedId === log.id;
                  const MethodIcon =
                    log.method === "phone"
                      ? Phone
                      : log.method === "onsite"
                      ? MapPin
                      : MessageCircle;
                  const methodLabel =
                    log.method === "phone"
                      ? "电话回访"
                      : log.method === "onsite"
                      ? "现场回访"
                      : "微信回访";

                  return (
                    <div
                      key={log.id}
                      className="border border-ink-200 rounded-xl overflow-hidden transition-all"
                    >
                      <button
                        onClick={() =>
                          setExpandedLogId(isExpanded ? null : log.id)
                        }
                        className="w-full flex items-center gap-3 p-4 hover:bg-ink-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                          <MethodIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-ink-900">
                              {methodLabel}
                            </span>
                            <span className="text-xs text-ink-400">
                              第 {sortedVisitLogs.length - idx} 次
                            </span>
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-3">
                            <span>{log.visitor}</span>
                            <span className="font-mono">{log.visitTime}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= log.satisfaction
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-ink-200"
                                }`}
                              />
                            ))}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-ink-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-ink-400" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 border-t border-ink-100">
                          <div className="pt-4 space-y-3">
                            <div>
                              <div className="text-xs text-ink-400 mb-1">
                                回访结果
                              </div>
                              <p className="text-sm text-ink-700 leading-relaxed">
                                {log.result}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs text-ink-400 mb-1">
                                客户反馈
                              </div>
                              <p className="text-sm text-ink-700 leading-relaxed">
                                {log.feedback || "无"}
                              </p>
                            </div>
                            <div>
                              <div className="text-xs text-ink-400 mb-1">
                                满意度
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-5 h-5 ${
                                      s <= log.satisfaction
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-ink-200"
                                    }`}
                                  />
                                ))}
                                <span className="ml-2 text-sm text-ink-600">
                                  {log.satisfaction} 星
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {showVisitForm && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-flame-600" />
                添加回访记录
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    回访方式
                  </label>
                  <div className="flex gap-2">
                    {visitMethodOptions.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setVisitMethod(m.value)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
                          visitMethod === m.value
                            ? "bg-flame-50 text-flame-600 border-flame-500"
                            : "bg-white text-ink-600 border-ink-200 hover:border-ink-300"
                        }`}
                      >
                        {m.icon}
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    回访结果
                  </label>
                  <textarea
                    value={visitResult}
                    onChange={(e) => setVisitResult(e.target.value)}
                    placeholder="请输入回访结果..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-flame-500/20 focus:border-flame-500 transition-shadow"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    客户反馈
                  </label>
                  <textarea
                    value={visitFeedback}
                    onChange={(e) => setVisitFeedback(e.target.value)}
                    placeholder="请输入客户反馈（选填）..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-ink-200 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-flame-500/20 focus:border-flame-500 transition-shadow"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-ink-700 mb-2 block">
                    满意度
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSatisfaction(s)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            s <= satisfaction
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-ink-200 hover:text-ink-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-ink-600">
                      {satisfaction} 星
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddVisitLog}
                  disabled={!visitResult.trim()}
                  className="w-full py-2.5 rounded-lg text-sm font-medium bg-flame-600 text-white hover:bg-flame-700 transition-colors disabled:bg-ink-200 disabled:text-ink-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  提交回访记录
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {actions.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-flame-600" />
                状态流转
              </div>
              <div className="space-y-2">
                {actions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      action.primary
                        ? "bg-flame-600 text-white hover:bg-flame-700"
                        : "bg-ink-50 text-ink-700 hover:bg-ink-100 border border-ink-200"
                    }`}
                  >
                    {action.primary && <HandshakeIcon className="w-4 h-4" />}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {verification && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="text-sm font-medium text-ink-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                关联核销单
              </div>
              <Link
                to={`/verification/${verification.id}`}
                className="block p-4 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors border border-ink-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-ink-900">
                    {verification.id}
                  </span>
                  <StatusBadge type="verification" value={verification.status} />
                </div>
                <div className="text-sm text-ink-600 line-clamp-1">
                  {verification.couponName}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-ink-400">
                    {verification.tableNo} · {verification.peopleCount}人
                  </span>
                  <span className="text-sm font-bold text-flame-600">
                    ¥{verification.amount}
                  </span>
                </div>
              </Link>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-3 flex items-center gap-2">
              <Printer className="w-4 h-4 text-ink-600" />
              快捷操作
            </div>
            <div className="space-y-2">
              <QuickActionButton icon={<Printer className="w-4 h-4" />}>
                打印客诉单
              </QuickActionButton>
              <QuickActionButton icon={<PhoneCall className="w-4 h-4" />}>
                联系客户
              </QuickActionButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center text-ink-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-ink-400">{label}</div>
        <div className="text-sm text-ink-800 mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}

function QuickActionButton({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-ink-200 bg-white text-ink-700 hover:bg-ink-50 transition-colors"
    >
      {icon}
      {children}
    </button>
  );
}
