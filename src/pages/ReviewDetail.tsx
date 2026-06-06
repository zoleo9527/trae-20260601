import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  DollarSign,
  Eye,
  ShoppingCart,
  Send,
  XCircle,
  CheckCircle,
  Edit3,
  ArrowRight,
  Archive,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RejectBadge } from "@/components/common/RejectBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { Timeline } from "@/components/common/Timeline";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatAmount,
} from "@/utils/date";
import { ROLE_MAP, ORDER_STATUS_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentReview, fetchReviewById, rejectReview, confirmReview, supplementReview, transferToAftersales, closeReview, reviews } = useReviewStore();
  const { currentUser } = useUserStore();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [supplementText, setSupplementText] = useState("");

  useEffect(() => {
    if (id) {
      if (reviews.length === 0) {
        fetchReviewById(id);
      } else {
        const review = reviews.find((r) => r.id === id);
        if (review) {
          fetchReviewById(id);
        }
      }
    }
  }, [id, fetchReviewById, reviews.length, reviews]);

  if (!currentReview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  const handleReject = () => {
    if (id && rejectReason) {
      rejectReview(id, rejectReason);
      setShowRejectModal(false);
      setRejectReason("");
      fetchReviewById(id);
    }
  };

  const handleConfirm = () => {
    if (id) {
      confirmReview(id);
      fetchReviewById(id);
    }
  };

  const handleSupplement = () => {
    if (id) {
      supplementReview(id, { siteRecords: supplementText });
      setShowSupplementModal(false);
      setSupplementText("");
      fetchReviewById(id);
    }
  };

  const handleTransfer = () => {
    if (id) {
      transferToAftersales(id);
      fetchReviewById(id);
    }
  };

  const handleClose = () => {
    if (id) {
      closeReview(id);
      fetchReviewById(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/reviews")}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-serif text-navy-900">
              {currentReview.liveTitle}
            </h1>
            <StatusBadge status={currentReview.status} type="review" />
            {currentReview.rejectReason && <RejectBadge reason={currentReview.rejectReason} showReason />}
            {currentReview.supplementRequired && <SupplementBadge notes={currentReview.supplementNotes} showNotes />}
          </div>
          <p className="text-gray-500 mt-1">
            场次号：{currentReview.sessionNo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">直播信息</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">主播</p>
                  <p className="text-sm font-medium">{currentReview.anchorName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">主播助理</p>
                  <p className="text-sm font-medium">{currentReview.assistantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">开播时间</p>
                  <p className="text-sm font-medium">
                    {formatDateTime(currentReview.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">直播时长</p>
                  <p className="text-sm font-medium">
                    {formatDuration(currentReview.duration)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">GMV</p>
                  <p className="text-sm font-medium text-amber-600">
                    ¥{formatNumber(currentReview.gmv)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">订单数</p>
                  <p className="text-sm font-medium">{formatNumber(currentReview.orderCount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">观看人数</p>
                  <p className="text-sm font-medium">{formatNumber(currentReview.viewerCount)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">现场记录与台账</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">现场记录</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {currentReview.siteRecords}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">旧台账备注</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {currentReview.oldLedger}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">
              异常订单 ({currentReview.abnormalOrders.length})
            </h2>
            <div className="space-y-3">
              {currentReview.abnormalOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/reviews/${id}/orders/${order.id}`)}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                    order.status === "rejected" ? "bg-red-50 border-red-200" : "",
                    order.supplementRequired ? "bg-orange-50 border-orange-200" : ""
                  )}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-navy-600">
                          {order.orderNo}
                        </span>
                        <StatusBadge status={order.status} type="order" />
                        {order.rejectReason && <RejectBadge />}
                        {order.supplementRequired && <SupplementBadge />}
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.productName}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{order.buyerName}</span>
                        <span>{order.abnormalType}</span>
                        <span className="text-amber-600 font-medium">
                          {formatAmount(order.amount)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">操作日志</h2>
            <Timeline logs={currentReview.operationLogs} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">处理流程</h2>
            <div className="space-y-3">
              {[
                { role: "assistant", label: "主播助理", desc: "创建并提交复盘" },
                { role: "controller", label: "场控", desc: "审核并确认异常" },
                { role: "aftersales", label: "售后组长", desc: "处理异常订单" },
              ].map((step, index) => {
                const isActive = currentReview.currentHandler === step.role;
                return (
                  <div key={step.role} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                        isActive
                          ? "bg-amber-500 ring-4 ring-amber-100"
                          : "bg-gray-300"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          isActive ? "text-amber-600" : "text-gray-600"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">{step.desc}</p>
                    </div>
                    {isActive && (
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                        当前
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">操作</h2>
            <div className="space-y-3">
              {currentUser.role === "controller" &&
                currentReview.currentHandler === "controller" &&
                currentReview.status !== "rejected" && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-status-error text-status-error rounded-md hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={18} />
                      驳回复盘
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-600 text-white rounded-md hover:bg-navy-700 transition-colors"
                    >
                      <CheckCircle size={18} />
                      确认并流转售后
                    </button>
                  </>
                )}

              {currentUser.role === "assistant" &&
                currentReview.status === "rejected" &&
                currentReview.currentHandler === "assistant" && (
                  <button
                    onClick={() => setShowSupplementModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  >
                    <Edit3 size={18} />
                    补录信息并重新提交
                  </button>
                )}

              {currentUser.role === "aftersales" &&
                currentReview.status === "confirmed" &&
                currentReview.currentHandler === "aftersales" && (
                  <button
                    onClick={handleTransfer}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-status-info text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <Send size={18} />
                    接收处理
                  </button>
                )}

              {currentUser.role === "aftersales" &&
                currentReview.status === "processing" &&
                currentReview.currentHandler === "aftersales" && (
                  <button
                    onClick={handleClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-status-success text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <Archive size={18} />
                    关闭复盘单
                  </button>
                )}

              {currentReview.status === "closed" && (
                <div className="text-center py-4 text-gray-500">
                  该复盘单已关闭
                </div>
              )}

              {currentReview.status !== "closed" && currentReview.currentHandler !== currentUser.role && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">当前由 <span className={cn("font-medium", ROLE_MAP[currentReview.currentHandler].color)}>{ROLE_MAP[currentReview.currentHandler].label}</span> 处理中</p>
                  <p className="text-xs text-gray-400 mt-1">请等待流转到您的角色</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">驳回复盘单</h3>
            <p className="text-sm text-gray-600 mb-4">请填写驳回原因，主播助理将收到补录提醒</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因和补录要求..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 h-32 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-status-error text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {showSupplementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">补录信息</h3>
            {currentReview.supplementNotes && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-700 font-medium">补录要求：</p>
                <p className="text-sm text-orange-600 mt-1">
                  {currentReview.supplementNotes}
                </p>
              </div>
            )}
            <textarea
              value={supplementText}
              onChange={(e) => setSupplementText(e.target.value)}
              placeholder="请补充现场记录信息..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 h-32 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowSupplementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSupplement}
                disabled={!supplementText}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                提交补录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
