import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CreditCard, DollarSign, AlertTriangle, CheckCircle, Calendar, Filter } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card, StatusBadge, LoadingSpinner, EmptyState, formatDate, formatCurrency } from '../components/Common';
import { paymentApi } from '../api/client';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalRefund: 0,
    totalException: 0,
  });

  useEffect(() => {
    loadPayments();
  }, [search, statusFilter, typeFilter, dateFilter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.paymentType = typeFilter;
      if (dateFilter) {
        const { start, end } = getDateRange(dateFilter);
        params.startDate = start;
        params.endDate = end;
      }

      const result = await paymentApi.getAll(params);
      setPayments(result.payments || result);
      calculateSummary(result.payments || result);
    } catch (err: any) {
      setError(err.message || '加载费用列表失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: any[]) => {
    const pending = data.filter(p => p.status === 'pending' || p.status === 'confirmed').reduce((sum, p) => sum + Number(p.amount), 0);
    const paid = data.filter(p => p.status === 'paid' || p.status === 'settled').reduce((sum, p) => sum + Number(p.amount), 0);
    const refund = data.filter(p => p.status === 'refund_pending' || p.status === 'refunded').reduce((sum, p) => sum + Number(p.amount), 0);
    const exception = data.filter(p => p.status === 'exception').reduce((sum, p) => sum + Number(p.amount), 0);

    setSummary({
      totalPending: pending,
      totalPaid: paid,
      totalRefund: refund,
      totalException: exception,
    });
  };

  const getPaymentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      registration: '报名费',
      training: '学时费',
      retest: '补考费',
      reinstatement: '补训费',
      refund: '退款',
    };
    return typeMap[type] || type;
  };

  const getPaymentTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      registration: 'bg-blue-100 text-blue-800',
      training: 'bg-green-100 text-green-800',
      retest: 'bg-orange-100 text-orange-800',
      reinstatement: 'bg-purple-100 text-purple-800',
      refund: 'bg-red-100 text-red-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待确认',
      confirmed: '待支付',
      paid: '待结算',
      settled: '已结算',
      refund_pending: '退款待审',
      refunded: '已退款',
      exception: '异常',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      paid: 'bg-indigo-100 text-indigo-800',
      settled: 'bg-green-100 text-green-800',
      refund_pending: 'bg-orange-100 text-orange-800',
      refunded: 'bg-gray-100 text-gray-800',
      exception: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">费用管理</h1>
            <p className="text-gray-600 mt-1">查看和管理学员费用记录</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">待处理</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalPending)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">已收金额</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalPaid)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">退款金额</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalRefund)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">争议金额</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalException)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员姓名或电话..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">待支付</option>
            <option value="paid">待结算</option>
            <option value="settled">已结算</option>
            <option value="refund_pending">退款待审</option>
            <option value="refunded">已退款</option>
            <option value="exception">异常</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部类型</option>
            <option value="registration">报名费</option>
            <option value="training">学时费</option>
            <option value="retest">补考费</option>
            <option value="reinstatement">补训费</option>
            <option value="refund">退款</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部日期</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : payments.length === 0 ? (
          <EmptyState message="暂无费用记录" icon={<CreditCard className="w-12 h-12" />} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {payments.map((payment) => (
              <Card
                key={payment.id}
                onClick={() => navigate(`/payments/${payment.id}`)}
                className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                  payment.status === 'exception' || payment.status === 'refund_pending' ? 'border-red-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {payment.student?.name || '未知学员'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getPaymentTypeColor(payment.paymentType)}`}>
                        {getPaymentTypeLabel(payment.paymentType)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>创建时间：{formatDate(payment.createdAt)}</span>
                  </div>
                  {payment.paidAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>支付时间：{formatDate(payment.paidAt)}</span>
                    </div>
                  )}
                  {payment.settledAt && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>结算时间：{formatDate(payment.settledAt)}</span>
                    </div>
                  )}
                  {payment.handler && (
                    <div className="flex items-center gap-2">
                      <span>处理人：{payment.handler.realName}</span>
                    </div>
                  )}
                </div>

                {(payment.refundReason || payment.status === 'exception') && (
                  <div className={`mt-3 p-3 rounded-lg border ${
                    payment.status === 'exception' 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        payment.status === 'exception' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          payment.status === 'exception' ? 'text-red-900' : 'text-yellow-900'
                        }`}>
                          {payment.status === 'exception' ? '异常说明' : '退款原因'}
                        </p>
                        <p className={`text-sm ${
                          payment.status === 'exception' ? 'text-red-700' : 'text-yellow-700'
                        } mt-1`}>
                          {payment.refundReason || '费用存在争议，需人工处理'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  更新时间：{formatDate(payment.updatedAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

function getDateRange(filter: string): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filter) {
    case 'today':
      return {
        start: today.toISOString(),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return {
        start: startOfWeek.toISOString(),
        end: endOfWeek.toISOString(),
      };
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: startOfMonth.toISOString(),
        end: new Date(endOfMonth.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
    default:
      return {
        start: today.toISOString(),
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };
  }
}