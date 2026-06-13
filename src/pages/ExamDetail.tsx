import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  FileText,
  Clock,
  Target,
  Users,
  CheckCircle,
  AlertTriangle,
  History,
} from 'lucide-react';
import dayjs from 'dayjs';

interface ExamScore {
  scoreId: string;
  userId: string;
  name: string;
  employeeId: string;
  department: string;
  avatar?: string;
  score?: number;
  status: string;
  notes?: string;
  gradedAt?: string;
  gradedBy?: string;
}

interface ExamDetailData {
  examId: string;
  title: string;
  courseId: string;
  courseName: string;
  location: string;
  duration: number;
  passingScore: number;
  totalScore: number;
  startTime: string;
  endTime: string;
  status: string;
  stats: {
    total: number;
    graded: number;
    pending: number;
    absent: number;
    average: number;
    passRate: number;
  };
  scores: ExamScore[];
  timeline: any[];
}

export default function ExamDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ExamDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [selectedScore, setSelectedScore] = useState<ExamScore | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: '', notes: '' });
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');

  useEffect(() => {
    if (id) {
      fetchExamDetail(id);
    }
  }, [id]);

  const fetchExamDetail = async (examId: string) => {
    try {
      const response = await api.get(`/exams/${examId}`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch exam detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async () => {
    if (!selectedScore || !gradeForm.score) {
      alert('请输入分数');
      return;
    }

    setGrading(true);
    try {
      await api.post(`/exams/${id}/grade`, {
        scoreId: selectedScore.scoreId,
        score: parseInt(gradeForm.score),
        notes: gradeForm.notes,
      });
      alert('批改成功');
      setSelectedScore(null);
      setGradeForm({ score: '', notes: '' });
      if (id) fetchExamDetail(id);
    } catch (error) {
      console.error('Failed to grade:', error);
      alert('批改失败');
    } finally {
      setGrading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/exams/${id}/publish`);
      alert('成绩发布成功');
      if (id) fetchExamDetail(id);
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('发布失败');
    }
  };

  const handleRegisterException = async (userId: string) => {
    if (!exceptionReason.trim()) {
      alert('请填写缺考原因');
      return;
    }

    try {
      await api.post(`/exams/${id}/absent`, {
        scoreId: selectedScore?.scoreId,
        userId,
        reason: exceptionReason,
      });
      alert('缺考登记成功');
      setShowExceptionModal(false);
      setExceptionReason('');
      setSelectedScore(null);
      if (id) fetchExamDetail(id);
    } catch (error) {
      console.error('Failed to register absent:', error);
      alert('登记失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待批改', className: 'badge-pending' },
      grading: { label: '批改中', className: 'badge-info' },
      graded: { label: '已批改', className: 'badge-success' },
      published: { label: '已发布', className: 'bg-green-100 text-green-800' },
      absent: { label: '缺考', className: 'badge-danger' },
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
        <p className="text-gray-500">考试不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/exams"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
            <p className="text-sm text-gray-500">
              {data.courseName} · {dayjs(data.startTime).format('YYYY-MM-DD HH:mm')}
            </p>
          </div>
        </div>
        {data.status !== 'published' && data.stats.graded > 0 && (
          <button onClick={handlePublish} className="btn-primary">
            发布成绩
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{data.stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">参考人数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{data.stats.graded}</div>
          <div className="text-sm text-gray-500 mt-1">已批改</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{data.stats.pending}</div>
          <div className="text-sm text-gray-500 mt-1">待批改</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{data.stats.absent || 0}</div>
          <div className="text-sm text-gray-500 mt-1">缺考</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{data.stats.average}</div>
          <div className="text-sm text-gray-500 mt-1">平均分</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">{data.stats.passRate}%</div>
          <div className="text-sm text-gray-500 mt-1">及格率</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">考试信息</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Clock className="w-4 h-4 mr-2" />
              考试时长
            </div>
            <div className="text-lg font-semibold">{data.duration}分钟</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Target className="w-4 h-4 mr-2" />
              及格线
            </div>
            <div className="text-lg font-semibold">{data.passingScore}分</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <FileText className="w-4 h-4 mr-2" />
              满分
            </div>
            <div className="text-lg font-semibold">{data.totalScore}分</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-gray-500 mb-1">
              <Users className="w-4 h-4 mr-2" />
              考试状态
            </div>
            <div className="text-lg font-semibold">{data.status === 'published' ? '已发布' : data.status === 'grading' ? '批改中' : '进行中'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">成绩列表</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成绩</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.scores.map((score) => (
                <tr key={score.scoreId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.employeeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{score.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{score.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {score.score !== null && score.score !== undefined ? (
                      <span className={`text-lg font-semibold ${score.score >= data.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                        {score.score}/{data.totalScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(score.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {score.status === 'absent' ? (
                      <span className="text-gray-400">已缺考</span>
                    ) : score.status !== 'published' && score.status !== 'graded' && score.score === null ? (
                      <>
                        <button
                          onClick={() => setSelectedScore(score)}
                          className="text-primary-600 hover:text-primary-700 mr-2"
                        >
                          批改
                        </button>
                        <button
                          onClick={() => {
                            setSelectedScore(score);
                            setShowExceptionModal(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          登记缺考
                        </button>
                      </>
                    ) : score.status === 'graded' || score.status === 'published' ? (
                      <span className="text-gray-400">已完成</span>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <History className="w-5 h-5 mr-2 text-gray-400" />
            操作时间线
          </h2>
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

      {selectedScore && !showExceptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">批改成绩</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">学员信息</div>
                <div className="text-gray-900">{selectedScore.name}</div>
                <div className="text-sm text-gray-500">{selectedScore.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  成绩（满分{data.totalScore}）<span className="text-red-500">*</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={data.totalScore}
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder={`0-${data.totalScore}`}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">评语</div>
                <textarea
                  value={gradeForm.notes}
                  onChange={(e) => setGradeForm({ ...gradeForm, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="请输入评语（可选）"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedScore(null);
                  setGradeForm({ score: '', notes: '' });
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleGrade} className="btn-primary" disabled={grading}>
                {grading ? '提交中...' : '提交成绩'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExceptionModal && selectedScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              登记缺考异常
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">学员信息</div>
                <div className="text-gray-900">{selectedScore.name}</div>
                <div className="text-sm text-gray-500">{selectedScore.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  缺考原因 <span className="text-red-500">*</span>
                </div>
                <textarea
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="请填写缺考原因"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowExceptionModal(false);
                  setExceptionReason('');
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => handleRegisterException(selectedScore.userId)}
                className="btn-primary"
              >
                确认登记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}