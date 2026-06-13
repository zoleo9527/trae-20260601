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
  ClipboardCheck,
  PenTool,
  AlertCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

interface TimelineItem {
  id: string;
  createdAt: string;
  user: {
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
  homeworks: Array<{
    id: string;
    title: string;
    deadline: string;
    totalScore: number;
  }>;
  exams: Array<{
    id: string;
    title: string;
    startTime: string;
    totalScore: number;
    passingScore: number;
    status: string;
  }>;
  timeline: TimelineItem[];
}

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
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

  const getExamStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'badge-pending' },
      published: { label: '已发布', className: 'badge-info' },
      ongoing: { label: '进行中', className: 'badge-success' },
      grading: { label: '批改中', className: 'badge-warning' },
      graded: { label: '已批改', className: 'bg-blue-100 text-blue-800' },
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
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

  const isInstructor = user?.role === 'instructor' && user.id === course.instructor.id;

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

          {(course.homeworks?.length > 0 || course.exams?.length > 0) && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">课程任务</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.homeworks?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      <PenTool className="w-4 h-4 mr-2 text-blue-500" />
                      作业任务 ({course.homeworks.length})
                    </div>
                    <div className="space-y-2">
                      {course.homeworks.map((homework) => (
                        <Link
                          key={homework.id}
                          to={`/homework/${homework.id}/submissions`}
                          className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">{homework.title}</div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              截止：{dayjs(homework.deadline).format('MM-DD HH:mm')}
                            </span>
                            <span className="text-xs text-gray-500">满分 {homework.totalScore} 分</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {course.exams?.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      <ClipboardCheck className="w-4 h-4 mr-2 text-green-500" />
                      考试安排 ({course.exams.length})
                    </div>
                    <div className="space-y-2">
                      {course.exams.map((exam) => (
                        <Link
                          key={exam.id}
                          to={`/exams/${exam.id}`}
                          className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                            {getExamStatusBadge(exam.status)}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              {dayjs(exam.startTime).format('MM-DD HH:mm')}
                            </span>
                            <span className="text-xs text-gray-500">满分 {exam.totalScore} 分</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                学员名单（{course.enrollments?.length || 0} 人）
              </h2>
              {isInstructor && course.status === 'ongoing' && (
                <Link to={`/attendance/${course.id}`} className="text-sm text-primary-600 hover:text-primary-700 flex items-center">
                  <ClipboardCheck className="w-4 h-4 mr-1" />
                  进入签到
                </Link>
              )}
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
          {isInstructor && course.status === 'ongoing' && (
            <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">快捷操作</h3>
                <div className="space-y-3">
                  <Link
                    to={`/attendance/${course.id}`}
                    className="block p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <div className="flex items-center">
                      <ClipboardCheck className="w-5 h-5 mr-3" />
                      <span>开始签到</span>
                    </div>
                  </Link>
                  {course.exams?.length > 0 && (
                    <Link
                      to={`/exams/${course.exams[0].id}`}
                      className="block p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 mr-3" />
                        <span>处理考试成绩</span>
                      </div>
                    </Link>
                  )}
                  {course.homeworks?.length > 0 && (
                    <Link
                      to={`/homework/${course.homeworks[0].id}/submissions`}
                      className="block p-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    >
                      <div className="flex items-center">
                        <PenTool className="w-5 h-5 mr-3" />
                        <span>批改作业</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    <div className="pb-4 flex-1">
                      <div className="text-sm text-gray-900">{item.details}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')} · {item.user?.name || item.user?.name}
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

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">签到统计</h2>
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </div>
            {course.enrollments && course.enrollments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">应到人数</span>
                  <span className="text-sm font-medium text-gray-900">{course.enrollments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">已签到</span>
                  <span className="text-sm font-medium text-green-600">
                    {course.enrollments.filter((e) => e.attendanceStatus === 'signed').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">迟到</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {course.enrollments.filter((e) => e.attendanceStatus === 'late').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">请假</span>
                  <span className="text-sm font-medium text-blue-600">
                    {course.enrollments.filter((e) => e.attendanceStatus === 'leave').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">缺席</span>
                  <span className="text-sm font-medium text-red-600">
                    {course.enrollments.filter((e) => e.attendanceStatus === 'absent').length}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>暂无统计数据</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}