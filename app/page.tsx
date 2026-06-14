"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { LoanApplication, ApplicationStatus } from "@/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  CheckCircle,
  XCircle,
  FileQuestion,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react";

export default function HomePage() {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<LoanApplication | null>(null);
  const [confirmAction, setConfirmAction] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      fetchApplications();
    }
  }, [user, router, selectedStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = selectedStatus
        ? `/api/applications?status=${selectedStatus}`
        : "/api/applications";
      const response = await fetch(url);
      const data = await response.json();
      setApplications(data.data || []);
    } catch (error) {
      console.error("获取借款申请列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedApplication || !confirmAction) return;

    try {
      const response = await fetch("/api/confirmations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: confirmAction,
          reason: reason,
          operatorId: user?.id,
        }),
      });

      if (response.ok) {
        setShowConfirmModal(false);
        setSelectedApplication(null);
        setConfirmAction("");
        setReason("");
        fetchApplications();
      }
    } catch (error) {
      console.error("处理失败:", error);
    }
  };

  const statusOptions: ApplicationStatus[] = [
    "PENDING",
    "RISK_REVIEW",
    "APPROVED",
    "CONFIRMED",
    "DISBURSED",
    "REJECTED",
  ];

  const canConfirm = (status: ApplicationStatus) => {
    return status === "APPROVED" || status === "RISK_REVIEW";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">放款确认</h1>
          <p className="text-gray-600">处理借款申请的放款确认流程</p>
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
                  {status}
                </option>
              ))}
            </select>

            <button
              onClick={fetchApplications}
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
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">暂无借款申请</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    借款人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    用途
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    申请时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {app.borrowerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.borrowerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ¥{app.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {app.purpose}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} type="application" />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(app.createdAt), "yyyy-MM-dd HH:mm", {
                        locale: zhCN,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(app);
                            router.push(`/trace?businessId=${app.id}`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </button>

                        {canConfirm(app.status) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setConfirmAction("CONFIRM");
                                setShowConfirmModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-success hover:bg-success/10 rounded transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              确认放款
                            </button>

                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setConfirmAction("REJECT");
                                setShowConfirmModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-error hover:bg-error/10 rounded transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              驳回
                            </button>

                            <button
                              onClick={() => {
                                setSelectedApplication(app);
                                setConfirmAction("REQUEST_INFO");
                                setShowConfirmModal(true);
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm text-warning hover:bg-warning/10 rounded transition-colors"
                            >
                              <FileQuestion className="w-4 h-4" />
                              补录资料
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showConfirmModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {confirmAction === "CONFIRM"
                ? "确认放款"
                : confirmAction === "REJECT"
                ? "驳回申请"
                : "要求补录资料"}
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                借款人: {selectedApplication.borrowerName}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                金额: ¥{selectedApplication.amount.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                用途: {selectedApplication.purpose}
              </p>
            </div>

            {(confirmAction === "REJECT" || confirmAction === "REQUEST_INFO") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {confirmAction === "REJECT" ? "驳回原因" : "补录要求"}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder={
                    confirmAction === "REJECT"
                      ? "请输入驳回原因..."
                      : "请输入需要补录的资料类型..."
                  }
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedApplication(null);
                  setConfirmAction("");
                  setReason("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}