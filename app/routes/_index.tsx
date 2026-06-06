import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
    ArrowRight,
    ClipboardList,
    Clock,
    Image,
    MessageSquare,
    Users
} from "lucide-react";
import { ArtworkGallery } from "~/components/ArtworkGallery";
import DashboardLayout from "~/components/DashboardLayout";
import { StatusBadge } from "~/components/StatusBadge";
import { formatDate } from "~/data/mockData";
import { getAllReviews, getAllTodos } from "~/data/store";

export const loader = async () => {
  const reviews = getAllReviews();
  const todos = getAllTodos();

  const stats = {
    totalReviews: reviews.length,
    unreadFeedbacks: reviews.filter((r) => r.feedbackStatus === "parent_unread").length,
    pendingTodos: todos.filter((t) => t.status !== "completed").length,
    pendingMakeup: reviews.filter((r) => r.feedbackStatus === "pending_makeup").length,
  };

  const recentReviews = reviews.slice(0, 3);
  const urgentTodos = todos.filter((t) => t.status !== "completed").slice(0, 3);

  return json({ stats, recentReviews, urgentTodos });
};

export default function Index() {
  const { stats, recentReviews, urgentTodos } = useLoaderData<typeof loader>();

  const statCards = [
    {
      title: "本周点评",
      value: stats.totalReviews,
      icon: <Image size={24} />,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "家长未读",
      value: stats.unreadFeedbacks,
      icon: <Clock size={24} />,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "待办事项",
      value: stats.pendingTodos,
      icon: <ClipboardList size={24} />,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "待补交作品",
      value: stats.pendingMakeup,
      icon: <MessageSquare size={24} />,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 mt-1">欢迎回来，查看今天的工作安排</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => (
            <div key={index} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.bgColor} ${card.textColor} p-3 rounded-xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">最近点评</h2>
              <Link
                to="/reviews"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <Link
                  key={review.id}
                  to={`/reviews/${review.id}`}
                  className="card p-4 hover:shadow-md transition-shadow block"
                >
                  <div className="flex gap-4">
                    <ArtworkGallery images={review.artworkImages} maxVisible={1} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{review.studentName}</h3>
                          <p className="text-sm text-gray-500">{review.courseName}</p>
                        </div>
                        <StatusBadge status={review.feedbackStatus} />
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{review.highlights}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{review.teacherName}</span>
                        <span>{formatDate(review.classDate)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">紧急待办</h2>
              <Link
                to="/todos"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                查看全部 <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {urgentTodos.map((todo) => (
                <div key={todo.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <StatusBadge status={todo.type} type="todoType" />
                    <StatusBadge status={todo.status} type="todo" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{todo.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{todo.studentName} · {todo.parentName}</p>
                  {todo.assigneeName && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Users size={12} />
                      <span>负责人：{todo.assigneeName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
