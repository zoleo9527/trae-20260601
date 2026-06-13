import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, MapPin, Clock, Users, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

interface Course {
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
  };
  _count: {
    enrollments: number;
  };
}

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'badge-pending' },
      published: { label: '已发布', className: 'badge-info' },
      ongoing: { label: '进行中', className: 'badge-success' },
      completed: { label: '已完成', className: 'badge-gray' },
      cancelled: { label: '已取消', className: 'badge-danger' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'badge-pending' };
    return <span className={`badge ${className}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程列表</h1>
          <p className="mt-1 text-sm text-gray-500">管理所有培训课程</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  {getStatusBadge(course.status)}
                </div>
                <BookOpen className="w-8 h-8 text-primary-200" />
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {course.description || '暂无描述'}
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {dayjs(course.startTime).format('YYYY-MM-DD HH:mm')}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {course.location || '地点待定'}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  讲师：{course.instructor?.name || '待分配'}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {course._count?.enrollments || 0} 名学员
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
