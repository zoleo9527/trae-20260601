import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, User, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatusTimeline } from '../components/StatusTimeline';
import { Card, StatusBadge, Button, LoadingSpinner, formatDate, formatCurrency } from '../components/Common';
import { paymentApi, statusLogApi } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [payment, setPayment] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const result = await paymentApi.getById(id!);
      setPayment(result.payment);

      const logResult = await statusLogApi.getByEntity('payment', id!);
      setLogs(logResult.logs);
    } catch (err: any) {
      setError(err.message || '加载费用详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (status: string) => {
    if (!confirm('确认此操作？')) return;

    try {
      setActionLoading(true);
      const data: any = {
        status,
        reason: getStatusReason(status),
      };

      if (status === 'paid') {
        data.paidAt = new Date().toISOString();
      } else if (status === 'settled') {
        data.paidAt = payment.paidAt || new Date().toISOString();
        data.settledAt = new Date().toISOString();
      } else if (status === 'refund_pending' || status === 'refunded') {
        const reason = prompt('请输入退款原因：');
        if (!reason) {
          setActionLoading(false);
          return;
        }
        data.refundReason = reason;
      }

      await paymentApi.settle(id!, data);
      await loadPayment();
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusReason = (status: string) => {
    const reasonMap: Record<string, string> = {
      confirmed: '招生顾问确认费用',
      paid: '学员支付完成',
      settled: '费用已结算',
      refund_pending: '发起退款申请',
      refunded: '退款已完成',
    };
    return reasonMap[status] || status;
  };

  const getNextStatus = () => {
    if (!payment) return null;

    const statusFlow: Record<string, { next: string; label: string; variant: string }[]> = {
      pending: [{ next: 'confirmed', label: '确认费用', variant: 'primary' }],
      confirmed: [{ next: 'paid', label: '确认支付', variant: 'primary' }],
      paid: [{ next: 'settled', label: '完成结算', variant: 'primary' }],
    };

    return statusFlow[payment.status] || null;
  };

  if (loading) return <Layout><LoadingSpinner /></Layout>;
  if (error) return <Layout><div className="text-center py-12 text-red-500">{error}</div></Layout>;
  if (!payment) return <Layout><div className="text-center py-12">费用记录不存在</div></Layout>;

  const nextActions = getNextStatus();
  const isRefundPending = payment.status === 'refund_pending';
  const isSettled = payment.status === 'settled' || payment.status === 'refunded';
  const isException = payment.status === 'exception';

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">费用记录详情</h1>
              <p className="text-gray-500">
                学员：{payment.student?.name} · {payment.student?.phone}
              </p>
            </div>
            <StatusBadge status={payment.status} />
          </div>

          {isException && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">费用异常</p>
                  <p className="text-red-700 mt-1">此费用记录存在异常，请联系管理员处理</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">费用类型</span>
              </div>
              <p className="font-semibold text-gray-900">{getPaymentTypeLabel(payment.paymentType)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">金额</span>
              </div>
              <p className="font-semibold text-2xl text-gray-900">{formatCurrency(payment.amount)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">支付时间</span>
              </div>
              <p className="font-semibold text-gray-900">
                {payment.paidAt ? formatDate(payment.paidAt) : '-'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">结算时间</span>
              </div>
              <p className="font-semibold text-gray-900">
                {payment.settledAt ? formatDate(payment.settledAt) : '-'}
              </p>
            </div>
          </div>

          {payment.refundReason && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900">退款原因</p>
                  <p className="text-yellow-700 mt-1">{payment.refundReason}</p>
                </div>
              </div>
            </div>
          )}

          {payment.handler && (
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User className="w-4 h-4" />
                <span className="text-sm">处理人</span>
              </div>
              <p className="font-semibold text-gray-900">
                {payment.handler.realName} · {getRoleLabel(payment.handler.role)}
              </p>
            </div>
          )}

          {!isSettled && !isException && (
            <div className="flex flex-wrap gap-3 mb-6">
              {nextActions?.map((action) => (
                <Button
                  key={action.next}
                  onClick={() => handleSettle(action.next)}
                  loading={actionLoading}
                  variant={action.variant === 'danger' ? 'danger' : 'primary'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              ))}
              {payment.paymentType !== 'refund' && (
                <Button variant="danger" onClick={() => handleSettle('refund_pending')} loading={actionLoading}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  发起退款
                </Button>
              )}
            </div>
          )}

          {isRefundPending && (
            <div className="flex flex-wrap gap-3 mb-6">
              <Button onClick={() => handleSettle('refunded')} loading={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                确认退款
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

function getRoleLabel(role: string): string {
  const roleMap: Record<string, string> = {
    advisor: '招生顾问',
    coach: '教练',
    examiner: '考试专员',
    admin: '管理员',
  };
  return roleMap[role] || role;
}
