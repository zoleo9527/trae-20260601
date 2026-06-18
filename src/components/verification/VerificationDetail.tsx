import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import StatusBadge from "@/components/common/StatusBadge";
import { ArrowLeft, Building2, MapPin, Users, Calendar, Receipt, User, AlertTriangle, MessageSquarePlus, ChevronRight, FileText, X, Eye } from "lucide-react";
import type { SeverityLevel, ResponsibleParty } from "@/types";

export default function VerificationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const verification = useAppStore((s) => s.verifications.find((v) => v.id === id));
  const complaint = useAppStore((s) => verification?.complaintId ? s.complaints.find((c) => c.id === verification.complaintId) : undefined);
  const createComplaint = useAppStore((s) => s.createComplaint);

  const [showModal, setShowModal] = useState(false);
  const [source, setSource] = useState<"现场" | "电话" | "平台">("现场");
  const [content, setContent] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("normal");
  const [responsibleParty, setResponsibleParty] = useState<ResponsibleParty>("front");
  const [contentError, setContentError] = useState("");

  const handleOpenModal = () => {
    setShowModal(true);
    setSource("现场");
    setContent("");
    setSeverity("normal");
    setResponsibleParty("front");
    setContentError("");
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      setContentError("投诉内容不能为空");
      return;
    }

    if (!verification) return;

    const complaintId = createComplaint({
      verificationId: verification.id,
      source,
      content: content.trim(),
      severity,
      responsibleParty,
    });

    setShowModal(false);
    navigate(`/complaints/${complaintId}`);
  };

  if (!verification) {
    return <div className="p-10 text-center text-ink-500">未找到该核销记录</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/verification")} className="p-2 rounded-lg hover:bg-ink-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-ink-600" />
        </button>
        <div>
          <div className="text-sm text-ink-500">核销单号</div>
          <div className="text-xl font-bold text-ink-900 font-mono">{verification.id}</div>
        </div>
        <div className="ml-4"><StatusBadge type="verification" value={verification.status} /></div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-600" />
              核销信息
            </div>
            <div className="grid grid-cols-2 gap-y-5 gap-x-8">
              <DetailRow icon={<Building2 className="w-4 h-4" />} label="团购平台" value={<span className={verification.platform === "美团" ? "text-yellow-600" : verification.platform === "抖音" ? "text-ink-900" : "text-red-600"}>{verification.platform}</span>} />
              <DetailRow icon={<FileText className="w-4 h-4" />} label="套餐名称" value={verification.couponName} />
              <DetailRow icon={<MapPin className="w-4 h-4" />} label="桌号" value={<span className="font-bold text-ink-900">{verification.tableNo}</span>} />
              <DetailRow icon={<Users className="w-4 h-4" />} label="用餐人数" value={`${verification.peopleCount} 人`} />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="核销时间" value={<span className="font-mono">{verification.verifyTime}</span>} />
              <DetailRow icon={<User className="w-4 h-4" />} label="核销人" value={verification.cashier} />
            </div>
          </div>

          {verification.remark && (
            <div className={`rounded-xl shadow-card p-6 border-l-4 ${verification.status === "abnormal" ? "bg-flame-50/50 border-flame-500" : "bg-ink-50 border-ink-400"}`}>
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${verification.status === "abnormal" ? "text-flame-600" : "text-ink-500"}`} />
                <div>
                  <div className="text-sm font-medium text-ink-900">
                    {verification.status === "abnormal" ? "异常说明" : "备注"}
                  </div>
                  <p className="text-sm text-ink-600 mt-1">{verification.remark}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-flame-600" />
                关联客诉
                {complaint && (
                  <span className="text-xs text-flame-600 font-normal">已关联客诉，点击查看详情</span>
                )}
              </div>
              {!complaint && (
                <button
                  onClick={handleOpenModal}
                  className="text-xs px-3 py-1.5 rounded-lg bg-flame-600 text-white hover:bg-flame-700 transition-colors"
                >
                  发起客诉
                </button>
              )}
            </div>

            {complaint ? (
              <Link
                to={`/complaints/${complaint.id}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-ink-50 hover:bg-ink-100 transition-colors border border-ink-200 border-l-4 border-l-flame-500"
              >
                <div className="w-10 h-10 rounded-lg bg-flame-50 text-flame-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-ink-900">{complaint.id}</span>
                    <StatusBadge type="complaint" value={complaint.status} />
                    <StatusBadge type="severity" value={complaint.severity} />
                  </div>
                  <p className="text-sm text-ink-600 mt-1 line-clamp-1">{complaint.content}</p>
                  <div className="text-xs text-ink-400 mt-1">
                    来源：{complaint.source} · 处理人：{complaint.handler} · {complaint.createTime}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-400 flex-shrink-0" />
              </Link>
            ) : (
              <div className="text-center py-8 text-ink-400 text-sm">
                该核销单暂无客诉，如客户有投诉可点击右上角发起
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-brand-500 to-flame-600 rounded-xl shadow-card p-6 text-white">
            <div className="text-sm text-white/80">核销金额</div>
            <div className="text-4xl font-bold font-mono mt-2">¥{verification.amount}</div>
            <div className="text-xs text-white/60 mt-2">已收款 · 支付成功</div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-medium text-ink-900 mb-3">快捷操作</div>
            <div className="space-y-2">
              {complaint ? (
                <ActionButton
                  variant="secondary"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={() => navigate(`/complaints/${complaint.id}`)}
                >
                  查看客诉详情
                </ActionButton>
              ) : (
                <ActionButton variant="primary" icon={<MessageSquarePlus className="w-4 h-4" />} onClick={handleOpenModal}>
                  发起客诉
                </ActionButton>
              )}
              <ActionButton variant="secondary" icon={<FileText className="w-4 h-4" />}>
                打印核销单
              </ActionButton>
              <ActionButton variant="secondary" icon={<Receipt className="w-4 h-4" />}>
                申请退款
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-pop w-full max-w-md relative">
            <div className="flex items-center justify-between p-5 border-b border-ink-100">
              <div className="text-lg font-semibold text-ink-900">发起客诉</div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg hover:bg-ink-100 transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">客诉来源</label>
                <div className="flex gap-2">
                  {(["现场", "电话", "平台"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSource(s)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        source === s
                          ? "bg-flame-50 text-flame-600 border-flame-500"
                          : "bg-white text-ink-600 border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">投诉内容</label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (contentError) setContentError("");
                  }}
                  placeholder="请输入投诉内容..."
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-flame-500/20 transition-shadow ${
                    contentError ? "border-flame-500" : "border-ink-200"
                  }`}
                />
                {contentError && (
                  <div className="text-xs text-flame-600 mt-1">{contentError}</div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">严重程度</label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "normal" as const, label: "一般" },
                      { value: "serious" as const, label: "严重" },
                      { value: "urgent" as const, label: "紧急" },
                    ]
                  ).map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSeverity(s.value)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        severity === s.value
                          ? "bg-flame-50 text-flame-600 border-flame-500"
                          : "bg-white text-ink-600 border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-ink-700 mb-2 block">责任方</label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "front" as const, label: "前厅" },
                      { value: "kitchen" as const, label: "后厨" },
                      { value: "both" as const, label: "共同" },
                    ]
                  ).map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setResponsibleParty(r.value)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                        responsibleParty === r.value
                          ? "bg-flame-50 text-flame-600 border-flame-500"
                          : "bg-white text-ink-600 border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-ink-100">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-ink-50 text-ink-700 hover:bg-ink-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-flame-600 text-white hover:bg-flame-700 transition-colors"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center text-ink-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs text-ink-400">{label}</div>
        <div className="text-sm text-ink-800 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function ActionButton({ children, variant = "secondary", icon, onClick }: { children: React.ReactNode; variant?: "primary" | "secondary"; icon?: React.ReactNode; onClick?: () => void }) {
  const cls =
    variant === "primary"
      ? "bg-flame-600 text-white hover:bg-flame-700 border-transparent"
      : "bg-white text-ink-700 hover:bg-ink-50 border-ink-200";
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${cls}`}>
      {icon}
      {children}
    </button>
  );
}
