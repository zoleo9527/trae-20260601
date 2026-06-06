import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Phone, Search, Users } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "~/components/DashboardLayout";
import { getAllReviews, getStudents } from "~/data/store";

export const loader = async () => {
  const students = getStudents();
  const reviews = getAllReviews();

  const studentsWithStats = students.map((student) => {
    const studentReviews = reviews.filter((r) => r.studentId === student.id);
    const lastReview = studentReviews[0];
    const unreadCount = studentReviews.filter(
      (r) => r.feedbackStatus === "parent_unread"
    ).length;
    return { ...student, reviewCount: studentReviews.length, lastReview, unreadCount };
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

  const longNoFeedback = students.filter((s) => s.unreadCount > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 mt-1">查看学生信息和家长反馈情况</p>
        </div>

        {longNoFeedback.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <h3 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              以下家长长期未读点评，需关注
            </h3>
            <div className="flex flex-wrap gap-2">
              {longNoFeedback.map((s) => (
                <span
                  key={s.id}
                  className="bg-white px-3 py-1 rounded-full text-sm text-orange-700 border border-orange-200"
                >
                  {s.name} - {s.parentName}（{s.unreadCount}条未读）
                </span>
              ))}
            </div>
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
            <div key={student.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
                  {student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">{student.name}</h3>
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
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">最近一次点评</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{student.lastReview.highlights}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
