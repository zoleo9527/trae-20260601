import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ArrowRight, Filter, MessageSquare, Users } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "~/components/DashboardLayout";
import { StatusBadge } from "~/components/StatusBadge";
import { formatDateTime, mockFeedbacks, mockReviews } from "~/data/mockData";

export const loader = async () => {
  const feedbacksWithReviews = mockFeedbacks.map((feedback) => {
    const review = mockReviews.find((r) => r.id === feedback.reviewId);
    return { ...feedback, review };
  });

  return json({ feedbacks: feedbacksWithReviews });
};

export default function FeedbacksIndex() {
  const { feedbacks } = useLoaderData<typeof loader>();
  const [typeFilter, setTypeFilter] = useState("all");

  const typeOptions = [
    { value: "all", label: "全部类型" },
    { value: "praise", label: "表扬" },
    { value: "question", label: "疑问" },
    { value: "suggestion", label: "建议" },
    { value: "complaint", label: "投诉" },
    { value: "class_change", label: "要求换班" },
    { value: "suspension", label: "要求停课" },
    { value: "makeup_required", label: "需补交" },
  ];

  const filteredFeedbacks = feedbacks.filter(
    (f) => typeFilter === "all" || f.type === typeFilter
  );

  const stats = [
    { label: "总反馈数", value: feedbacks.length, color: "text-blue-600", bg: "bg-blue-50" },
    {
      label: "待处理",
      value: feedbacks.filter((f) => f.hasTodo || f.type === "complaint" || f.type === "class_change").length,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "表扬",
      value: feedbacks.filter((f) => f.type === "praise").length,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "投诉/建议",
      value: feedbacks.filter((f) => f.type === "complaint" || f.type === "suggestion").length,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家长反馈</h1>
          <p className="text-gray-500 mt-1">查看和管理所有家长反馈</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="card p-4">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              className="input-field w-48"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="card p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">暂无匹配的反馈记录</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{feedback.parentName}</p>
                        <StatusBadge status={feedback.type} type="feedbackType" />
                        {feedback.hasTodo && (
                          <span className="badge bg-red-100 text-red-700">待办</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {feedback.review?.studentName} · {feedback.review?.courseName}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(feedback.createdAt)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{feedback.content}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={14} />
                    <span>关联点评：{feedback.review?.teacherName}</span>
                  </div>
                  <Link
                    to={`/reviews/${feedback.reviewId}`}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    查看详情
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
