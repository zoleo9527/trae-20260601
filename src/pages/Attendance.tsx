import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import dayjs from 'dayjs';

interface Attendee {
  enrollmentId: string;
  userId: string;
  name: string;
  employeeId: string;
  department: string;
  avatar?: string;
  status: string;
  signInTime?: string;
  hasException: boolean;
  exceptionId?: string;
  exceptionStatus?: string;
}

interface AttendanceData {
  courseId: string;
  courseName: string;
  scheduledTime: string;
  location: string;
  instructor: {
    id: string;
    name: string;
  };
  stats: {
    total: number;
    signed: number;
    late: number;
    leave: number;
    absent: number;
    pending: number;
  };
  attendees: Attendee[];
  timeline: any[];
}

export default function Attendance() {
  const { courseId } = useParams();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchAttendance(courseId);
    }
  }, [courseId]);

  const fetchAttendance = async (id: string) => {
    try {
      const response = await api.get(`/attendance/${id}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (enrollmentId: string, status: string) => {
    setProcessing(true);
    try {
      await api.post('/attendance/sign-in', {
        enrollmentId,
        courseId,
        status,
        signInTime: new Date().toISOString(),
      });
      if (courseId) {
        fetchAttendance(courseId);
      }
    } catch (error) {
      console.error('Failed to sign in:', error);
      alert('签到失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'late':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'leave':
        return <AlertTriangle className="w-5 h-5 text-blue-500" />;
      case 'absent':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <User className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待签到', className: 'badge-pending' },
      signed: { label: '已到', className: 'badge-success' },
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

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">课程不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/attendance"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.courseName}</h1>
            <p className="text-sm text-gray-500">
              {dayjs(data.scheduledTime).format('YYYY-MM-DD HH:mm')} · {data.location}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchAttendance(courseId!)}
          className="btn-secondary flex items-center"
          disabled={processing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{data.stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">应到人数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{data.stats.signed}</div>
          <div className="text-sm text-gray-500 mt-1">已到</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{data.stats.late}</div>
          <div className="text-sm text-gray-500 mt-1">迟到</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{data.stats.leave}</div>
          <div className="text-sm text-gray-500 mt-1">请假</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{data.stats.absent}</div>
          <div className="text-sm text-gray-500 mt-1">缺席</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">签到处理</h2>
        <div className="space-y-3">
          {data.attendees.map((attendee) => (
            <div
              key={attendee.enrollmentId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(attendee.status)}
                <div>
                  <div className="font-medium text-gray-900">{attendee.name}</div>
                  <div className="text-sm text-gray-500">
                    {attendee.employeeId} · {attendee.department}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(attendee.status)}
                {attendee.signInTime && (
                  <div className="text-sm text-gray-500">
                    {dayjs(attendee.signInTime).format('HH:mm')}
                  </div>
                )}
                {attendee.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSignIn(attendee.enrollmentId, 'signed')}
                      disabled={processing}
                      className="btn-primary text-sm py-1 px-3"
                    >
                      签到
                    </button>
                    <button
                      onClick={() => handleSignIn(attendee.enrollmentId, 'late')}
                      disabled={processing}
                      className="btn-secondary text-sm py-1 px-3"
                    >
                      迟到
                    </button>
                    <button
                      onClick={() => handleSignIn(attendee.enrollmentId, 'leave')}
                      disabled={processing}
                      className="btn-secondary text-sm py-1 px-3"
                    >
                      请假
                    </button>
                  </div>
                )}
                {attendee.status !== 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSignIn(attendee.enrollmentId, 'signed')}
                      disabled={processing}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      改签到
                    </button>
                    {attendee.hasException ? (
                      <Link
                        to="/exceptions"
                        className="text-sm text-orange-600 hover:text-orange-700"
                      >
                        查看异常
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleSignIn(attendee.enrollmentId, 'absent')}
                        disabled={processing}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        标记缺席
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.timeline && data.timeline.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">签到记录</h2>
          <div className="space-y-3">
            {data.timeline.slice(0, 10).map((item: any) => (
              <div key={item.id} className="flex items-center text-sm">
                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <span className="text-gray-900">{item.details}</span>
                  <span className="text-gray-500 ml-2">
                    {dayjs(item.createdAt).format('HH:mm')}
                  </span>
                </div>
                <div className="text-gray-500">{item.user?.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
