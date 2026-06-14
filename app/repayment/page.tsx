"use client";

import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import Timeline from "@/components/Timeline";
import { useUser } from "@/contexts/UserContext";
import { ExceptionRecord, OperationLog, RepaymentPlan, RepaymentStatus } from "@/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  FilePlus,
  FileText,
  Filter,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RepaymentPage() {
  const [repayments, setRepayments] = useState<RepaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showExceptionDrawer, setShowExceptionDrawer] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState<RepaymentPlan | null>(null);
  const [exceptionType, setExceptionType] = useState<string>("OVERDUE");
  const [exceptionDescription, setExceptionDescription] = useState<string>("");
  const [showPartialPayModal, setShowPartialPayModal] = useState(false);
  const [partialAmount, setPartialAmount] = useState<string>("");
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [showHandleExceptionModal, setShowHandleExceptionModal] = useState(false);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [handleAction, setHandleAction] = useState<string>("REMIND");
  const [handleNote, setHandleNote] = useState<string>("");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      fetchRepayments();
    }
  }, [user, router, selectedStatus]);

  const fetchRepayments = async () => {
    setLoading(true);
    try {
      const url = selectedStatus
        ? `/api/repayments?status=${selectedStatus}`
        : "/api/repayments";
      const response = await fetch(url);
      const data = await response.json();
      setRepayments(data || []);
    } catch (error) {
      console.error("获取还款计划列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOperationLogs = async (businessId: string, filterFn?: (log: any) => boolean) => {
    try {
      const response = await fetch(`/api/trace/${businessId}`);
      const data = await response.json();
      const logs = data.timeline || [];
      if (filterFn) {
        setOperationLogs(logs.filter(filterFn));
      } else {
        setOperationLogs(logs);
      }
    } catch (error) {
      console.error("获取操作日志失败:", error);
    }
  };

  const getRepaymentLogFilter = (repayment: RepaymentPlan) => {
    const exceptionIds = repayment.exceptions?.map((e: any) => e.id) || [];
    return (log: any) => {
      if (log.businessId === repayment.id && log.businessType === "REPAYMENT") {
        return true;
      }
      if (exceptionIds.includes(log.businessId) && log.businessType === "EXCEPTION") {
        return true;
      }
      return false;
    };
  };

  const handleMarkException = async () => {
    if (!selectedRepayment) return;

    try {
      const response = await fetch(`/api/repayments/${selectedRepayment.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: exceptionType,
          description: exceptionDescription,
          operatorId: user?.id,
          operatorName: user?.name,
        }),
      });

      if (response.ok) {
        setShowExceptionDrawer(false);
        setSelectedRepayment(null);
        setExceptionType("OVERDUE");
        setExceptionDescription("");
        fetchRepayments();
      }
    } catch (error) {
      console.error("标记异常失败:", error);
    }
  };

  const handleMarkPaid = async (repayment: RepaymentPlan) => {
    try {
      const response = await fetch(`/api/repayments/${repayment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "PAID",
          paidAmount: repayment.amount,
          operatorId: user?.id,
          operatorName: user?.name,
        }),
      });

      if (response.ok) {
        fetchRepayments();
      }
    } catch (error) {
      console.error("标记已还款失败:", error);
    }
  };

  const handlePartialPay = async () => {
    if (!selectedRepayment || !partialAmount) return;

    const amount = parseFloat(partialAmount);
    if (amount <= 0 || amount > selectedRepayment.amount) return;

    try {
      const newPaidAmount = selectedRepayment.paidAmount + amount;
      const newStatus = newPaidAmount >= selectedRepayment.amount ? "PAID" : "PARTIAL_PAID";

      const response = await fetch(`/api/repayments/${selectedRepayment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          paidAmount: newPaidAmount,
          operatorId: user?.id,
          operatorName: user?.name,
        }),
      });

      if (response.ok) {
        setShowPartialPayModal(false);
        setPartialAmount("");
        fetchRepayments();
      }
    } catch (error) {
      console.error("部分还款失败:", error);
    }
  };

  const handleExceptionAction = async () => {
    if (!selectedException || !selectedRepayment) return;

    try {
      const response = await fetch(
        `/api/exceptions/${selectedException.id}/handle`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: handleAction,
            note: handleNote,
            operatorId: user?.id,
            operatorName: user?.name,
          }),
        }
      );

      if (response.ok) {
        setShowHandleExceptionModal(false);
        setSelectedException(null);
        setHandleAction("REMIND");
        setHandleNote("");
        fetchRepayments();

        const repaymentResponse = await fetch(`/api/repayments?applicationId=${selectedRepayment.applicationId}`);
        const allRepayments = await repaymentResponse.json();
        const updatedRepayment = allRepayments.find((r: any) => r.id === selectedRepayment.id);
        
        if (updatedRepayment) {
          setSelectedRepayment(updatedRepayment);
          await fetchOperationLogs(updatedRepayment.applicationId, getRepaymentLogFilter(updatedRepayment));
        }
      }
    } catch (error) {
      console.error("处理异常失败:", error);
    }
  };

  const openDetailDrawer = async (repayment: RepaymentPlan) => {
    setSelectedRepayment(repayment);
    setShowDetailDrawer(true);
    await fetchOperationLogs(repayment.applicationId, getRepaymentLogFilter(repayment));
  };

  const statusOptions: RepaymentStatus[] = [
    "PENDING",
    "PAID",
    "OVERDUE",
    "PARTIAL_PAID",
  ];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "待还款",
      PAID: "已还款",
      OVERDUE: "逾期",
      PARTIAL_PAID: "部分还款",
    };
    return labels[status] || status;
  };

  const actionOptions = [
    { value: "REMIND", label: "发送提醒", icon: Bell },
    { value: "RETURN", label: "退回处理", icon: ArrowLeftRight },
    { value: "SUPPLEMENT", label: "补充资料", icon: FilePlus },
    { value: "COLLECTION", label: "催收处理", icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">还款计划</h1>
          <p className="text-gray-600">管理和查看还款计划，处理还款异常</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">全部状态</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getStatusLabel(status)}
                </option>
              ))}
            </select>

            <button
              onClick={fetchRepayments}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>刷新</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        ) : repayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">暂无还款计划</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repayments.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      第{plan.period}期
                    </span>
                    <StatusBadge status={plan.status} type="repayment" />
                  </div>
                  <button
                    onClick={() => openDetailDrawer(plan)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    借款人: {plan.application?.borrowerName || "未知"}
                  </div>
                  <div className="text-lg font-bold text-primary">
                    ¥{plan.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    应还日期:{" "}
                    {format(new Date(plan.dueDate), "yyyy-MM-dd", {
                      locale: zhCN,
                    })}
                  </div>
                  {plan.paidAmount > 0 && (
                    <div className="text-sm text-success mt-2">
                      已还金额: ¥{plan.paidAmount.toLocaleString()}
                      <span className="text-gray-500 ml-2">
                        (剩余: ¥{(plan.amount - plan.paidAmount).toLocaleString()})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => openDetailDrawer(plan)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    详情
                  </button>

                  {plan.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleMarkPaid(plan)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-success hover:bg-success/10 rounded transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        已还款
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRepayment(plan);
                          setShowPartialPayModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        部分还款
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRepayment(plan);
                          setShowExceptionDrawer(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        标记异常
                      </button>
                    </>
                  )}

                  {plan.status === "PARTIAL_PAID" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedRepayment(plan);
                          setShowPartialPayModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                        继续还款
                      </button>

                      <button
                        onClick={() => {
                          setSelectedRepayment(plan);
                          setShowExceptionDrawer(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        标记异常
                      </button>
                    </>
                  )}
                </div>

                {plan.exceptions && plan.exceptions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-500 mb-2">异常记录:</div>
                    {plan.exceptions.map((exception) => (
                      <div
                        key={exception.id}
                        className="text-xs bg-error/10 p-2 rounded mb-1 cursor-pointer hover:bg-error/20"
                        onClick={() => {
                          setSelectedException(exception);
                          setSelectedRepayment(plan);
                          setShowHandleExceptionModal(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-error">
                            {exception.type}
                          </div>
                          <StatusBadge status={exception.status} type="exception" />
                        </div>
                        <div className="text-gray-600 mt-1">
                          {exception.description}
                        </div>
                        {exception.status !== "RESOLVED" && (
                          <div className="text-primary mt-1 text-xs">
                            点击处理 →
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {plan.collections && plan.collections.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-500 mb-2">催收记录:</div>
                    {plan.collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="text-xs bg-warning/10 p-2 rounded mb-1"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-warning" />
                          <span className="font-medium text-warning">
                            {collection.method}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-1">
                          {collection.result}
                        </div>
                        <div className="text-gray-500 mt-1">
                          {format(new Date(collection.collectedAt), "yyyy-MM-dd HH:mm", {
                            locale: zhCN,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPartialPayModal && selectedRepayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">部分还款</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                借款人: {selectedRepayment.application?.borrowerName || "未知"}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                期数: 第{selectedRepayment.period}期
              </p>
              <p className="text-sm text-gray-600 mb-2">
                应还金额: ¥{selectedRepayment.amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                已还金额: ¥{selectedRepayment.paidAmount.toLocaleString()}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                本次还款金额
              </label>
              <input
                type="number"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入还款金额"
                max={selectedRepayment.amount - selectedRepayment.paidAmount}
              />
              <p className="text-xs text-gray-500 mt-1">
                最大可还: ¥{(selectedRepayment.amount - selectedRepayment.paidAmount).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPartialPayModal(false);
                  setPartialAmount("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handlePartialPay}
                disabled={!partialAmount || parseFloat(partialAmount) <= 0}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                确认还款
              </button>
            </div>
          </div>
        </div>
      )}

      {showExceptionDrawer && selectedRepayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">标记还款异常</h2>
              <button
                onClick={() => {
                  setShowExceptionDrawer(false);
                  setSelectedRepayment(null);
                  setExceptionType("OVERDUE");
                  setExceptionDescription("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">第{selectedRepayment.period}期</span>
                <StatusBadge status={selectedRepayment.status} type="repayment" />
              </div>
              <div className="text-sm text-gray-600 mb-2">
                借款人: {selectedRepayment.application?.borrowerName || "未知"}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                应还金额: ¥{selectedRepayment.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                应还日期: {format(new Date(selectedRepayment.dueDate), "yyyy-MM-dd", { locale: zhCN })}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                异常类型
              </label>
              <select
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="OVERDUE">逾期</option>
                <option value="PARTIAL_PAYMENT">部分还款异常</option>
                <option value="CONTACT_FAILED">联系失败</option>
                <option value="OTHER">其他</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                异常说明
              </label>
              <textarea
                value={exceptionDescription}
                onChange={(e) => setExceptionDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="请详细描述异常情况..."
              />
            </div>

            <div className="bg-warning/10 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">注意</span>
              </div>
              <p className="text-xs text-gray-600">
                标记异常后将自动创建异常记录，并触发系统提醒流程。异常状态为 OPEN 时会自动发送短信提醒借款人。
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExceptionDrawer(false);
                  setSelectedRepayment(null);
                  setExceptionType("OVERDUE");
                  setExceptionDescription("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMarkException}
                disabled={!exceptionDescription}
                className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailDrawer && selectedRepayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">还款详情</h2>
              <button
                onClick={() => {
                  setShowDetailDrawer(false);
                  setSelectedRepayment(null);
                  setOperationLogs([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-lg font-bold">第{selectedRepayment.period}期</span>
                <StatusBadge status={selectedRepayment.status} type="repayment" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">借款人:</span>
                  <span className="ml-2 font-medium">{selectedRepayment.application?.borrowerName || "未知"}</span>
                </div>
                <div>
                  <span className="text-gray-500">联系电话:</span>
                  <span className="ml-2">{selectedRepayment.application?.borrowerPhone || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">应还金额:</span>
                  <span className="ml-2 font-bold text-primary">¥{selectedRepayment.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">已还金额:</span>
                  <span className="ml-2 text-success">¥{selectedRepayment.paidAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">应还日期:</span>
                  <span className="ml-2">{format(new Date(selectedRepayment.dueDate), "yyyy-MM-dd", { locale: zhCN })}</span>
                </div>
                <div>
                  <span className="text-gray-500">剩余金额:</span>
                  <span className="ml-2 text-error">¥{(selectedRepayment.amount - selectedRepayment.paidAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {selectedRepayment.collections && selectedRepayment.collections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  催收记录
                </h3>
                <div className="space-y-2">
                  {selectedRepayment.collections.map((collection) => (
                    <div key={collection.id} className="bg-warning/10 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{collection.method}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(collection.collectedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{collection.result}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedRepayment.exceptions && selectedRepayment.exceptions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  异常记录
                </h3>
                <div className="space-y-2">
                  {selectedRepayment.exceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className={`p-3 rounded-lg cursor-pointer ${
                        exception.status === "RESOLVED" ? "bg-success/10" : "bg-error/10"
                      }`}
                      onClick={() => {
                        if (exception.status !== "RESOLVED") {
                          setSelectedException(exception);
                          setShowHandleExceptionModal(true);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{exception.type}</span>
                        <StatusBadge status={exception.status} type="exception" />
                      </div>
                      <p className="text-sm text-gray-600">{exception.description}</p>
                      {exception.resolution && (
                        <p className="text-sm text-success mt-2">处理结果: {exception.resolution}</p>
                      )}
                      {exception.status !== "RESOLVED" && (
                        <p className="text-xs text-primary mt-2">点击处理 →</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                操作历史
              </h3>
              <div className="border-l-2 border-gray-200 pl-4">
                <Timeline events={operationLogs} />
              </div>
            </div>

            <button
              onClick={() => router.push(`/trace?businessId=${selectedRepayment.applicationId}`)}
              className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              查看完整追溯记录
            </button>
          </div>
        </div>
      )}

      {showHandleExceptionModal && selectedException && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">处理异常</h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                异常类型: {selectedException.type}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                异常说明: {selectedException.description}
              </p>
              <p className="text-sm text-gray-600">
                当前状态: {selectedException.status}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                处理方式
              </label>
              <div className="grid grid-cols-2 gap-2">
                {actionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setHandleAction(option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors ${
                        handleAction === option.value
                          ? "border-primary bg-primary/10"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                处理说明
              </label>
              <textarea
                value={handleNote}
                onChange={(e) => setHandleNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="请输入处理说明..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowHandleExceptionModal(false);
                  setSelectedException(null);
                  setHandleAction("REMIND");
                  setHandleNote("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExceptionAction}
                disabled={!handleNote}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
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