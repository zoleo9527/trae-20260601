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
import { formatDateTime, formatAmount } from "@/utils/date";
import { ROLE_MAP } from "@/utils/status";
import { cn } from "@/lib/utils";

export function OrderDetail() {
  const { id: reviewId, orderId } = useParams<{ id: string; orderId: string }>();
  const navigate = useNavigate();
  const { currentOrder, currentReview, fetchOrderById, rejectOrder, confirmOrder, supplementOrder, processOrder, reviews } = useReviewStore();
  const { currentUser } = useUserStore();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSupplementModal, setShowSupplementModal] = useState(false);
  const [supplementText, setSupplementText] = useState("");
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processResult, setProcessResult] = useState("");

  useEffect(() => {
    if (reviewId && orderId) {
      if (reviews.length === 0) {
        fetchOrderById(reviewId, orderId);
      } else {
        fetchOrderById(reviewId, orderId);
      }
    }
  }, [reviewId, orderId, fetchOrderById, reviews.length]);

  if (!currentOrder || !currentReview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  const handleReject = () => {
    if (reviewId && orderId && rejectReason) {
      rejectOrder(reviewId, orderId, rejectReason);
      setShowRejectModal(false);
      setRejectReason("");
      fetchOrderById(reviewId, orderId);
    }
  };

  const handleConfirm = () => {
    if (reviewId && orderId) {
      confirmOrder(reviewId, orderId);
      fetchOrderById(reviewId, orderId);
    }
  };

  const handleSupplement = () => {
    if (reviewId && orderId && supplementText) {
      supplementOrder(reviewId, orderId, supplementText);
      setShowSupplementModal(false);
      setSupplementText("");
      fetchOrderById(reviewId, orderId);
    }
  };

  const handleProcess = () => {
    if (reviewId && orderId && processResult) {
      processOrder(reviewId, orderId, processResult);
      setShowProcessModal(false);
      setProcessResult("");
      fetchOrderById(reviewId, orderId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/reviews/${reviewId}`)}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-serif text-navy-900">
              异常订单详情
            </h1>
            <StatusBadge status={currentOrder.status} type="order" />
            {currentOrder.rejectReason && <RejectBadge reason={currentOrder.rejectReason} showReason />}
            {currentOrder.supplementRequired && <SupplementBadge notes={currentOrder.supplementNotes} showNotes />}
          </div>
          <p className="text-gray-500 mt-1">
            订单号：{currentOrder.orderNo} | 所属场次：{currentReview.sessionNo}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">商品信息</h2>
            <div className="flex items-start gap-4">
              <img
                src={currentOrder.productImage}
                alt={currentOrder.productName}
                className="w-24 h-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentOrder.productName}
                </h3>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  {formatAmount(currentOrder.amount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">买家信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">买家昵称</p>
                  <p className="text-sm font-medium">{currentOrder.buyerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">联系电话</p>
                  <p className="text-sm font-medium">{currentOrder.buyerPhone}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">异常信息</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">异常类型</p>
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-status-error" />
                  <span className="text-sm text-gray-600 bg-red-50 px-2 py-1 rounded">
                    {currentOrder.abnormalType}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">异常描述</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {currentOrder.abnormalDesc}
                </p>
              </div>
              {currentOrder.processResult && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">处理结果</p>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-md border border-green-200">
                    {currentOrder.processResult}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">操作日志</h2>
            <Timeline logs={currentOrder.operationLogs} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border shadow-card p-6">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">处理流程</h2>
            <div className="space-y-3">
              {[
                { role: "assistant", label: "主播助理", desc: "标记异常订单" },
                { role: "controller", label: "场控", desc: "核实异常真实性" },
                { role: "aftersales", label: "售后组长", desc: "处理订单问题" },
              ].map((step, index) => {
                const isActive = currentReview.currentHandler === step.role && currentOrder.status !== "resolved";
                return (
                  <div key={step.role} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                        isActive
                          ? "bg-amber-500 ring-4 ring-amber-100"
                          : "bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? "text-amber-600" : "text-gray-600"}`}>
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

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">驳回异常订单</h3>
            <p className="text-sm text-gray-600 mb-4">请填写驳回原因，主播助理将收到补录提醒</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因..."
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
            {currentOrder.supplementNotes && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-700 font-medium">补录要求：</p>
                <p className="text-sm text-orange-600 mt-1">
                  {currentOrder.supplementNotes}
                </p>
              </div>
            )}
            <textarea
              value={supplementText}
              onChange={(e) => setSupplementText(e.target.value)}
              placeholder="请补充异常订单相关信息..."
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

      {showProcessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-navy-900 mb-4">记录处理结果</h3>
            <textarea
              value={processResult}
              onChange={(e) => setProcessResult(e.target.value)}
              placeholder="请输入处理结果，如：已全额退款、已补发商品、已补偿优惠券等..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 h-32 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowProcessModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleProcess}
                disabled={!processResult}
                className="flex-1 px-4 py-2 bg-status-success text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
