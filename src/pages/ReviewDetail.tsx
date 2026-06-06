import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  DollarSign,
  Eye,
  Send,
  XCircle,
  CheckCircle,
  Edit3,
  ArrowRight,
  Archive,
  AlertTriangle,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RejectBadge } from "@/components/common/RejectBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { Timeline } from "@/components/common/Timeline";
import { Modal } from "@/components/common/Modal";
import {
  formatDateTime,
  formatDuration,
  formatNumber,
  formatAmount,
} from "@/utils/date";
import { ROLE_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const {
    currentReview,
    fetchReviewById,
    rejectReview,
    confirmReview,
    supplementReview,
    transferToAftersales,
    closeReview,
    canCloseReview,
    reviews,
  } = useReviewStore();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [supplementData, setSupplementData] = useState({
    siteRecords: "",
    oldLedger: "",
  });
  const [showCloseAlert, setShowCloseAlert] = useState(false);

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
  }, [id, fetchReviewById, reviews]);

  useEffect(() => {
    if (currentReview) {
      setSupplementData({
        siteRecords: currentReview.siteRecords,
        oldLedger: currentReview.oldLedger,
      });
    }
  }, [currentReview]);

  if (!currentReview) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    if (id) {
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
      supplementReview(id, supplementData);
      setShowSupplementModal(false);
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
    if (!id) return;
    if (!canCloseReview(id)) {
      setShowCloseAlert(true);
      return;
    }
    const success = closeReview(id);
    if (success) {
      fetchReviewById(id);
    }
  };

  const unresolvedCount = currentReview.abnormalOrders.filter(
    (o) => o.status !== "resolved"
  ).length;

  return (
    <div>
      <button
        onClick={() => navigate("/reviews")}
        className="flex items-center gap-2 text-gray-600 hover:text-navy-600 mb-4"
      >
        <ArrowLeft size={18} />
        返回列表
      </button>

      <div className="bg-white rounded-lg border shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-navy-900">{currentReview.liveTitle}</h1>
              <StatusBadge status={currentReview.status} type="review" />
              {currentReview.rejectReason && <RejectBadge reason={currentReview.rejectReason} showReason />}
              {currentReview.supplementRequired && <SupplementBadge notes={currentReview.supplementNotes} showNotes />}
            </div>
            <p className="font-mono text-sm text-gray-500">{currentReview.sessionNo}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">当前处理</p>
            <p className={cn("font-medium", ROLE_MAP[currentReview.currentHandler].color)}>
              {ROLE_MAP[currentReview.currentHandler].label}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">主播：{currentReview.anchorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">助理：{currentReview.assistantName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{formatDateTime(currentReview.startTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{formatDuration(currentReview.duration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">GMV：¥{formatNumber(currentReview.gmv)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">观看：{formatNumber(currentReview.viewerCount)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">现场记录</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{currentReview.siteRecords}</p>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">旧台账背景</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{currentReview.oldLedger}</p>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy-900">异常订单</h2>
              {unresolvedCount > 0 && (
                <span className="flex items-center gap-1 text-sm text-status-error">
                  <AlertTriangle size={14} />
                  {unresolvedCount} 单未处理完成
                </span>
              )}
            </div>
            <div className="space-y-3">
              {currentReview.abnormalOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/reviews/${id}/orders/${order.id}`)}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                    order.status === "rejected" && "bg-red-50 border-red-200",
                    order.supplementRequired && "bg-orange-50 border-orange-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={order.productImage}
                        alt={order.productName}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{order.productName}</p>
                        <p className="text-sm text-gray-500">订单号：{order.orderNo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} type="order" />
                      {order.rejectReason && <RejectBadge />}
                      {order.supplementRequired && <SupplementBadge />}
                      <p className="text-sm font-medium text-navy-600 mt-1">{formatAmount(order.amount)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">异常类型：{order.abnormalType}</span>
                    <span className="text-navy-600 flex items-center gap-1">
                      查看详情 <ArrowRight size={14} />
                    </span>
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
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-colors",
                      unresolvedCount > 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-status-success text-white hover:bg-green-600"
                    )}
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

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="驳回复盘单">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">驳回原因</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因和补录要求..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
              rows={4}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim()}
              className="px-4 py-2 bg-status-error text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              确认驳回
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showSupplementModal} onClose={() => setShowSupplementModal(false)} title="补录信息">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">现场记录</label>
            <textarea
              value={supplementData.siteRecords}
              onChange={(e) => setSupplementData((prev) => ({ ...prev, siteRecords: e.target.value }))}
              placeholder="请补充现场记录详情..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">旧台账背景</label>
            <textarea
              value={supplementData.oldLedger}
              onChange={(e) => setSupplementData((prev) => ({ ...prev, oldLedger: e.target.value }))}
              placeholder="请补充旧台账对比信息..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSupplementModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSupplement}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
            >
              提交审核
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showCloseAlert} onClose={() => setShowCloseAlert(false)} title="无法关闭复盘单">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={24} className="text-status-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">还有异常订单未处理完成</p>
              <p className="text-sm text-gray-500 mt-1">
                还有 <span className="font-medium text-status-error">{unresolvedCount}</span> 个异常订单未处理完成，
                请先处理所有异常订单后再关闭复盘单。
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setShowCloseAlert(false)}
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700 transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
