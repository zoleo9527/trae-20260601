import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Tag,
  FileText,
  XCircle,
  CheckCircle,
  Edit3,
  Wrench,
} from "lucide-react";
import { useReviewStore } from "@/store/useReviewStore";
import { useUserStore } from "@/store/useUserStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RejectBadge } from "@/components/common/RejectBadge";
import { SupplementBadge } from "@/components/common/SupplementBadge";
import { Timeline } from "@/components/common/Timeline";
import { Modal } from "@/components/common/Modal";
import { formatAmount } from "@/utils/date";
import { ROLE_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";

export function OrderDetail() {
  const { id: reviewId, orderId } = useParams<{ id: string; orderId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const {
    currentOrder,
    currentReview,
    fetchOrderById,
    rejectOrder,
    confirmOrder,
    supplementOrder,
    processOrder,
    reviews,
  } = useReviewStore();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [supplementNotes, setSupplementNotes] = useState("");
  const [processResult, setProcessResult] = useState("");

  useEffect(() => {
    if (reviewId && orderId) {
      if (reviews.length === 0) {
        fetchOrderById(reviewId, orderId);
      } else {
        const review = reviews.find((r) => r.id === reviewId);
        const order = review?.abnormalOrders.find((o) => o.id === orderId);
        if (order) {
          fetchOrderById(reviewId, orderId);
        }
      }
    }
  }, [reviewId, orderId, fetchOrderById, reviews]);

  if (!currentOrder || !currentReview) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>;
  }

  const handleReject = () => {
    if (!rejectReason.trim() || !reviewId || !orderId) return;
    rejectOrder(reviewId, orderId, rejectReason);
    setShowRejectModal(false);
    setRejectReason("");
    fetchOrderById(reviewId, orderId);
  };

  const handleConfirm = () => {
    if (reviewId && orderId) {
      confirmOrder(reviewId, orderId);
      fetchOrderById(reviewId, orderId);
    }
  };

  const handleSupplement = () => {
    if (!supplementNotes.trim() || !reviewId || !orderId) return;
    supplementOrder(reviewId, orderId, supplementNotes);
    setShowSupplementModal(false);
    setSupplementNotes("");
    fetchOrderById(reviewId, orderId);
  };

  const handleProcess = () => {
    if (!processResult.trim() || !reviewId || !orderId) return;
    processOrder(reviewId, orderId, processResult);
    setShowProcessModal(false);
    setProcessResult("");
    fetchOrderById(reviewId, orderId);
  };

  return (
    <div>
      <button
        onClick={() => navigate(`/reviews/${reviewId}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-navy-600 mb-4"
      >
        <ArrowLeft size={18} />
        返回复盘详情
      </button>

      <div className="bg-white rounded-lg border shadow-card p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-navy-900">异常订单详情</h1>
              <StatusBadge status={currentOrder.status} type="order" />
              {currentOrder.rejectReason && <RejectBadge reason={currentOrder.rejectReason} showReason />}
              {currentOrder.supplementRequired && <SupplementBadge notes={currentOrder.supplementNotes} showNotes />}
            </div>
            <p className="font-mono text-sm text-gray-500">{currentOrder.orderNo}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">所属复盘单</p>
            <p className="font-medium text-navy-600">{currentReview.sessionNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">商品信息</h3>
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <img
                src={currentOrder.productImage}
                alt={currentOrder.productName}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900 mb-2">{currentOrder.productName}</p>
                <p className="text-lg font-bold text-navy-600">{formatAmount(currentOrder.amount)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">买家信息</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <span className="text-gray-900">{currentOrder.buyerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <span className="text-gray-900">{currentOrder.buyerPhone}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">异常信息</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-gray-400" />
                <span className="text-gray-900">
                  异常类型：<span className="font-medium">{currentOrder.abnormalType}</span>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <FileText size={16} className="text-gray-400 mt-0.5" />
                <span className="text-gray-900">{currentOrder.abnormalDesc}</span>
              </div>
            </div>
          </div>

          {currentOrder.processResult && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">处理结果</h3>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-gray-900">{currentOrder.processResult}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">操作日志</h2>
            <Timeline logs={currentOrder.operationLogs} />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">操作</h2>
            <div className="space-y-3">
              {currentUser.role === "controller" &&
                currentReview.currentHandler === "controller" &&
                currentOrder.status !== "rejected" &&
                currentOrder.status !== "confirmed" &&
                currentOrder.status !== "resolved" && (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-status-error text-status-error rounded-md hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={18} />
                      驳回订单
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-600 text-white rounded-md hover:bg-navy-700 transition-colors"
                    >
                      <CheckCircle size={18} />
                      确认异常
                    </button>
                  </>
                )}

              {currentUser.role === "assistant" &&
                currentOrder.status === "rejected" &&
                currentReview.currentHandler === "assistant" && (
                  <button
                    onClick={() => setShowSupplementModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                  >
                    <Edit3 size={18} />
                    补录信息重新提交
                  </button>
                )}

              {currentUser.role === "aftersales" &&
                (currentOrder.status === "confirmed" || currentOrder.status === "processing") &&
                currentReview.currentHandler === "aftersales" && (
                  <button
                    onClick={() => setShowProcessModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-status-success text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    <Wrench size={18} />
                    记录处理结果
                  </button>
                )}

              {currentOrder.status === "resolved" && (
                <div className="text-center py-4 text-gray-500">
                  该异常订单已处理完成
                </div>
              )}

              {currentOrder.status !== "resolved" && currentReview.currentHandler !== currentUser.role && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">当前由 <span className={cn("font-medium", ROLE_MAP[currentReview.currentHandler].color)}>{ROLE_MAP[currentReview.currentHandler].label}</span> 处理中</p>
                  <p className="text-xs text-gray-400 mt-1">请等待流转到您的角色</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="驳回异常订单">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">驳回原因和补录要求</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因和补录要求..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
              rows={4}
            />
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
            注意：驳回订单后，复盘单将退回给主播助理进行补录
          </p>
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

      <Modal open={showSupplementModal} onClose={() => setShowSupplementModal(false)} title="补录异常订单信息">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">补充的信息</label>
            <textarea
              value={supplementNotes}
              onChange={(e) => setSupplementNotes(e.target.value)}
              placeholder="请补充相关证据和说明..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
              rows={4}
            />
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
            注意：补录完成后将重新提交给场控审核
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSupplementModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSupplement}
              disabled={!supplementNotes.trim()}
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              提交审核
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showProcessModal} onClose={() => setShowProcessModal(false)} title="记录处理结果">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
            <textarea
              value={processResult}
              onChange={(e) => setProcessResult(e.target.value)}
              placeholder="请记录处理结果..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 resize-none"
              rows={4}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowProcessModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleProcess}
              disabled={!processResult.trim()}
              className="px-4 py-2 bg-status-success text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              确认完成
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
