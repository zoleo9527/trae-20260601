import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
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
  };
  attendees: Attendee[];
  timeline: any[];
}

export default function AttendanceDetail() {
  const { courseId } = useParams();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleExport = async () => {
    try {
      const response = await api.post('/export/attendance', {
        courseId,
      }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `签到表_${data?.courseName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
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
        <p className="text-gray-500">数据不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/courses"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.courseName} - 签到详情</h1>
            <p className="text-sm text-gray-500">
              {dayjs(data.scheduledTime).format('YYYY-MM-DD HH:mm')} · {data.location}
            </p>
          </div>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center">
          <Download className="w-4 h-4 mr-2" />
          导出签到表
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{data.stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">应到人数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            {data.stats.signed}
          </div>
          <div className="text-sm text-gray-500 mt-1">已到</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center">
            <Clock className="w-6 h-6 mr-2" />
            {data.stats.late}
          </div>
          <div className="text-sm text-gray-500 mt-1">迟到</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 mr-2" />
            {data.stats.leave}
          </div>
          <div className="text-sm text-gray-500 mt-1">请假</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600 flex items-center justify-center">
            <XCircle className="w-6 h-6 mr-2" />
            {data.stats.absent}
          </div>
          <div className="text-sm text-gray-500 mt-1">缺席</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">签到详情</h2>
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
                  签到时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.attendees.map((attendee) => (
                <tr key={attendee.enrollmentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendee.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {attendee.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attendee.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(attendee.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {attendee.signInTime
                      ? dayjs(attendee.signInTime).format('HH:mm:ss')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {attendee.hasException ? (
                      <Link
                        to="/exceptions"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        查看异常
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {data.timeline && data.timeline.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">操作时间线</h2>
          <div className="space-y-4">
            {data.timeline.map((item: any) => (
              <div key={item.id} className="flex">
                <div className="flex flex-col items-center mr-3">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-200 my-1"></div>
                </div>
                <div className="pb-4">
                  <div className="text-sm text-gray-900">{item.details}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')} · {item.user?.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
