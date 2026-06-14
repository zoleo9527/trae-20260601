import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Car, CreditCard, FileText, Clock } from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatusTimeline } from '../components/StatusTimeline';
import { Card, StatusBadge, LoadingSpinner, formatDate, formatCurrency } from '../components/Common';
import { studentApi } from '../api/client';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadStudent();
  }, [id]);

  const loadStudent = async () => {
    try {
      setLoading(true);
      const result = await studentApi.getById(id!);
      setStudent(result.student);
      setStatusLogs(result.statusLogs);
    } catch (err: any) {
      setError(err.message || '加载学员详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><div className="text-center py-12 text-red-500">{error}</div></Layout>;
  if (!student) return <Layout><div className="text-center py-12">学员不存在</div></Layout>;

  const totalHours = student.trainingHours.reduce((sum: number, t: any) => sum + Number(t.actualHours || 0), 0);
  const totalPaid = student.payments.filter((p: any) => p.status === 'settled').reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  return (
    <Layout>
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-gray-500">报考类型：{student.examType}</p>
              </div>
            </div>
            <StatusBadge status={student.status} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Phone className="w-4 h-4" />
                <span className="text-sm">电话</span>
              </div>
              <p className="font-semibold text-gray-900">{student.phone}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Car className="w-4 h-4" />
                <span className="text-sm">总学时</span>
              </div>
              <p className="font-semibold text-gray-900">{totalHours}小时</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">总费用</span>
              </div>
              <p className="font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">教练</span>
              </div>
              <p className="font-semibold text-gray-900">{student.coach?.realName || '未分配'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5" />
                学时记录
              </h2>
              {student.trainingHours.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无学时记录</p>
              ) : (
                <div className="space-y-3">
                  {student.trainingHours.map((training: any) => (
                    <div key={training.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{formatDate(training.scheduledAt)}</p>
                        <p className="text-sm text-gray-500">
                          {training.location && `场地：${training.location}`}
                          {training.actualHours && ` · 实际学时：${training.actualHours}小时`}
                        </p>
                        {training.exceptionReason && (
                          <p className="text-sm text-red-600 mt-1">{training.exceptionReason}</p>
                        )}
                      </div>
                      <StatusBadge status={training.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                费用记录
              </h2>
              {student.payments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无费用记录</p>
              ) : (
                <div className="space-y-3">
                  {student.payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {getPaymentTypeLabel(payment.paymentType)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(payment.createdAt)}
                          {payment.refundReason && ` · ${payment.refundReason}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                考试记录
              </h2>
              {student.examBookings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无考试记录</p>
              ) : (
                <div className="space-y-3">
                  {student.examBookings.map((exam: any) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{exam.examType}</p>
                        <p className="text-sm text-gray-500">
                          {exam.scheduledDate ? formatDate(exam.scheduledDate) : '待预约'}
                          {exam.location && ` · ${exam.location}`}
                          {exam.score !== null && ` · 成绩：${exam.score}分`}
                        </p>
                      </div>
                      <StatusBadge status={exam.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <StatusTimeline logs={statusLogs} />
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function getPaymentTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    registration: '报名费',
    training: '学时费',
    retest: '补考费',
    reinstatement: '补训费',
    refund: '退款',
  };
  return typeMap[type] || type;
}
