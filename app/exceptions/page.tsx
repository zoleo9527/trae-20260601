"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { ExceptionRecord, ExceptionStatus } from "@/types";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AlertTriangle,
  Filter,
  RefreshCw,
  ArrowLeftRight,
  Bell,
  FilePlus,
  Phone,
} from "lucide-react";

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedException, setSelectedException] =
    useState<ExceptionRecord | null>(null);
  const [handleAction, setHandleAction] = useState<string>("REMIND");
  const [handleNote, setHandleNote] = useState<string>("");
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      fetchExceptions();
    }
  }, [user, router, selectedStatus]);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const url = selectedStatus
        ? `/api/exceptions?status=${selectedStatus}`
        : "/api/exceptions";
      const response = await fetch(url);
      const data = await response.json();
      setExceptions(data || []);
    } catch (error) {
      console.error("获取异常记录列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleException = async () => {
    if (!selectedException) return;

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
          }),
        }
      );

      if (response.ok) {
        setShowHandleModal(false);
        setSelectedException(null);
        setHandleAction("REMIND");
        setHandleNote("");
        fetchExceptions();
      }
    } catch (error) {
      console.error("处理异常失败:", error);
    }
  };

  const statusOptions: ExceptionStatus[] = ["OPEN", "PROCESSING", "RESOLVED"];

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
          <h1 className="text-3xl font-bold text-primary mb-2">异常处理</h1>
          <p className="text-gray-600">处理驳回、补录、逾期等异常情况</p>
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
              onClick={fetchExceptions}
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
        ) : exceptions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">暂无异常记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exceptions.map((exception) => (
              <div
                key={exception.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`w-6 h-6 ${
                        exception.status === "OPEN"
                          ? "text-error"
                          : exception.status === "PROCESSING"
                          ? "text-warning"
                          : "text-success"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        {exception.businessType === "APPLICATION"
                          ? "借款申请"
                          : "还款计划"}
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {exception.type}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={exception.status} type="exception" />
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {exception.businessType === "APPLICATION"
                      ? `借款人: ${exception.application?.borrowerName || "未知"}`
                      : `借款人: ${exception.repayment?.application?.borrowerName || "未知"}`}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    异常说明: {exception.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    创建时间:{" "}
                    {format(new Date(exception.createdAt), "yyyy-MM-dd HH:mm", {
                      locale: zhCN,
                    })}
                  </div>
                  {exception.resolvedAt && (
                    <div className="text-xs text-success mt-2">
                      解决时间:{" "}
                      {format(new Date(exception.resolvedAt), "yyyy-MM-dd HH:mm", {
                        locale: zhCN,
                      })}
                    </div>
                  )}
                </div>

                {exception.resolution && (
                  <div className="bg-gray-50 rounded p-3 mb-4">
                    <div className="text-xs text-gray-500 mb-1">处理结果:</div>
                    <div className="text-sm text-gray-700">
                      {exception.resolution}
                    </div>
                  </div>
                )}

                {exception.status !== "RESOLVED" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedException(exception);
                        setShowHandleModal(true);
                      }}
                      className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      处理异常
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showHandleModal && selectedException && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">处理异常</h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                异常类型: {selectedException.type}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                异常说明: {selectedException.description}
              </p>
              <p className="text-sm text-gray-600">
                业务类型: {selectedException.businessType}
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
                  setShowHandleModal(false);
                  setSelectedException(null);
                  setHandleAction("REMIND");
                  setHandleNote("");
                }}
                className="flex-1 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleException}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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