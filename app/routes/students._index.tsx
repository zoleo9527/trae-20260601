import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { ArrowRight, Calendar, Clock, Eye, XCircle, Phone, Search, Users } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "~/components/DashboardLayout";
import { StatusBadge } from "~/components/StatusBadge";
import { formatDate } from "~/data/mockData";
import { getAllReviews, getStudents } from "~/data/store";
import type { FeedbackStatus, Review, Student } from "~/types";

function calculateDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getFeedbackAlertType(status: FeedbackStatus): "unread" | "read_no_reply" | null {
  if (status === "parent_unread") return "unread";
  if (status === "parent_read") return "read_no_reply";
  return null;
}

interface StudentWithStats extends Student {
  reviewCount: number;
  lastReview: Review | undefined;
  unreadCount: number;
  daysSinceLastReview: number | null;
  feedbackAlertType: "unread" | "read_no_reply" | null;
}

export const loader = async () => {
  const students = getStudents();
  const reviews = getAllReviews();

  const studentsWithStats: StudentWithStats[] = students.map((student) => {
    const studentReviews = reviews
      .filter((r) => r.studentId === student.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const lastReview = studentReviews[0];
    const unreadCount = studentReviews.filter(
      (r) => r.feedbackStatus === "parent_unread"
    ).length;
    
    const daysSinceLastReview = lastReview 
      ? calculateDaysSince(lastReview.createdAt) 
      : null;
    
    const feedbackAlertType = lastReview 
      ? getFeedbackAlertType(lastReview.feedbackStatus)
      : null;

    return { 
      ...student, 
      reviewCount: studentReviews.length, 
      lastReview, 
      unreadCount,
      daysSinceLastReview,
      feedbackAlertType
    };
  });

  return json({ students: studentsWithStats });
};

export default function StudentsIndex() {
  const { students } = useLoaderData<typeof loader>();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const alertStudents = students.filter(
    (s) => s.feedbackAlertType !== null && s.daysSinceLastReview !== null && s.daysSinceLastReview >= 2
  );
  
  const unreadStudents = alertStudents.filter((s) => s.feedbackAlertType === "unread");
  const readNoReplyStudents = alertStudents.filter((s) => s.feedbackAlertType === "read_no_reply");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 mt-1">查看学生信息和家长反馈情况</p>
        </div>

        {alertStudents.length > 0 && (
          <div className="space-y-3">
            {unreadStudents.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                  <XCircle size={18} />
                  家长未读提醒（{unreadStudents.length}位）
                </h3>
                <p className="text-sm text-red-600 mb-3">
                  以下家长超过2天未查看点评，请课程顾问及时跟进提醒
                </p>
                <div className="flex flex-wrap gap-2">
                  {unreadStudents.map((s) => (
                    <Link
                      key={s.id}
                      to={`/reviews/${s.lastReview?.id}`}
                      className="bg-white px-3 py-1.5 rounded-full text-sm text-red-700 border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <span>{s.name} - {s.parentName}</span>
                      <span className="text-red-500">·</span>
                      <span className="text-red-500">{s.daysSinceLastReview}天未读</span>
                      <ArrowRight size={12} className="text-red-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {readNoReplyStudents.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                  <Eye size={18} />
                  已读未回复提醒（{readNoReplyStudents.length}位）
                </h3>
                <p className="text-sm text-orange-600 mb-3">
                  以下家长已查看点评但超过2天未回复，请顾问主动联系了解情况
                </p>
                <div className="flex flex-wrap gap-2">
                  {readNoReplyStudents.map((s) => (
                    <Link
                      key={s.id}
                      to={`/reviews/${s.lastReview?.id}`}
                      className="bg-white px-3 py-1.5 rounded-full text-sm text-orange-700 border border-orange-200 hover:bg-orange-50 transition-colors flex items-center gap-2"
                    >
                      <span>{s.name} - {s.parentName}</span>
                      <span className="text-orange-500">·</span>
                      <span className="text-orange-500">{s.daysSinceLastReview}天未回复</span>
                      <ArrowRight size={12} className="text-orange-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索学生姓名、家长姓名、班级..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className={`card p-5 hover:shadow-md transition-shadow ${
                student.feedbackAlertType && student.daysSinceLastReview !== null && student.daysSinceLastReview >= 2
                  ? student.feedbackAlertType === "unread"
                    ? "border-red-200 bg-red-50/30"
                    : "border-orange-200 bg-orange-50/30"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold ${
                  student.feedbackAlertType && student.daysSinceLastReview !== null && student.daysSinceLastReview >= 2
                    ? student.feedbackAlertType === "unread"
                      ? "bg-gradient-to-br from-red-400 to-red-600"
                      : "bg-gradient-to-br from-orange-400 to-orange-600"
                    : "bg-gradient-to-br from-primary-400 to-primary-600"
                }`}>
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    {student.feedbackAlertType && student.daysSinceLastReview !== null && student.daysSinceLastReview >= 2 && (
                      <StatusBadge 
                        status={student.feedbackAlertType === "unread" ? "parent_unread" : "parent_read"} 
                        type="feedback" 
                      />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{student.age}岁 · {student.className}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={14} className="text-gray-400" />
                  <span className="text-gray-600">家长：{student.parentName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-600">{student.parentPhone}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-500">点评数：</span>
                  <span className="font-medium text-gray-900">{student.reviewCount}</span>
                </div>
                {student.unreadCount > 0 && (
                  <span className="badge bg-red-100 text-red-700">
                    {student.unreadCount}条未读
                  </span>
                )}
              </div>

              {student.lastReview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      最近点评：{formatDate(student.lastReview.createdAt)}
                    </p>
                    {student.daysSinceLastReview !== null && student.daysSinceLastReview >= 2 && (
                      <p className={`text-xs flex items-center gap-1 ${
                        student.feedbackAlertType === "unread" ? "text-red-600" : "text-orange-600"
                      }`}>
                        <Clock size={12} />
                        {student.feedbackAlertType === "unread" 
                          ? `${student.daysSinceLastReview}天未读`
                          : `${student.daysSinceLastReview}天未回复`
                        }
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{student.lastReview.highlights}</p>
                  <Link
                    to={`/reviews/${student.lastReview.id}`}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    查看点评详情
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}

              {!student.lastReview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-400">暂无点评记录</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
