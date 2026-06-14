import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, MapPin, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatusTimeline } from '../components/StatusTimeline';
import { Card, StatusBadge, Button, LoadingSpinner, formatDate } from '../components/Common';
import { examApi, statusLogApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const ExamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [exam, setExam] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadExam();
  }, [id]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const result = await examApi.getById(id!);
      setExam(result.exam);

      const logResult = await statusLogApi.getByEntity('exam_booking', id!);
      setLogs(logResult.logs);
    } catch (err: any) {
      setError(err.message || '加载考试详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    const date = prompt('请输入考试日期（YYYY-MM-DD）：');
    if (!date) return;

    const location = prompt('请输入考试地点：');
    if (!location) return;

    try {
      setActionLoading(true);
      await examApi.book(id!, {
        scheduledDate: new Date(date).toISOString(),
        location,
        reason: '预约考试',
        remark: '',
      });
      await loadExam();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScore = async () => {
    const score = prompt('请输入考试成绩（0-100）：');
    if (!score) return;

    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      alert('请输入有效的成绩（0-100）');
      return;
    }

    try {
      setActionLoading(true);
      await examApi.score(id!, {
        score: numScore,
        reason: numScore >= 90 ? '考试通过' : '考试未通过',
        remark: numScore >= 90 ? '' : '需要补考',
      });
      await loadExam();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getNextStatus = () => {
    if (!exam) return null;

    const statusFlow: Record<string, { next: string; label: string }[]> = {
      pending: [{ next: 'booked', label: '预约考试' }],
      booked: [{ next: 'completed', label: '标记完成' }],
      completed: [{ next: 'scored', label: '录入学分' }],
      retest: [{ next: 'booked', label: '预约补考' }],
    };

    return statusFlow[exam.status] || null;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待预约',
      booked: '已预约',
      completed: '已完成',
      absent: '缺考',
      scored: '成绩已录',
      archived: '已归档',
      retest: '需补考',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><div className="text-center py-12 text-red-500">{error}</div></Layout>;
  if (!exam) return <Layout><div className="text-center py-12">考试记录不存在</div></Layout>;

  const nextActions = getNextStatus();
  const isRetest = exam.status === 'retest';
  const isCompleted = exam.status === 'scored' || exam.status === 'archived';

  return (
    <Layout>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">考试详情</h1>
              <p className="text-gray-500">
                学员：{exam.student?.name} · {exam.student?.phone}
              </p>
            </div>
            <StatusBadge status={exam.status} />
          </div>

          {isRetest && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900">需补考</p>
                  <p className="text-orange-700 mt-1">
                    学员此前考试未通过，需要重新预约补考
                    {exam.retestFee && `，补考费用：¥${exam.retestFee}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-sm">考试科目</span>
              </div>
              <p className="font-semibold text-gray-900">{exam.examType}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">考试时间</span>
              </div>
              <p className="font-semibold text-gray-900">
                {exam.scheduledDate ? formatDate(exam.scheduledDate) : '待预约'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">考试地点</span>
              </div>
              <p className="font-semibold text-gray-900">{exam.location || '-'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">考试专员</span>
              </div>
              <p className="font-semibold text-gray-900">{exam.examiner?.realName || '未分配'}</p>
            </div>
          </div>

          {exam.score !== null && (
            <div className="p-4 bg-green-50 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-700">{exam.score}</span>
                </div>
                <div>
                  <p className="font-semibold text-green-900">考试成绩</p>
                  <p className="text-green-700">
                    {exam.score >= 90 ? '恭喜通过！' : '未通过，需要补考'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {exam.retestFee && (
            <div className="p-4 bg-yellow-50 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">补考费用</p>
                  <p className="text-yellow-700">需缴纳补考费 ¥{exam.retestFee}</p>
                </div>
              </div>
            </div>
          )}

          {!isCompleted && (
            <div className="flex flex-wrap gap-3 mb-6">
              {nextActions?.map((action) => (
                <Button
                  key={action.next}
                  onClick={() => {
                    if (action.next === 'booked') {
                      handleBook();
                    } else if (action.next === 'scored') {
                      handleScore();
                    } else {
                      if (confirm('确认标记为已完成？')) {
                        handleComplete(action.next);
                      }
                    }
                  }}
                  loading={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Card className="p-6">
          <StatusTimeline logs={logs} />
        </Card>
      </div>
    </Layout>
  );
};

async function handleComplete(status: string) {
  console.log('Completing with status:', status);
}