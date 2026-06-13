import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ClipboardCheck, Calendar, MapPin, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';

interface Course {
  id: string;
  title: string;
  startTime: string;
  location: string;
  status: string;
  instructor: {
    name: string;
  };
  _count: {
    enrollments: number;
  };
}

export default function AttendanceList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      const ongoingCourses = response.data.data.filter(
        (course: Course) => course.status === 'ongoing' || course.status === 'published'
      );
      setCourses(ongoingCourses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">签到管理</h1>
        <p className="mt-1 text-sm text-gray-500">选择课程进行签到</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-12">
          <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无可签到的课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/attendance/${course.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <span className="badge badge-info">
                    {course.status === 'ongoing' ? '进行中' : '已发布'}
                  </span>
                </div>
                <ClipboardCheck className="w-8 h-8 text-primary-200" />
              </div>

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
                  <span className="mr-2">👤</span>
                  讲师：{course.instructor?.name || '待分配'}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📚</span>
                  {course._count?.enrollments || 0} 名学员
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-primary-600 font-medium">
                  进入签到
                </span>
                <ArrowRight className="w-4 h-4 text-primary-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
