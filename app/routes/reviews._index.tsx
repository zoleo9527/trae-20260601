import { json } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { Filter, Plus, Search } from "lucide-react";
import { useState } from "react";
import { ArtworkGallery } from "~/components/ArtworkGallery";
import DashboardLayout from "~/components/DashboardLayout";
import { StatusBadge } from "~/components/StatusBadge";
import { formatDate, mockReviews } from "~/data/mockData";

export const loader = async () => {
  return json({ reviews: mockReviews });
};

export default function ReviewsIndex() {
  const { reviews } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const statusFilter = searchParams.get("status") || "all";

  const statusOptions = [
    { value: "all", label: "全部状态" },
    { value: "parent_unread", label: "家长未读" },
    { value: "parent_read", label: "家长已读" },
    { value: "parent_replied", label: "家长已回复" },
    { value: "consultant_following", label: "顾问跟进中" },
    { value: "pending_makeup", label: "待补交作品" },
    { value: "resolved", label: "已处理" },
  ];

  const filteredReviews = reviews.filter((review) => {
    const matchesStatus = statusFilter === "all" || review.feedbackStatus === statusFilter;
    const matchesSearch =
      searchQuery === "" ||
      review.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">作品点评</h1>
            <p className="text-gray-500 mt-1">管理学生作品点评和家长反馈</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            新建点评
          </button>
        </div>

        <div className="card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索学生姓名、课程、老师..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                className="input-field w-48"
                value={statusFilter}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams);
                  if (e.target.value === "all") {
                    params.delete("status");
                  } else {
                    params.set("status", e.target.value);
                  }
                  setSearchParams(params);
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredReviews.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-gray-500">暂无匹配的点评记录</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <Link
                key={review.id}
                to={`/reviews/${review.id}`}
                className="card p-5 hover:shadow-md transition-shadow block"
              >
                <div className="flex gap-5">
                  <ArtworkGallery images={review.artworkImages} maxVisible={1} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {review.studentName}
                          </h3>
                          <StatusBadge status={review.feedbackStatus} />
                          {review.feedbackType && (
                            <StatusBadge status={review.feedbackType} type="feedbackType" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {review.courseName} · {review.teacherName}
                        </p>
                      </div>
                      <span className="text-sm text-gray-400">
                        {formatDate(review.classDate)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">作品亮点</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{review.highlights}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">待改进</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{review.improvements}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6 text-xs text-gray-400">
                      <span>📝 使用模板：{review.templateName}</span>
                      <span>🖼️ 作品图片：{review.artworkImages.length} 张</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
