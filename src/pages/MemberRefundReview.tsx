import { useState } from 'react';
import {
  mockMembers,
  mockConsumptions,
  mockRefunds,
  mockProcessingHistory,
  mockCurrentMemberId,
} from '@/mock/data';
import { Member, ConsumptionItem, RefundApplication, ProcessingHistory } from '@/types';

const statusColors: Record<string, string> = {
  '待处理': 'bg-yellow-100 text-yellow-800',
  '处理中': 'bg-blue-100 text-blue-800',
  '已批准': 'bg-green-100 text-green-800',
  '已拒绝': 'bg-red-100 text-red-800',
  '已退回': 'bg-orange-100 text-orange-800',
  '部分退款': 'bg-purple-100 text-purple-800',
  '补偿券替代': 'bg-pink-100 text-pink-800',
};

export default function MemberRefundReview() {
  const [selectedMemberId] = useState<string>(mockCurrentMemberId);
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'consumption' | 'refund'>('consumption');

  const currentMember: Member | undefined = mockMembers.find(
    (m) => m.id === selectedMemberId
  );

  const memberConsumptions: ConsumptionItem[] = mockConsumptions.filter(
    (c) => c.memberId === selectedMemberId
  );

  const memberRefunds: RefundApplication[] = mockRefunds.filter(
    (r) => r.memberId === selectedMemberId
  );

  const selectedRefund: RefundApplication | undefined = mockRefunds.find(
    (r) => r.id === selectedRefundId
  );

  const refundHistory: ProcessingHistory[] = selectedRefundId
    ? mockProcessingHistory.filter((h) => h.refundId === selectedRefundId)
    : [];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部标题栏 */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                洗浴中心 - 储值扣费与退款复查
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                消费流水、退款依据、处理历史全程可追溯
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="px-3 py-1 bg-slate-100 rounded">
                当前角色：财务复查员
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded">
                Mock 数据演示
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* 会员信息卡片 */}
        {currentMember && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {currentMember.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-800">
                      {currentMember.name}
                    </h2>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                      {currentMember.memberLevel}
                    </span>
                    <span className="text-sm text-slate-500">
                      {currentMember.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
                    <span>会员编号：{currentMember.id}</span>
                    <span>注册日期：{currentMember.registerDate}</span>
                    <span>
                      最近消费：{currentMember.lastConsumeDate}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">
                    ¥{currentMember.balance.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">当前余额</p>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700">
                    ¥{currentMember.totalRecharge.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">累计充值</p>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700">
                    ¥{currentMember.totalConsume.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">累计消费</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-5">
          {/* 左侧：消费明细 / 退款申请 列表 */}
          <div className="col-span-7">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
              {/* Tab 切换 */}
              <div className="border-b border-slate-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('consumption')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'consumption'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    消费明细
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {memberConsumptions.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('refund')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'refund'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    退款申请
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {memberRefunds.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* 消费明细列表 */}
              {activeTab === 'consumption' && (
                <div className="overflow-auto" style={{ maxHeight: '480px' }}>
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          手牌
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          消费项目
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          类型
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          金额
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          支付方式
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          消费时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          操作员
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberConsumptions.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded">
                              {item.wristbandNo}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-800">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.floor} · {item.quantity}份 × ¥{item.unitPrice}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-slate-600">
                              {item.itemType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-800">
                              ¥{item.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-xs rounded ${
                                item.payMethod === '储值'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.payMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                            {item.consumeTime}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                            {item.operator}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 退款申请列表 */}
              {activeTab === 'refund' && (
                <div className="overflow-auto" style={{ maxHeight: '480px' }}>
                  <table className="w-full">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          申请编号
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          关联消费项目
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                          申请金额
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          申请时间
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          申请人
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {memberRefunds.map((refund) => (
                        <tr
                          key={refund.id}
                          onClick={() => setSelectedRefundId(refund.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedRefundId === refund.id
                              ? 'bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-blue-600">
                              {refund.id}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-800">
                              {refund.itemName}
                            </div>
                            <div className="text-xs text-slate-500">
                              手牌：{refund.wristbandNo}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-red-600">
                              ¥{refund.applyAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[refund.status]}`}
                            >
                              {refund.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                            {refund.applyTime}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                            {refund.applicant}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：退款详情 + 复查备注 + 处理历史 */}
          <div className="col-span-5 space-y-5">
            {/* 退款申请详情 */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">退款详情</h3>
              </div>
              {selectedRefund ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">申请编号</span>
                    <span className="text-sm font-medium text-slate-800">
                      {selectedRefund.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">状态</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[selectedRefund.status]}`}
                    >
                      {selectedRefund.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">消费项目</span>
                    <span className="text-sm font-medium text-slate-800">
                      {selectedRefund.itemName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">手牌号码</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {selectedRefund.wristbandNo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">申请金额</span>
                    <span className="text-lg font-bold text-red-600">
                      ¥{selectedRefund.applyAmount.toFixed(2)}
                    </span>
                  </div>
                  {selectedRefund.finalRefundAmount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">实际退款</span>
                      <span className="text-lg font-bold text-emerald-600">
                        ¥{selectedRefund.finalRefundAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedRefund.couponAmount !== undefined &&
                    selectedRefund.couponAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">补偿券金额</span>
                        <span className="text-lg font-bold text-pink-600">
                          ¥{selectedRefund.couponAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">申请原因</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                      {selectedRefund.applyReason}
                    </p>
                  </div>

                  {/* 楼层主管补充 */}
                  {selectedRefund.disputeSupplement && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-slate-500">
                          楼层主管补充说明
                        </p>
                        <span className="text-xs text-slate-400">
                          {selectedRefund.disputeOperator} ·{' '}
                          {selectedRefund.disputeTime}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded border border-amber-100">
                        {selectedRefund.disputeSupplement}
                      </p>
                    </div>
                  )}

                  {/* 财务复查备注 */}
                  {selectedRefund.reviewComment && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-slate-500">财务复查备注</p>
                        <span className="text-xs text-slate-400">
                          {selectedRefund.reviewOperator} ·{' '}
                          {selectedRefund.reviewTime}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 bg-emerald-50 p-3 rounded border border-emerald-100">
                        {selectedRefund.reviewComment}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-400">
                  <p>请从左侧列表选择退款申请</p>
                  <p className="text-xs mt-1">查看详情、复查备注和处理历史</p>
                </div>
              )}
            </div>

            {/* 处理历史 */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">处理历史</h3>
              </div>
              {refundHistory.length > 0 ? (
                <div className="p-5">
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                    <div className="space-y-4">
                      {refundHistory.map((history, index) => (
                        <div key={history.id} className="relative pl-8">
                          <div
                            className={`absolute left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                              index === 0
                                ? 'bg-blue-500'
                                : 'bg-slate-400'
                            }`}
                          ></div>
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">
                                {history.action}
                              </span>
                              <span className="text-xs text-slate-400">
                                {history.operateTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {history.operator}
                              </span>
                              <span className="text-xs text-slate-400">|</span>
                              <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {history.role}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-2 rounded">
                              {history.comment}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p>暂无处理历史</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mock 数据说明 */}
        <div className="mt-5 bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-slate-800">Mock 数据说明</h4>
              <p className="text-sm text-slate-500 mt-1">
                所有数据均为演示用模拟数据，数据文件位于：
                <code className="mx-1 px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                  src/mock/data.ts
                </code>
                包含会员信息、消费流水、退款申请、处理历史等完整数据结构。
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  会员数据：3 条
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  消费流水：6 条
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  退款申请：4 条（含处理中、部分退款、补偿券替代、已拒绝）
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  处理历史：8 条
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
