import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  History,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import dayjs from 'dayjs';

interface Submission {
  submissionId: string;
  userId: string;
  name: string;
  employeeId: string;
  department: string;
  avatar?: string;
  status: string;
  submittedAt?: string;
  score?: number;
  isLatest: boolean;
  gradedAt?: string;
  gradedBy?: string;
}

interface HomeworkSubmissionsData {
  homeworkId: string;
  homeworkTitle: string;
  courseId: string;
  courseName: string;
  deadline: string;
  totalScore: number;
  stats: {
    total: number;
    submitted: number;
    late: number;
    pending: number;
    graded: number;
  };
  submissions: Submission[];
}

interface SubmissionDetail {
  submissionId: string;
  homeworkId: string;
  user: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
  };
  status: string;
  submittedAt: string;
  version: number;
  attachments: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
  notes: string;
  score: number | null;
  gradeNotes: string;
  gradedAt: string | null;
  gradedBy: string | null;
  history: Array<{
    version: number;
    submittedAt: string;
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      fileSize?: number;
      mimeType?: string;
    }>;
  }>;
  timeline: Array<{
    id: string;
    details: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
  expandedVersions?: number[];
}

export default function HomeworkSubmissions() {
  const { id } = useParams();
  const [data, setData] = useState<HomeworkSubmissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);
  const [grading, setGrading] = useState(false);
  const [gradeForm, setGradeForm] = useState({ score: '', notes: '' });
  const [viewingDetail, setViewingDetail] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmissions(id);
    }
  }, [id]);

  const fetchSubmissions = async (homeworkId: string) => {
    try {
      const response = await api.get(`/homework/${homeworkId}/submissions`);
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionDetail = async (submissionId: string) => {
    try {
      const response = await api.get(`/homework/${id}/submissions/${submissionId}`);
      setSubmissionDetail(response.data.data);
      setViewingDetail(true);
    } catch (error) {
      console.error('Failed to fetch submission detail:', error);
    }
  };

  const handleGrade = async (submissionId: string) => {
    if (!gradeForm.score) {
      alert('请输入分数');
      return;
    }

    setGrading(true);
    try {
      await api.post(`/homework/${id}/grade`, {
        submissionId,
        score: parseInt(gradeForm.score),
        gradeNotes: gradeForm.notes,
      });
      alert('批改成功');
      setSelectedSubmission(null);
      setGradeForm({ score: '', notes: '' });
      if (id) fetchSubmissions(id);
    } catch (error) {
      console.error('Failed to grade:', error);
      alert('批改失败');
    } finally {
      setGrading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待提交', className: 'badge-pending' },
      submitted: { label: '已提交', className: 'badge-info' },
      late: { label: '逾期提交', className: 'badge-warning' },
      graded: { label: '已批改', className: 'badge-success' },
    };
    const { label, className } = statusMap[status] || { label: status, className: 'badge-pending' };
    return <span className={`badge ${className}`}>{label}</span>;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
        <p className="text-gray-500">作业不存在</p>
      </div>
    );
  }

  const isDeadlinePassed = dayjs(data.deadline).isBefore(dayjs());

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
            <h1 className="text-2xl font-bold text-gray-900">{data.homeworkTitle}</h1>
            <p className="text-sm text-gray-500">
              {data.courseName} · 截止时间：{dayjs(data.deadline).format('YYYY-MM-DD HH:mm')}
              {isDeadlinePassed && <span className="text-red-500 ml-2">（已截止）</span>}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{data.stats.total}</div>
          <div className="text-sm text-gray-500 mt-1">总人数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{data.stats.submitted}</div>
          <div className="text-sm text-gray-500 mt-1">已提交</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{data.stats.late}</div>
          <div className="text-sm text-gray-500 mt-1">逾期提交</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-orange-600">{data.stats.pending}</div>
          <div className="text-sm text-gray-500 mt-1">待提交</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{data.stats.graded}</div>
          <div className="text-sm text-gray-500 mt-1">已批改</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">作业回收</h2>
        </div>
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
                  提交状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提交时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  成绩
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.submissions.map((submission) => (
                <tr key={submission.submissionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.employeeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {submission.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.submittedAt
                      ? dayjs(submission.submittedAt).format('YYYY-MM-DD HH:mm')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {submission.score !== null && submission.score !== undefined ? (
                      <span className="font-medium text-green-600">
                        {submission.score}/{data.totalScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {submission.status !== 'graded' && submission.status !== 'pending' ? (
                      <>
                        <button
                          onClick={() => fetchSubmissionDetail(submission.submissionId)}
                          className="text-blue-600 hover:text-blue-700 mr-2"
                        >
                          <Eye className="w-4 h-4 inline mr-1" />查看
                        </button>
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          批改
                        </button>
                      </>
                    ) : submission.status === 'graded' ? (
                      <button
                        onClick={() => fetchSubmissionDetail(submission.submissionId)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />查看详情
                      </button>
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

      {selectedSubmission && !viewingDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedSubmission.status === 'graded' ? '查看批改' : '批改作业'}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">学员信息</div>
                <div className="text-gray-900">{selectedSubmission.name}</div>
                <div className="text-sm text-gray-500">{selectedSubmission.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">提交状态</div>
                {getStatusBadge(selectedSubmission.status)}
                {selectedSubmission.submittedAt && (
                  <div className="text-sm text-gray-500 mt-1">
                    提交时间：{dayjs(selectedSubmission.submittedAt).format('YYYY-MM-DD HH:mm')}
                  </div>
                )}
              </div>
              {selectedSubmission.status !== 'graded' && (
                <>
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
                </>
              )}
              {selectedSubmission.status === 'graded' && (
                <>
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">成绩</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSubmission.score}/{data.totalScore}
                    </div>
                  </div>
                  {selectedSubmission.gradedBy && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">批改人</div>
                      <div className="text-gray-900">{selectedSubmission.gradedBy}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setGradeForm({ score: '', notes: '' });
                }}
                className="btn-secondary"
              >
                关闭
              </button>
              {selectedSubmission.status !== 'graded' && (
                <button
                  onClick={() => handleGrade(selectedSubmission.submissionId)}
                  className="btn-primary"
                  disabled={grading}
                >
                  {grading ? '提交中...' : '提交成绩'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {viewingDetail && submissionDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">作业提交详情</h3>
              <button
                onClick={() => {
                  setViewingDetail(false);
                  setSubmissionDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">学员</div>
                  <div className="font-medium text-gray-900">{submissionDetail.user.name}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">部门</div>
                  <div className="font-medium text-gray-900">{submissionDetail.user.department}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">提交状态</div>
                  {getStatusBadge(submissionDetail.status)}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">提交版本</div>
                  <div className="font-medium text-gray-900">第 {submissionDetail.version} 版</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" />
                  附件文件
                </h4>
                {submissionDetail.attachments && submissionDetail.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {submissionDetail.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(file.fileSize)} · {file.mimeType}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`http://localhost:3000${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          下载
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 py-4 text-center">暂无附件</div>
                )}
              </div>

              {submissionDetail.history && submissionDetail.history.length > 1 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    版本历史
                  </h4>
                  <div className="space-y-2">
                    {submissionDetail.history.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          item.version === submissionDetail.version
                            ? 'bg-primary-50 border border-primary-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                                item.version === submissionDetail.version
                                  ? 'bg-primary-100 text-primary-700'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              v{item.version}
                            </span>
                            <div>
                              <div className="text-sm text-gray-900">
                                {dayjs(item.submittedAt).format('YYYY-MM-DD HH:mm')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.attachments?.length || 0} 个附件
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.version === submissionDetail.version && (
                              <span className="text-xs text-primary-600">当前版本</span>
                            )}
                            {item.attachments && item.attachments.length > 0 && (
                              <button
                                onClick={() => {
                                  const expandedVersion = submissionDetail.history?.find(h => h.version === item.version);
                                  if (expandedVersion) {
                                    const newExpanded = [...(submissionDetail.expandedVersions || [])];
                                    if (newExpanded.includes(item.version)) {
                                      setSubmissionDetail({
                                        ...submissionDetail,
                                        expandedVersions: newExpanded.filter(v => v !== item.version)
                                      });
                                    } else {
                                      setSubmissionDetail({
                                        ...submissionDetail,
                                        expandedVersions: [...newExpanded, item.version]
                                      });
                                    }
                                  }
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700"
                              >
                                {submissionDetail.expandedVersions?.includes(item.version) ? '收起' : '查看附件'}
                              </button>
                            )}
                          </div>
                        </div>
                        {submissionDetail.expandedVersions?.includes(item.version) && item.attachments && item.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {item.attachments.map((file, fileIndex) => (
                              <div
                                key={fileIndex}
                                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                              >
                                <div className="flex items-center">
                                  <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatFileSize(file.fileSize || 0)} · {file.mimeType}
                                    </div>
                                  </div>
                                </div>
                                {file.fileUrl && (
                                  <a
                                    href={`http://localhost:3000${file.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                                  >
                                    <Download className="w-3 h-3 mr-1" />
                                    下载
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {submissionDetail.score !== null && submissionDetail.score !== undefined && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    批改记录
                  </h4>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl font-bold text-green-600">
                        {submissionDetail.score}/{data.totalScore}
                      </span>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">批改人</div>
                        <div className="font-medium text-gray-900">
                          {submissionDetail.gradedBy || '未知'}
                        </div>
                      </div>
                    </div>
                    {submissionDetail.gradeNotes && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">评语</div>
                        <div className="text-gray-900">{submissionDetail.gradeNotes}</div>
                      </div>
                    )}
                    {submissionDetail.gradedAt && (
                      <div className="text-xs text-gray-500 mt-3">
                        批改时间：{dayjs(submissionDetail.gradedAt).format('YYYY-MM-DD HH:mm')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {submissionDetail.timeline && submissionDetail.timeline.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">操作记录</h4>
                  <div className="space-y-3">
                    {submissionDetail.timeline.map((item) => (
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

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewingDetail(false);
                  setSubmissionDetail(null);
                }}
                className="btn-secondary"
              >
                关闭
              </button>
              {submissionDetail.status !== 'graded' && (
                <button
                  onClick={() => {
                    setSelectedSubmission({
                      submissionId: submissionDetail.submissionId,
                      userId: submissionDetail.user.id,
                      name: submissionDetail.user.name,
                      employeeId: submissionDetail.user.employeeId,
                      department: submissionDetail.user.department,
                      status: submissionDetail.status,
                      submittedAt: submissionDetail.submittedAt,
                      score: submissionDetail.score || undefined,
                      isLatest: true,
                      gradedAt: submissionDetail.gradedAt || undefined,
                      gradedBy: submissionDetail.gradedBy || undefined,
                    });
                    setViewingDetail(false);
                  }}
                  className="btn-primary"
                >
                  批改作业
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}