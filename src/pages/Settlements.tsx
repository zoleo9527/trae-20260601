
import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, FileText, DollarSign, Minus } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Settlement, SettlementAdjustment, Dispute } from '../../shared/types';

type TabType = 'overview' | 'adjustments' | 'disputes';

export function Settlements() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [adjustments, setAdjustments] = useState<SettlementAdjustment[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewData, settlementsData, adjustmentsData, disputesData] = await Promise.all([
          api.settlements.overview(),
          api.settlements.details(),
          api.settlements.adjustments(),
          api.settlements.disputes(),
        ]);
        setOverview(overviewData);
        setSettlements(settlementsData);
        setAdjustments(adjustmentsData);
        setDisputes(disputesData);
      } catch (error) {
        console.error('Failed to fetch settlement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDispute = async (status: string) => {
    if (!selectedDispute) return;
    try {
      await api.settlements.updateDispute(selectedDispute.id, {
        status: status as Dispute['status'],
        handler: '赵财务',
        resolution,
      });
      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id
            ? { ...d, status: status as Dispute['status'], handler: '赵财务', resolution, resolvedAt: new Date().toISOString() }
            : d
        )
      );
      setSelectedDispute(null);
      setResolution('');
    } catch (error) {
      console.error('Failed to update dispute:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string; icon: typeof Wallet }[] = [
    { key: 'overview', label: '分账概览', icon: Wallet },
    { key: 'adjustments', label: '调整记录', icon: FileText },
    { key: 'disputes', label: '对账异议', icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Tab 导航 */}
      <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.key === 'disputes' && disputes.filter((d) => d.status === 'pending' || d.status === 'reviewing').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {disputes.filter((d) => d.status === 'pending' || d.status === 'reviewing').length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 分账概览 */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">总营收</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ¥{overview.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">平台分成</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ¥{overview.totalPlatformShare.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">场地方分成</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ¥{overview.totalPartnerShare.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Wallet className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">退款扣减</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    ¥{overview.totalRefundDeduction.toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 分账明细 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">分账明细</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">站点</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">总营收</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">平台分成</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">场地方分成</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">退款扣减</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4 text-gray-900">{s.date}</td>
                      <td className="px-5 py-4 text-gray-900">{s.stationName}</td>
                      <td className="px-5 py-4 text-gray-900">¥{s.totalAmount.toFixed(2)}</td>
                      <td className="px-5 py-4 text-gray-600">¥{s.platformShare.toFixed(2)}</td>
                      <td className="px-5 py-4 text-gray-600">¥{s.finalPartnerShare.toFixed(2)}</td>
                      <td className="px-5 py-4 text-red-600">
                        {s.refundDeduction > 0 ? `-¥${s.refundDeduction.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge type="settlement" status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 调整记录 */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">站点</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">原因</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作人</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(a.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-5 py-4 text-gray-900">
                      {settlements.find((s) => s.id === a.settlementId)?.stationName}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        a.type === 'refund' ? 'bg-orange-100 text-orange-700' :
                        a.type === 'compensation' ? 'bg-green-100 text-green-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {a.type === 'refund' && '退款扣减'}
                        {a.type === 'compensation' && '补偿'}
                        {a.type === 'dispute' && '异议调整'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={a.type === 'compensation' ? 'text-green-600' : 'text-red-600'}>
                        {a.type === 'compensation' ? '+' : '-'}¥{a.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{a.reason}</td>
                    <td className="px-5 py-4 text-gray-600">{a.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 对账异议 */}
      {activeTab === 'disputes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{dispute.stationName}</h3>
                  <p className="text-sm text-gray-500">{dispute.partnerName}</p>
                </div>
                <StatusBadge type="dispute" status={dispute.status} />
              </div>

              <div className="mb-4">
                <div className="flex items-center text-red-600 mb-2">
                  <Minus className="w-4 h-4 mr-1" />
                  <span className="font-semibold">异议金额：¥{dispute.disputedAmount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-600">{dispute.reason}</p>
              </div>

              {dispute.resolution && (
                <div className="bg-green-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-500 mb-1">处理结果：</p>
                  <p className="text-sm text-gray-700">{dispute.resolution}</p>
                  <p className="text-xs text-gray-500 mt-1">处理人：{dispute.handler}</p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                提交时间：{new Date(dispute.createdAt).toLocaleString('zh-CN')}
              </div>

              {(dispute.status === 'pending' || dispute.status === 'reviewing') && (
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setResolution('');
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    处理异议
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 处理异议弹窗 */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">处理对账异议</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">异议站点：{selectedDispute.stationName}</p>
              <p className="text-sm text-gray-600 mb-1">异议金额：¥{selectedDispute.disputedAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">异议原因：{selectedDispute.reason}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder="请输入处理结果"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDispute(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDispute('rejected')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                驳回
              </button>
              <button
                onClick={() => handleDispute('resolved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                同意调整
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
