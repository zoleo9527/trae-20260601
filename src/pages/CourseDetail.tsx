import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Clock,
  Users,
  Calendar,
  User,
  FileText,
  Download,
} from 'lucide-react';
import dayjs from 'dayjs';

interface TimelineItem {
  id: string;
  timestamp: string;
  operator: {
    id: string;
    name: string;
    role: string;
  };
  action: string;
  details: string;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
  instructor: {
    id: string;
    name: string;
    department: string;
    email: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
  enrollments: Array<{
    id: string;
    attendanceStatus: string;
    certificateStatus: string;
    user: {
      id: string;
      name: string;
      employeeId: string;
      department: string;
      avatar?: string;
    };
  }>;
  timeline: TimelineItem[];
}

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCourseDetail(id);
    }
  }, [id]);

  const fetchCourseDetail = async (courseId: string) => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourse(response.data.data);
    } catch (error) {
      console.error('Failed to fetch course detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'badge-pending' },
      published: { label: '已发布', className: 'badge-info' },
      ongoing: { label: '进行中', className: 'badge-success' },
      completed: { label: '已完成', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '已取消', className: 'badge-danger' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'badge-pending' };
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const getAttendanceBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待签到', className: 'badge-pending' },
      signed: { label: '已签到', className: 'badge-success' },
      late: { label: '迟到', className: 'badge-warning' },
      leave: { label: '请假', className: 'badge-info' },
      absent: { label: '缺席', className: 'badge-danger' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'badge-pending' };
    return <span className={`badge ${className}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">课程不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/courses"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            {getStatusBadge(course.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">课程信息</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <BookOpen className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">课程描述</div>
                  <div className="text-gray-900 mt-1">{course.description || '暂无描述'}</div>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">上课时间</div>
                  <div className="text-gray-900 mt-1">
                    {dayjs(course.startTime).format('YYYY年MM月DD日 HH:mm')} - {dayjs(course.endTime).format('HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">上课地点</div>
                  <div className="text-gray-900 mt-1">{course.location || '地点待定'}</div>
                </div>
              </div>
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">授课讲师</div>
                  <div className="text-gray-900 mt-1">
                    {course.instructor?.name}（{course.instructor?.department}）
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                学员名单（{course.enrollments?.length || 0} 人）
              </h2>
            </div>
            {course.enrollments && course.enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        学号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        部门
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        签到状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        证书状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {course.enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.user.employeeId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.user.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAttendanceBadge(enrollment.attendanceStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${enrollment.certificateStatus === 'issued' ? 'badge-success' : 'badge-pending'}`}>
                            {enrollment.certificateStatus === 'issued' ? '已发放' : enrollment.certificateStatus === 'pending' ? '待发放' : '未生成'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>暂无学员报名</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">操作时间线</h2>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            {course.timeline && course.timeline.length > 0 ? (
              <div className="space-y-4">
                {course.timeline.map((item) => (
                  <div key={item.id} className="flex">
                    <div className="flex flex-col items-center mr-3">
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      <div className="w-px h-full bg-gray-200 my-1"></div>
                    </div>
                    <div className="pb-4">
                      <div className="text-sm text-gray-900">{item.details}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm')} · {item.operator.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>暂无操作记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
