import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    Calendar,
    ClipboardList,
    Clock,
    Eye,
    MessageSquare,
    Plus,
    Star,
    Target,
    User,
} from "lucide-react";
import { useState } from "react";
import { ArtworkGallery } from "~/components/ArtworkGallery";
import DashboardLayout from "~/components/DashboardLayout";
import { FollowUpTimeline } from "~/components/FollowUpTimeline";
import { StatusBadge } from "~/components/StatusBadge";
import {
    formatDate,
    formatDateTime,
    mockFeedbacks,
    mockFollowUps,
    mockReviews,
    mockTodos,
} from "~/data/mockData";

export const loader = async ({ params }: { params: { id: string } }) => {
  const review = mockReviews.find((r) => r.id === params.id);
  const feedbacks = mockFeedbacks.filter((f) => f.reviewId === params.id);
  const followUps = mockFollowUps.filter((f) => f.reviewId === params.id).reverse();
  const todos = mockTodos.filter((t) => t.reviewId === params.id);

  if (!review) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ review, feedbacks, followUps, todos });
};

export default function ReviewDetail() {
  const { review, feedbacks, followUps, todos } = useLoaderData<typeof loader>();
  const [followUpInput, setFollowUpInput] = useState("");
  const [showTodoModal, setShowTodoModal] = useState(false);

  const reviewSections = [
    {
      icon: <Eye size={20} />,
      title: "课堂观察",
      content: review.observation,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: <Star size={20} />,
      title: "作品亮点",
      content: review.highlights,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: <AlertTriangle size={20} />,
      title: "待改进之处",
      content: review.improvements,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: <Target size={20} />,
      title: "下一步练习建议",
      content: review.nextPractice,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            to="/reviews"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {review.studentName} 的作品点评
              </h1>
              <StatusBadge status={review.feedbackStatus} />
              {review.feedbackType && (
                <StatusBadge status={review.feedbackType} type="feedbackType" />
              )}
            </div>
            <p className="text-gray-500 mt-1">
              {review.courseName} · {review.classDate} {review.classTime}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-primary-600" />
                学生作品
              </h2>
              <div className="flex gap-3 flex-wrap">
                {review.artworkImages.length === 0 ? (
                  <div className="w-full">
                    <ArtworkGallery images={[]} size="lg" />
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      本节课作品未完成，需要补交
                    </p>
                  </div>
                ) : (
                  review.artworkImages.map((img) => (
                    <div
                      key={img.id}
                      className="w-40 h-40 rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={img.url}
                        alt="作品"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList size={20} className="text-primary-600" />
                点评详情
                <span className="text-sm font-normal text-gray-500 ml-2">
                  模板：{review.templateName}
                </span>
              </h2>
              <div className="space-y-4">
                {reviewSections.map((section, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg overflow-hidden">
                    <div className={`${section.bgColor} px-4 py-3 flex items-center gap-2`}>
                      <span className={section.color}>{section.icon}</span>
                      <span className="font-medium text-gray-900">{section.title}</span>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {feedbacks.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-primary-600" />
                  家长反馈
                </h2>
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="bg-purple-50 border border-purple-100 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center">
                            👤
                          </div>
                          <span className="font-medium text-gray-900">
                            {feedback.parentName}
                          </span>
                          <StatusBadge status={feedback.type} type="feedbackType" />
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(feedback.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 pl-10">{feedback.content}</p>
                      {feedback.hasTodo && (
                        <div className="mt-3 pl-10">
                          <button
                            onClick={() => setShowTodoModal(true)}
                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <ClipboardList size={14} />
                            查看关联待办
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">学生</p>
                    <p className="font-medium text-gray-900">{review.studentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">授课老师</p>
                    <p className="font-medium text-gray-900">{review.teacherName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">上课日期</p>
                    <p className="font-medium text-gray-900">{formatDate(review.classDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">上课时间</p>
                    <p className="font-medium text-gray-900">{review.classTime}</p>
                  </div>
                </div>
              </div>
            </div>

            {todos.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ClipboardList size={18} className="text-orange-500" />
                  关联待办
                </h2>
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <StatusBadge status={todo.type} type="todoType" />
                        <StatusBadge status={todo.status} type="todo" />
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{todo.title}</p>
                      {todo.assigneeName && (
                        <p className="text-xs text-gray-500 mt-1">
                          负责人：{todo.assigneeName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">跟进记录</h2>
              <div className="mb-4">
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="添加跟进记录..."
                  value={followUpInput}
                  onChange={(e) => setFollowUpInput(e.target.value)}
                />
                <button className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
                  <Plus size={16} />
                  添加记录
                </button>
              </div>
              <FollowUpTimeline records={followUps} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
