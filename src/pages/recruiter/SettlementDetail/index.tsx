import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, message, Space, Tag } from 'antd';
import { ArrowRight, FileText, MessageCircle } from 'lucide-react';
import FlowProgress from '../../../components/common/FlowProgress';
import CandidateTable from '../../../components/business/CandidateTable';
import HistoryTimeline from '../../../components/common/HistoryTimeline';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import { formatCurrency, getCurrentTime } from '../../../utils/helpers';
import type { HistoryRecord } from '../../../types';

const RecruiterSettlementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settlements, appeals, updateSettlement, addHistoryRecord } = useStore();
  const [remark, setRemark] = useState('');

  const settlement = settlements.find((s) => s.id === id);

  if (!settlement) {
    return <div>结算单不存在</div>;
  }

  const getFlowSteps = () => {
    switch (settlement.status) {
      case 'pending_hr_confirm':
        return ['招聘顾问发起', '企业HR确认', '运营审核', '结算完成'];
      case 'pending_operator_review':
        return ['招聘顾问发起', '企业HR确认', '运营审核', '结算完成'];
      case 'completed':
        return ['招聘顾问发起', '企业HR确认', '运营审核', '结算完成'];
      case 'rejected':
        return ['招聘顾问发起', '企业HR确认', '运营审核', '已驳回'];
      case 'appealing':
        return ['招聘顾问发起', '企业HR确认', '运营审核', '异常申诉'];
      default:
        return [];
    }
  };

  const getCurrentStep = () => {
    switch (settlement.status) {
      case 'pending_hr_confirm':
        return 0;
      case 'pending_operator_review':
        return 2;
      case 'completed':
        return 3;
      case 'rejected':
        return 3;
      case 'appealing':
        return 3;
      default:
        return 0;
    }
  };

  const handleAddRemark = () => {
    if (!remark) {
      message.warning('请填写备注内容');
      return;
    }

    const record: HistoryRecord = {
      time: getCurrentTime(),
      role: '招聘顾问',
      operator: settlement.recruiterName,
      action: '补充说明',
      remark: remark,
    };

    addHistoryRecord('settlement', settlement.id, record);
    setRemark('');
    message.success('备注已添加');
  };

  const handleViewAppeal = () => {
    const relatedAppeal = appeals.find(a => a.settlementId === settlement.id);
    if (relatedAppeal) {
      navigate(`/recruiter/appeals/${relatedAppeal.id}`);
    } else {
      message.error('未找到相关申诉记录');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">返费结算详情</h2>
        <p className="text-gray-600 mt-1">结算单ID: {settlement.id}</p>
      </div>

      <FlowProgress currentStep={getCurrentStep()} steps={getFlowSteps()} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {settlement.position}
                </h3>
                <p className="text-gray-600">{settlement.company}</p>
              </div>
              <StatusBadge status={settlement.status} type="settlement" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">招聘顾问</p>
                <p className="text-sm font-medium">{settlement.recruiterName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">企业HR</p>
                <p className="text-sm font-medium">{settlement.hrName || '待确认'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="text-sm font-medium">{settlement.createdAt}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">更新时间</p>
                <p className="text-sm font-medium">{settlement.updatedAt}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-4">
              <div>
                <p className="text-xs text-gray-500">候选人数量</p>
                <p className="text-lg font-bold text-gray-800">
                  {settlement.candidates.length}人
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">结算金额</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(settlement.settlementAmount)}
                </p>
              </div>
            </div>

            <CandidateTable candidates={settlement.candidates} />
          </Card>

          <HistoryTimeline history={settlement.history} />
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">补充说明</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">添加备注</p>
                <Input.TextArea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="请填写补充说明"
                  rows={4}
                />
              </div>
              <Button
                type="primary"
                block
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={handleAddRemark}
              >
                添加备注
              </Button>
            </div>
          </Card>

          {settlement.status === 'appealing' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">异常申诉</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-600">该结算单存在异常申诉</p>
                <p className="text-xs text-gray-500 mt-1">请查看申诉详情并补充说明</p>
              </div>
              <Button
                type="primary"
                block
                icon={<FileText className="w-4 h-4" />}
                onClick={handleViewAppeal}
                className="bg-orange-500 hover:bg-orange-600"
              >
                查看申诉详情
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterSettlementDetail;