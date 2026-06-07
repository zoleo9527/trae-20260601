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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'memberId' | 'phone' | 'wristband'>('memberId');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(mockCurrentMemberId);
  const [selectedConsumeId, setSelectedConsumeId] = useState<string | null>(null);
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null);

  const [refunds, setRefunds] = useState<RefundApplication[]>([...mockRefunds]);
  const [histories, setHistories] = useState<ProcessingHistory[]>([...mockProcessingHistory]);
  const [members, setMembers] = useState<Member[]>([...mockMembers]);

  const [disputeText, setDisputeText] = useState('');
  const [reviewResult, setReviewResult] = useState<'approve' | 'partial' | 'coupon' | 'reject' | 'return'>('approve');
  const [reviewAmount, setReviewAmount] = useState('');
  const [couponAmount, setCouponAmount] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const handleSelectConsume = (consumeId: string) => {
    setSelectedConsumeId(consumeId);
    if (selectedRefundId) {
      const refund = refunds.find((r) => r.id === selectedRefundId);
      if (refund && refund.consumeId !== consumeId) {
        setSelectedRefundId(null);
        setDisputeText('');
        setReviewResult('approve');
        setReviewComment('');
        setReviewAmount('');
        setCouponAmount('');
      }
    }
  };

  const handleSwitchMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setSelectedConsumeId(null);
    setSelectedRefundId(null);
    setDisputeText('');
    setReviewResult('approve');
    setReviewComment('');
    setReviewAmount('');
    setCouponAmount('');
  };

  const handleSelectRefund = (refundId: string) => {
    const refund = refunds.find((r) => r.id === refundId);
    if (refund) {
      setSelectedRefundId(refundId);
      setSelectedConsumeId(refund.consumeId);
      setDisputeText('');
      setReviewResult('approve');
      setReviewComment('');
      setReviewAmount('');
      setCouponAmount('');
    }
  };

  const getRefundDestination = (refund: RefundApplication): string => {
    if (refund.status === '已拒绝') return '无';
    if (refund.status === '已退回') return '退回申请';
    if (refund.status === '补偿券替代') return '补偿券发放';
    if (refund.status === '部分退款') return '部分退回储值账户';
    if (refund.status === '已批准') return '全额退回储值账户';
    if (refund.couponAmount && refund.couponAmount > 0) return '补偿券发放';
    if (refund.finalRefundAmount && refund.finalRefundAmount > 0) return '退回储值账户';
    return '待处理';
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    let foundMember: Member | undefined;

    if (searchType === 'memberId') {
      foundMember = members.find((m) =>
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (searchType === 'phone') {
      foundMember = members.find((m) => m.phone.includes(searchQuery));
    } else if (searchType === 'wristband') {
      const consume = mockConsumptions.find((c) =>
        c.wristbandNo.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (consume) {
        foundMember = members.find((m) => m.id === consume.memberId);
      }
    }

    if (foundMember) {
      handleSwitchMember(foundMember.id);
    }
  };

  const currentMember: Member | undefined = members.find(
    (m) => m.id === selectedMemberId
  );

  const memberConsumptions: ConsumptionItem[] = mockConsumptions.filter(
    (c) => c.memberId === selectedMemberId
  );

  const memberRefunds: RefundApplication[] = refunds.filter(
    (r) => r.memberId === selectedMemberId
  );

  const selectedConsume: ConsumptionItem | undefined = mockConsumptions.find(
    (c) => c.id === selectedConsumeId
  );

  const relatedRefunds: RefundApplication[] = selectedConsumeId
    ? refunds.filter((r) => r.consumeId === selectedConsumeId)
    : [];

  const selectedRefund: RefundApplication | undefined = refunds.find(
    (r) => r.id === selectedRefundId
  );

  const refundRelatedConsume: ConsumptionItem | undefined = selectedRefund
    ? mockConsumptions.find((c) => c.id === selectedRefund.consumeId)
    : undefined;

  const refundHistory: ProcessingHistory[] = selectedRefundId
    ? histories.filter((h) => h.refundId === selectedRefundId)
    : [];

  const nowTime = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  };

  const addHistory = (refundId: string, action: string, comment: string, role: string, operator: string) => {
    const newHistory: ProcessingHistory = {
      id: `H${Date.now()}`,
      refundId,
      operator,
      role,
      action,
      comment,
      operateTime: nowTime(),
    };
    setHistories((prev) => [newHistory, ...prev]);
  };

  const handleSaveDispute = () => {
    if (!selectedRefundId || !disputeText.trim()) return;

    setRefunds((prev) =>
      prev.map((r) =>
        r.id === selectedRefundId
          ? {
              ...r,
              disputeSupplement: disputeText,
              disputeOperator: '楼层主管陈经理',
              disputeTime: nowTime(),
            }
          : r
      )
    );

    addHistory(
      selectedRefundId,
      '补充服务争议说明',
      disputeText,
      '楼层主管',
      '楼层主管陈经理'
    );

    setDisputeText('');
  };

  const handleSubmitReview = () => {
    if (!selectedRefundId) return;

    let status: RefundApplication['status'] = '已批准';
    let finalRefundAmount: number | undefined;
    let finalCouponAmount: number | undefined;
    let action = '复查并批准全额退款';

    switch (reviewResult) {
      case 'approve':
        status = '已批准';
        finalRefundAmount = selectedRefund?.applyAmount;
        action = '复查并批准全额退款';
        break;
      case 'partial':
        status = '部分退款';
        finalRefundAmount = parseFloat(reviewAmount) || 0;
        action = '复查并批准部分退款';
        break;
      case 'coupon':
        status = '补偿券替代';
        finalRefundAmount = 0;
        finalCouponAmount = parseFloat(couponAmount) || 0;
        action = '复查并决定补偿券替代';
        break;
      case 'reject':
        status = '已拒绝';
        finalRefundAmount = 0;
        action = '复查并拒绝退款申请';
        break;
      case 'return':
        status = '已退回';
        finalRefundAmount = 0;
        action = '退回申请，要求补充资料';
        break;
    }

    setRefunds((prev) =>
      prev.map((r) =>
        r.id === selectedRefundId
          ? {
              ...r,
              status,
              reviewComment: reviewComment || undefined,
              reviewOperator: '财务李会计',
              reviewTime: nowTime(),
              finalRefundAmount,
              couponAmount: finalCouponAmount,
            }
          : r
      )
    );

    if (finalRefundAmount && finalRefundAmount > 0) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMemberId
            ? {
                ...m,
                balance: m.balance + finalRefundAmount,
                totalConsume: m.totalConsume - finalRefundAmount,
              }
            : m
        )
      );
    }

    addHistory(
      selectedRefundId,
      action,
      reviewComment || (finalRefundAmount ? `退款金额：¥${finalRefundAmount}` : '') +
        (finalCouponAmount ? ` 补偿券：¥${finalCouponAmount}` : ''),
      '财务',
      '财务李会计'
    );

    setReviewComment('');
    setReviewAmount('');
    setCouponAmount('');
  };

  return (
    <div className="min-h-screen bg-slate-100">
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 mb-5">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
              查询会员：
            </span>
            <div className="flex items-center gap-2">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="memberId">会员编号</option>
                <option value="phone">手机号</option>
                <option value="wristband">手牌号</option>
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={
                  searchType === 'memberId'
                    ? '请输入会员编号，如 M001'
                    : searchType === 'phone'
                    ? '请输入手机号，如 138****1234'
                    : '请输入手牌号，如 A001'
                }
                className="w-72 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                查询
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-1 bg-slate-100 rounded">快速切换：</span>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSwitchMember(m.id)}
                  className={`px-2 py-1 rounded transition-colors ${
                    selectedMemberId === m.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {m.name}({m.id})
                </button>
              ))}
            </div>
          </div>
        </div>

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
                    <span>最近消费：{currentMember.lastConsumeDate}</span>
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
          <div className="col-span-5">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">消费流水</h3>
                  <span className="text-xs text-slate-500">
                    共 {memberConsumptions.length} 条记录
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  点击选中后右侧自动联动显示关联退款申请
                </p>
              </div>
              <div className="overflow-auto" style={{ maxHeight: '520px' }}>
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        手牌
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        消费项目
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                        原扣金额
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        扣费方式
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                        退款去向
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberConsumptions.map((item) => {
                      const consumeRefunds = refunds.filter(
                        (r) => r.consumeId === item.id
                      );
                      const hasRefund = consumeRefunds.length > 0;
                      const latestRefund = consumeRefunds.length > 0 ? consumeRefunds[0] : null;
                      return (
                        <tr
                          key={item.id}
                          onClick={() => handleSelectConsume(item.id)}
                          className={`cursor-pointer transition-colors ${
                            selectedConsumeId === item.id
                              ? 'bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
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
                              {item.consumeTime}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="text-sm font-semibold text-slate-800">
                              ¥{item.amount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                              {item.payMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {hasRefund && latestRefund ? (
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                ['退回储值账户', '部分退回储值账户', '全额退回储值账户'].includes(getRefundDestination(latestRefund))
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : getRefundDestination(latestRefund) === '补偿券发放'
                                  ? 'bg-pink-50 text-pink-700'
                                  : getRefundDestination(latestRefund) === '待处理'
                                  ? 'bg-amber-50 text-amber-700'
                                  : getRefundDestination(latestRefund) === '退回申请'
                                  ? 'bg-orange-50 text-orange-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>
                                {getRefundDestination(latestRefund)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 h-full">
              <div className="px-5 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">退款申请</h3>
                  <span className="text-xs text-slate-500">
                    {selectedConsumeId
                      ? `关联 ${relatedRefunds.length} 条`
                      : `全部 ${memberRefunds.length} 条`}
                  </span>
                </div>
                {selectedConsume && (
                  <p className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded">
                    已筛选：{selectedConsume.itemName}
                  </p>
                )}
              </div>
              <div className="overflow-auto" style={{ maxHeight: '520px' }}>
                {(selectedConsumeId ? relatedRefunds : memberRefunds).length >
                0 ? (
                  <div className="divide-y divide-slate-100">
                    {(selectedConsumeId ? relatedRefunds : memberRefunds).map(
                      (refund) => (
                        <div
                          key={refund.id}
                          onClick={() => handleSelectRefund(refund.id)}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedRefundId === refund.id
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'hover:bg-slate-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-600">
                              {refund.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[refund.status]}`}
                            >
                              {refund.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 mb-1">
                            {refund.itemName}
                          </p>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-red-600">
                              ¥{refund.applyAmount.toFixed(2)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {refund.applyTime.slice(5, 16)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              ['退回储值账户', '部分退回储值账户', '全额退回储值账户'].includes(getRefundDestination(refund))
                                ? 'text-emerald-600'
                                : getRefundDestination(refund) === '补偿券发放'
                                ? 'text-pink-600'
                                : getRefundDestination(refund) === '待处理'
                                ? 'text-amber-600'
                                : getRefundDestination(refund) === '退回申请'
                                ? 'text-orange-600'
                                : 'text-slate-400'
                            }`}>
                              去向：{getRefundDestination(refund)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    {selectedConsumeId
                      ? '该消费暂无退款申请'
                      : '暂无退款申请'}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-5">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">退款详情与处理</h3>
              </div>
              {selectedRefund ? (
                <div className="p-5 space-y-3 max-h-96 overflow-auto">
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
                  {refundRelatedConsume && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">原扣金额</span>
                        <span className="text-sm font-semibold text-slate-800">
                          ¥{refundRelatedConsume.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">扣费方式</span>
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          {refundRelatedConsume.payMethod}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">申请金额</span>
                    <span className="text-lg font-bold text-red-600">
                      ¥{selectedRefund.applyAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">退款去向</span>
                    <span className={`text-sm font-medium ${
                      ['退回储值账户', '部分退回储值账户', '全额退回储值账户'].includes(getRefundDestination(selectedRefund))
                        ? 'text-emerald-600'
                        : getRefundDestination(selectedRefund) === '补偿券发放'
                        ? 'text-pink-600'
                        : getRefundDestination(selectedRefund) === '无'
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}>
                      {getRefundDestination(selectedRefund)}
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
                        <span className="text-sm text-slate-500">
                          补偿券金额
                        </span>
                        <span className="text-lg font-bold text-pink-600">
                          ¥{selectedRefund.couponAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">申请原因</p>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                      {selectedRefund.applyReason}
                    </p>
                  </div>

                  {selectedRefund.disputeSupplement && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-slate-500">
                          楼层主管补充说明
                        </p>
                        <span className="text-xs text-slate-400">
                          {selectedRefund.disputeOperator}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded border border-amber-100">
                        {selectedRefund.disputeSupplement}
                      </p>
                    </div>
                  )}

                  {selectedRefund.reviewComment && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-slate-500">财务复查备注</p>
                        <span className="text-xs text-slate-400">
                          {selectedRefund.reviewOperator}
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
                  <p>请从左侧选择退款申请</p>
                  <p className="text-xs mt-1">查看详情并进行处理操作</p>
                </div>
              )}
            </div>

            {selectedRefund &&
              !['已批准', '已拒绝', '部分退款', '补偿券替代'].includes(
                selectedRefund.status
              ) &&
              !selectedRefund.disputeSupplement && (
                <div className="bg-white rounded-lg shadow-sm border border-amber-200">
                  <div className="px-5 py-3 border-b border-amber-100 bg-amber-50">
                    <h3 className="font-semibold text-amber-800 text-sm">
                      楼层主管 - 服务争议补充
                    </h3>
                  </div>
                  <div className="p-4">
                    <textarea
                      value={disputeText}
                      onChange={(e) => setDisputeText(e.target.value)}
                      placeholder="请输入争议核实情况和补充说明..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <button
                      onClick={handleSaveDispute}
                      disabled={!disputeText.trim()}
                      className="mt-3 w-full px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      保存补充说明
                    </button>
                  </div>
                </div>
              )}

            {selectedRefund &&
              !['已批准', '已拒绝', '部分退款', '补偿券替代'].includes(
                selectedRefund.status
              ) &&
              !selectedRefund.disputeSupplement && (
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 text-center">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    待补资料
                  </p>
                  <p className="text-xs text-slate-500">
                    请先由楼层主管补充服务争议说明后，再进行财务复查处理
                  </p>
                </div>
              )}

            {selectedRefund &&
              !['已批准', '已拒绝', '部分退款', '补偿券替代'].includes(
                selectedRefund.status
              ) &&
              selectedRefund.disputeSupplement && (
                <div className="bg-white rounded-lg shadow-sm border border-emerald-200">
                  <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50">
                    <h3 className="font-semibold text-emerald-800 text-sm">
                      财务 - 复查处理
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <label className="text-sm text-slate-600 mb-1.5 block">
                        处理结果
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { value: 'approve', label: '全额批准' },
                          { value: 'partial', label: '部分退款' },
                          { value: 'coupon', label: '补偿券' },
                          { value: 'reject', label: '拒绝' },
                          { value: 'return', label: '退回' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setReviewResult(opt.value as any)}
                            className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                              reviewResult === opt.value
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {reviewResult === 'partial' && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1.5 block">
                          部分退款金额 (元)
                        </label>
                        <input
                          type="number"
                          value={reviewAmount}
                          onChange={(e) => setReviewAmount(e.target.value)}
                          placeholder={`最多 ${selectedRefund.applyAmount} 元`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {reviewResult === 'coupon' && (
                      <div>
                        <label className="text-sm text-slate-600 mb-1.5 block">
                          补偿券金额 (元)
                        </label>
                        <input
                          type="number"
                          value={couponAmount}
                          onChange={(e) => setCouponAmount(e.target.value)}
                          placeholder={`建议 ${selectedRefund.applyAmount} 元`}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm text-slate-600 mb-1.5 block">
                        复查备注
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="请输入复查意见..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      提交复查结果
                    </button>
                  </div>
                </div>
              )}

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">处理历史</h3>
              </div>
              {refundHistory.length > 0 ? (
                <div className="p-5 max-h-64 overflow-auto">
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
                <div className="p-8 text-center text-slate-400 text-sm">
                  {selectedRefundId ? '暂无处理历史' : '请选择退款申请'}
                </div>
              )}
            </div>
          </div>
        </div>

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
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  可操作：按会员编号/手机号/手牌号查询
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  可联动：选中消费显示关联退款
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  可录入：楼层主管争议补充
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  可处理：批准/部分退款/补偿券/拒绝/退回
                </span>
                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded">
                  自动同步：余额、累计消费、处理历史
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
