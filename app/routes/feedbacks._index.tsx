import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import { ArrowRight, ClipboardList, Filter, MessageSquare, Save, Users, X } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "~/components/DashboardLayout";
import { StatusBadge } from "~/components/StatusBadge";
import { formatDateTime } from "~/data/mockData";
import {
    createTodo,
    getAllFeedbacks,
    getReviewById,
    updateReviewStatus,
} from "~/data/store";
import type { FeedbackType, TodoItem } from "~/types";

export const loader = async () => {
  const feedbacks = getAllFeedbacks();
  const feedbacksWithReviews = feedbacks.map((feedback) => {
    const review = getReviewById(feedback.reviewId);
    return { ...feedback, review };
  });

  return json({ feedbacks: feedbacksWithReviews });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "createTodo") {
    const feedbackId = formData.get("feedbackId") as string;
    const reviewId = formData.get("reviewId") as string;
    const studentName = formData.get("studentName") as string;
    const parentName = formData.get("parentName") as string;
    const feedbackType = formData.get("feedbackType") as FeedbackType;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const todoType = formData.get("todoType") as TodoItem["type"];
    const assigneeName = formData.get("assigneeName") as string;

    if (!title?.trim()) {
      return json({ error: "待办标题不能为空" }, { status: 400 });
    }

    const todo = createTodo({
      title: title.trim(),
      description: description.trim(),
      type: todoType,
      reviewId,
      studentName,
      parentName,
      feedbackId,
      assigneeId: "c1",
      assigneeName: assigneeName || "张顾问",
    });

    updateReviewStatus(reviewId, "consultant_following");

    return json({ success: true, todoId: todo.id });
  }

  return json({ error: "无效操作" }, { status: 400 });
};

const todoTypeMap: Record<string, { type: TodoItem["type"]; defaultTitle: string }> = {
  class_change: { type: "class_change", defaultTitle: "家长要求换班" },
  teacher_change: { type: "teacher_change", defaultTitle: "家长要求换老师" },
  suspension: { type: "suspension", defaultTitle: "家长要求停课" },
  complaint: { type: "complaint", defaultTitle: "家长投诉" },
  makeup_required: { type: "makeup", defaultTitle: "作品需补交" },
};

export default function FeedbacksIndex() {
  const { feedbacks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [typeFilter, setTypeFilter] = useState("all");
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<typeof feedbacks[0] | null>(null);

  const typeOptions = [
    { value: "all", label: "全部类型" },
    { value: "praise", label: "表扬" },
    { value: "question", label: "疑问" },
    { value: "suggestion", label: "建议" },
    { value: "complaint", label: "投诉" },
    { value: "class_change", label: "要求换班" },
    { value: "teacher_change", label: "要求换老师" },
    { value: "suspension", label: "要求停课" },
    { value: "makeup_required", label: "需补交" },
  ];

  const filteredFeedbacks = feedbacks.filter(
    (f) => typeFilter === "all" || f.type === typeFilter
  );

  const canConvertToTodo = (type: string) => {
    return ["class_change", "teacher_change", "suspension", "complaint", "makeup_required"].includes(type);
  };

  const handleOpenTodoModal = (feedback: typeof feedbacks[0]) => {
    setSelectedFeedback(feedback);
    setShowTodoModal(true);
  };

  const stats = [
    { label: "总反馈数", value: feedbacks.length, color: "text-blue-600", bg: "bg-blue-50" },
    {
      label: "待处理",
      value: feedbacks.filter((f) => f.hasTodo || f.type === "complaint" || f.type === "class_change" || f.type === "teacher_change" || f.type === "suspension").length,
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

  const todoConfig = selectedFeedback ? (todoTypeMap[selectedFeedback.type] || todoTypeMap.other) : null;

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

        {actionData && "error" in actionData && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{feedback.parentName}</p>
                        <StatusBadge status={feedback.type} type="feedbackType" />
                        {feedback.hasTodo && (
                          <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
                            <ClipboardList size={12} />
                            已转待办
                          </span>
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

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users size={14} />
                    <span>关联点评：{feedback.review?.teacherName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {canConvertToTodo(feedback.type) && !feedback.hasTodo && (
                      <button
                        onClick={() => handleOpenTodoModal(feedback)}
                        className="text-sm bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors flex items-center gap-1"
                      >
                        <ClipboardList size={14} />
                        转待办
                      </button>
                    )}
                    <Link
                      to={`/reviews/${feedback.reviewId}`}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      查看详情
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showTodoModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">创建待办事项</h2>
              <button
                onClick={() => setShowTodoModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <Form method="post" className="p-6 space-y-4">
              <input type="hidden" name="intent" value="createTodo" />
              <input type="hidden" name="feedbackId" value={selectedFeedback.id} />
              <input type="hidden" name="reviewId" value={selectedFeedback.reviewId} />
              <input
                type="hidden"
                name="studentName"
                value={selectedFeedback.review?.studentName || ""}
              />
              <input
                type="hidden"
                name="parentName"
                value={selectedFeedback.parentName}
              />
              <input type="hidden" name="feedbackType" value={selectedFeedback.type} />
              <input
                type="hidden"
                name="todoType"
                value={todoConfig?.type || "other"}
              />

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">家长反馈：</span>
                  {selectedFeedback.content}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  待办标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="input-field"
                  defaultValue={`${selectedFeedback.review?.studentName}家长 - ${todoConfig?.defaultTitle || "处理反馈"}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  待办描述
                </label>
                <textarea
                  name="description"
                  className="input-field resize-none"
                  rows={3}
                  defaultValue={selectedFeedback.content}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  负责人
                </label>
                <select name="assigneeName" className="input-field">
                  <option value="张顾问">张顾问</option>
                  <option value="李老师">李老师</option>
                  <option value="王老师">王老师</option>
                  <option value="赵主管">赵主管</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTodoModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  创建待办
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
