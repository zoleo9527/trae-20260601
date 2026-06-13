import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FileText, Calendar, MapPin, ArrowRight, Users } from 'lucide-react';
import dayjs from 'dayjs';

interface Exam {
  id: string;
  title: string;
  status: string;
  duration: number;
  passingScore: number;
  totalScore: number;
  startTime: string;
  course: {
    id: string;
    title: string;
  };
  _count: {
    examScores: number;
  };
}

export default function ExamList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams');
      setExams(response.data.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '草稿', className: 'badge-pending' },
      published: { label: '已发布', className: 'badge-info' },
      ongoing: { label: '进行中', className: 'badge-success' },
      grading: { label: '批改中', className: 'badge-warning' },
      graded: { label: '已批改', className: 'bg-blue-100 text-blue-800' },
      archived: { label: '已归档', className: 'badge-pending' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'badge-pending' };
    return <span className={`badge ${className}`}>{label}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理课程考试和成绩</p>
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
      ) : exams.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无考试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              to={`/exams/${exam.id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {exam.title}
                  </h3>
                  {getStatusBadge(exam.status)}
                </div>
                <FileText className="w-8 h-8 text-primary-200" />
              </div>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {dayjs(exam.startTime).format('YYYY-MM-DD HH:mm')}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">📝</span>
                  时长：{exam.duration}分钟
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🎯</span>
                  满分{exam.totalScore}分，及格线{exam.passingScore}分
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  {exam._count?.examScores || 0} 名考生
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-500">{exam.course?.title}</span>
                <ArrowRight className="w-4 h-4 text-primary-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}