import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, FileText, AlertTriangle, CheckCircle, Clock, Edit3, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchRenewalDetail, updateRenewalStatus } from '../api/client';
import { useRenewalStore } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { ActionDrawer } from '../components/ActionDrawer';
import { RenewalRiskDrawer } from '../components/RenewalRiskDrawer';
import type { Renewal, RenewalHistory } from '../types';

const statusOptions = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'risk', label: '风险' },
];

const riskReasons: Record<string, string> = {
  price: '价格异议',
  budget: '预算不足',
  competitor: '竞品对比',
  schedule: '时间冲突',
  satisfaction: '服务不满',
  other: '其他原因',
};

export function RenewalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateRenewal, drawerOpen, setDrawerOpen } = useRenewalStore();
  const [loading, setLoading] = useState(true);
  const [renewal, setRenewal] = useState<Renewal | null>(null);
  const [history, setHistory] = useState<RenewalHistory[]>([]);
  const [newStatus, setNewStatus] = useState<Renewal['status']>('pending');
  const [note, setNote] = useState('');
  const [riskDrawerOpen, setRiskDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setLoading(true);
      const { renewal: data, history: historyData } = await fetchRenewalDetail(id);
      setRenewal(data);
      setHistory(historyData);
      setNewStatus(data.status);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!id || !renewal) return;
    const result = await updateRenewalStatus(id, newStatus, note);
    setRenewal(result.renewal);
    setHistory(result.history);
    updateRenewal(result.renewal);
    setDrawerOpen(false);
    setNote('');
  };

  const handleRiskSubmit = async (riskLevel: string, reason: string, description: string, solution: string) => {
    if (!id || !renewal) return;
    const status = riskLevel === 'high' ? 'risk' : 'processing';
    const riskNote = `风险等级: ${riskLevel === 'high' ? '高' : riskLevel === 'medium' ? '中' : '低'}, 原因: ${riskReasons[reason]}, 说明: ${description}, 解决方案: ${solution}`;
    const result = await updateRenewalStatus(id, status as Renewal['status'], riskNote);
    setRenewal(result.renewal);
    setHistory(result.history);
    updateRenewal(result.renewal);
    setRiskDrawerOpen(false);
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      teaching: '任课老师',
      consultant: '家长顾问',
      admin: '教务老师',
      system: '系统',
    };
    return roles[role] || role;
  };

  const getDaysUntilExpire = () => {
    if (!renewal) return 0;
    const expireDate = new Date(renewal.expireDate);
    const today = new Date();
    const diff = expireDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!renewal) {
    return (
      <div className="p-6">
        <p className="text-gray-500">续费记录不存在</p>
      </div>
    );
  }

  const daysUntilExpire = getDaysUntilExpire();
  const isUrgent = daysUntilExpire <= 7 && daysUntilExpire > 0;
  const isExpired = daysUntilExpire < 0;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/renewals')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">续费详情</h1>
          <p className="text-gray-500 mt-1">{renewal.studentName} - {renewal.packageName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">学员信息</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <img
                  src={renewal.studentAvatar}
                  alt={renewal.studentName}
                  className="w-20 h-20 rounded-full bg-gray-100"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{renewal.studentName}</h3>
                  <p className="text-gray-500 mt-1">{renewal.packageName}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className={`flex items-center gap-2 text-sm ${
                      isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>到期日期: {renewal.expireDate}</span>
                      {isExpired && <span className="px-2 py-0.5 bg-red-100 rounded-full text-xs">已过期</span>}
                      {isUrgent && !isExpired && <span className="px-2 py-0.5 bg-amber-100 rounded-full text-xs">即将到期</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>负责人: {renewal.responsibleName}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                        {getRoleLabel(renewal.responsibleRole)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={renewal.status} />
                  {renewal.status === 'risk' && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      风险预警
                    </div>
                  )}
                </div>
              </div>

              {renewal.status === 'risk' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">风险标记</p>
                      <p className="text-sm text-red-700 mt-1">{renewal.notes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">操作历史</h2>
              <span className="text-sm text-gray-500">{history.length} 条记录</span>
            </div>
            <div className="divide-y divide-gray-50">
              {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无操作记录</div>
              ) : (
                history.map((item, index) => (
                  <div key={item.id} className="px-6 py-4 flex gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.action === '完成续费' ? 'bg-green-100' :
                        item.action === '标记风险' ? 'bg-red-100' :
                        item.action === '开始处理' ? 'bg-blue-100' :
                        'bg-gray-100'
                      }`}>
                        {item.action === '完成续费' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : item.action === '标记风险' ? (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        ) : item.action === '开始处理' ? (
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      {index < history.length - 1 && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{item.action}</span>
                        <span className="text-xs text-gray-400">{item.createdAt}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">{item.operator}</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                          {getRoleLabel(item.operatorRole)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">快捷操作</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">状态变更</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Renewal['status'])}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {(newStatus === 'risk' || newStatus === 'completed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={newStatus === 'risk' ? '请输入风险原因...' : '请输入完成说明...'}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              )}
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-full py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                更新状态
              </button>
              {renewal.status !== 'risk' && renewal.status !== 'completed' && (
                <button
                  onClick={() => setRiskDrawerOpen(true)}
                  className="w-full py-3 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  标记风险
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">责任归属</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{renewal.responsibleName}</p>
                  <p className="text-sm text-gray-500">{getRoleLabel(renewal.responsibleRole)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">任务信息</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">创建时间</span>
                <span className="text-sm text-gray-800">{renewal.createdAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">更新时间</span>
                <span className="text-sm text-gray-800">{renewal.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">到期倒计时</span>
                <span className={`text-sm font-medium ${
                  isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {isExpired ? `已过期 ${Math.abs(daysUntilExpire)} 天` : `${daysUntilExpire} 天`}
                </span>
              </div>
              {renewal.notes && (
                <div>
                  <span className="text-sm text-gray-500 block mb-1">备注</span>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg">{renewal.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ActionDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="确认状态变更"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">确认更新状态</p>
                <p className="text-xs text-amber-700 mt-1">
                  将 {renewal.studentName} 的续费状态从 "{statusOptions.find(o => o.value === renewal.status)?.label}" 变更为 "{statusOptions.find(o => o.value === newStatus)?.label}"
                </p>
              </div>
            </div>
          </div>
          {note && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{note}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleStatusUpdate}
              className="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              确认变更
            </button>
          </div>
        </div>
      </ActionDrawer>

      <RenewalRiskDrawer
        isOpen={riskDrawerOpen}
        onClose={() => setRiskDrawerOpen(false)}
        onSubmit={handleRiskSubmit}
        studentName={renewal.studentName}
        packageName={renewal.packageName}
      />
    </div>
  );
}