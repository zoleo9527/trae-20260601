import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, message, Space, Modal } from 'antd';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import FlowProgress from '../../../components/common/FlowProgress';
import CandidateTable from '../../../components/business/CandidateTable';
import HistoryTimeline from '../../../components/common/HistoryTimeline';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import { formatCurrency, getCurrentTime } from '../../../utils/helpers';
import type { HistoryRecord } from '../../../types';

const HrSettlementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settlements, updateSettlement, addHistoryRecord } = useStore();
  const [remark, setRemark] = useState('');
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');

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
        return 1;
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

  const handleConfirm = () => {
    const record: HistoryRecord = {
      time: getCurrentTime(),
      role: '企业HR',
      operator: settlement.hrName || '王五',
      action: '确认返费金额',
      remark: remark || '确认候选人已入职，返费金额无误',
    };

    addHistoryRecord('settlement', settlement.id, record);
    updateSettlement({
      ...settlement,
      status: 'pending_operator_review',
      updatedAt: record.time,
    });

    message.success('已确认结算金额，等待运营审核');
    navigate('/hr/settlements');
  };

  const handleInitiateAppeal = () => {
    if (!appealReason) {
      message.warning('请填写申诉原因');
      return;
    }

    message.success('申诉已发起，等待招聘顾问补充说明');
    setShowAppealModal(false);
    navigate('/hr/appeals');
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">确认操作</h3>
            {settlement.status === 'pending_hr_confirm' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">备注说明</p>
                  <Input.TextArea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请填写确认备注（可选）"
                    rows={4}
                  />
                </div>
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={handleConfirm}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    确认结算金额
                  </Button>
                  <Button
                    size="large"
                    block
                    icon={<AlertTriangle className="w-4 h-4" />}
                    onClick={() => setShowAppealModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    发起异常申诉
                  </Button>
                </Space>
              </div>
            )}
            {settlement.status !== 'pending_hr_confirm' && (
              <div className="text-center py-8 text-gray-500">
                该结算单已处理完成
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        title="发起异常申诉"
        open={showAppealModal}
        onOk={handleInitiateAppeal}
        onCancel={() => setShowAppealModal(false)}
        okText="确认发起"
        cancelText="取消"
      >
        <div className="space-y-4">
          <p className="text-gray-600">请填写申诉原因：</p>
          <Input.TextArea
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="请详细描述申诉原因"
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
};

export default HrSettlementDetail;