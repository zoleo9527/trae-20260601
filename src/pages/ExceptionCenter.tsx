import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  User,
  FileText,
  ArrowRight,
} from 'lucide-react';
import dayjs from 'dayjs';

interface Exception {
  id: string;
  type: string;
  relatedType: string;
  relatedId: string;
  description: string;
  adminNotes?: string;
  status: string;
  solution?: string;
  createdAt: string;
  processedAt?: string;
  user: {
    id: string;
    name: string;
    department: string;
    avatar?: string;
  };
  operatedBy?: {
    id: string;
    name: string;
  };
}

interface ExceptionStats {
  total: number;
  pending: number;
  processing: number;
  processed: number;
}

export default function ExceptionCenter() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [stats, setStats] = useState<ExceptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [processing, setProcessing] = useState(false);
  const [solution, setSolution] = useState('');

  useEffect(() => {
    fetchExceptions();
  }, [filter]);

  const fetchExceptions = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/exceptions', { params });
      setExceptions(response.data.data.exceptions);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Failed to fetch exceptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (exceptionId: string) => {
    if (!solution.trim()) {
      alert('请输入处理方案');
      return;
    }

    setProcessing(true);
    try {
      await api.put(`/exceptions/${exceptionId}/process`, {
        solution,
      });
      alert('处理成功');
      setSelectedException(null);
      setSolution('');
      fetchExceptions();
    } catch (error) {
      console.error('Failed to process exception:', error);
      alert('处理失败');
    } finally {
      setProcessing(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      attendance: '签到异常',
      exam: '考试异常',
      homework: '作业异常',
      other: '其他异常',
    };
    return typeMap[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: '待确认', className: 'badge-warning', icon: Clock },
      processing: { label: '处理中', className: 'badge-info', icon: Clock },
      processed: { label: '已处理', className: 'badge-success', icon: CheckCircle },
      archived: { label: '已归档', className: 'badge-pending', icon: XCircle },
    };
    return statusMap[status] || { label: status, className: 'badge-pending', icon: Clock };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">异常处理中心</h1>
        <p className="mt-1 text-sm text-gray-500">管理所有培训异常情况</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{stats?.total || 0}</div>
          <div className="text-sm text-gray-500 mt-1">异常总数</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats?.pending || 0}</div>
          <div className="text-sm text-gray-500 mt-1">待确认</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats?.processing || 0}</div>
          <div className="text-sm text-gray-500 mt-1">处理中</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats?.processed || 0}</div>
          <div className="text-sm text-gray-500 mt-1">已处理</div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">异常列表</h2>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="pending">待确认</option>
              <option value="processing">处理中</option>
              <option value="processed">已处理</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : exceptions.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无异常记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exceptions.map((exception) => {
              const statusInfo = getStatusBadge(exception.status);
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={exception.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${
                        exception.type === 'attendance' ? 'bg-blue-50' :
                        exception.type === 'exam' ? 'bg-purple-50' :
                        exception.type === 'homework' ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          exception.type === 'attendance' ? 'text-blue-600' :
                          exception.type === 'exam' ? 'text-purple-600' :
                          exception.type === 'homework' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getTypeLabel(exception.type)}
                          </span>
                          <span className={`badge ${statusInfo.className}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <User className="w-4 h-4 mr-1" />
                          {exception.user.name}（{exception.user.department}）
                        </div>
                        <p className="text-sm text-gray-600">{exception.description}</p>
                        {exception.solution && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                            <strong>处理方案：</strong>{exception.solution}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          创建时间：{dayjs(exception.createdAt).format('YYYY-MM-DD HH:mm')}
                          {exception.processedAt && (
                            <> · 处理时间：{dayjs(exception.processedAt).format('YYYY-MM-DD HH:mm')}</>
                          )}
                        </div>
                      </div>
                    </div>
                    {exception.status !== 'processed' && exception.status !== 'archived' && (
                      <button
                        onClick={() => setSelectedException(exception)}
                        className="btn-primary text-sm"
                      >
                        处理
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedException && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理异常</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">异常类型</div>
                <div className="text-gray-900">{getTypeLabel(selectedException.type)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">学员信息</div>
                <div className="text-gray-900">{selectedException.user.name}</div>
                <div className="text-sm text-gray-500">{selectedException.user.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">异常描述</div>
                <div className="text-gray-900">{selectedException.description}</div>
              </div>
              {selectedException.adminNotes && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">管理员备注</div>
                  <div className="text-gray-900">{selectedException.adminNotes}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  处理方案 <span className="text-red-500">*</span>
                </div>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="请输入处理方案"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedException(null);
                  setSolution('');
                }}
                className="btn-secondary"
                disabled={processing}
              >
                取消
              </button>
              <button
                onClick={() => handleProcess(selectedException.id)}
                className="btn-primary"
                disabled={processing}
              >
                {processing ? '处理中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
