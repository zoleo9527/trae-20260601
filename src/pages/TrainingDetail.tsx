import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatusTimeline } from '../components/StatusTimeline';
import { Card, StatusBadge, Button, LoadingSpinner, formatDate, formatCurrency } from '../components/Common';
import { trainingApi, statusLogApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const TrainingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [training, setTraining] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadTraining();
  }, [id]);

  const loadTraining = async () => {
    try {
      setLoading(true);
      const result = await trainingApi.getById(id!);
      setTraining(result.training);

      const logResult = await statusLogApi.getByEntity('training_hours', id!);
      setLogs(logResult.logs);
    } catch (err: any) {
      setError(err.message || '加载学时详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (status: string, actualHours?: number) => {
    if (!confirm('确认此操作？')) return;

    try {
      setActionLoading(true);
      await trainingApi.confirm(id!, {
        status,
        actualHours,
        actualAt: new Date().toISOString(),
        reason: getStatusReason(status),
        remark: '',
      });
      await loadTraining();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleException = async () => {
    const reason = prompt('请输入异常原因：');
    if (!reason) return;

    const remark = prompt('请输入补充说明（可选）：');

    try {
      setActionLoading(true);
      await trainingApi.markException(id!, {
        exceptionReason: reason,
        reason: '练车异常',
        remark: remark || '',
      });
      await loadTraining();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getNextStatus = () => {
    if (!training) return null;

    const statusFlow: Record<string, { next: string; label: string }[]> = {
      scheduled: [{ next: 'coach_confirmed', label: '确认练车' }],
      coach_confirmed: [{ next: 'hours_recorded', label: '录入学时' }],
      hours_recorded: [{ next: 'student_confirmed', label: '学员确认' }],
      student_confirmed: [{ next: 'completed', label: '完成学时' }],
    };

    return statusFlow[training.status] || null;
  };

  const getStatusReason = (status: string) => {
    const reasonMap: Record<string, string> = {
      coach_confirmed: '教练确认练车',
      hours_recorded: '录入学时完成',
      student_confirmed: '学员确认学时',
      completed: '学时完成',
    };
    return reasonMap[status] || status;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><div className="text-center py-12 text-red-500">{error}</div></Layout>;
  if (!training) return <Layout><div className="text-center py-12">学时记录不存在</div></Layout>;

  const nextActions = getNextStatus();
  const isException = training.status === 'exception';
  const isCompleted = training.status === 'completed';

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">练车记录详情</h1>
              <p className="text-gray-500">
                学员：{training.student?.name} · {training.student?.phone}
              </p>
            </div>
            <StatusBadge status={training.status} />
          </div>

          {isException && training.exceptionReason && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">异常原因</p>
                  <p className="text-red-700 mt-1">{training.exceptionReason}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">预约时间</span>
              </div>
              <p className="font-semibold text-gray-900">{formatDate(training.scheduledAt)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">预约学时</span>
              </div>
              <p className="font-semibold text-gray-900">{training.hours}小时</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">实际学时</span>
              </div>
              <p className="font-semibold text-gray-900">
                {training.actualHours ? `${training.actualHours}小时` : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">练车场地</span>
              </div>
              <p className="font-semibold text-gray-900">{training.location || '-'}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <User className="w-4 h-4" />
              <span className="text-sm">教练</span>
            </div>
            <p className="font-semibold text-gray-900">{training.coach?.realName}</p>
          </div>

          {!isCompleted && !isException && (
            <div className="flex flex-wrap gap-3 mb-6">
              {nextActions?.map((action) => (
                <Button
                  key={action.next}
                  onClick={() => {
                    if (action.next === 'hours_recorded') {
                      const hours = prompt('请输入实际学时数：', training.hours.toString());
                      if (hours) handleConfirm(action.next, parseFloat(hours));
                    } else {
                      handleConfirm(action.next);
                    }
                  }}
                  loading={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
              <Button variant="danger" onClick={handleException} loading={actionLoading}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                标记异常
              </Button>
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
