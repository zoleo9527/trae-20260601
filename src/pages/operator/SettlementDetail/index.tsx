import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, message, Modal, Space } from 'antd';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import FlowProgress from '../../../components/common/FlowProgress';
import CandidateTable from '../../../components/business/CandidateTable';
import HistoryTimeline from '../../../components/common/HistoryTimeline';
import ContinuousHandler from '../../../components/common/ContinuousHandler';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import { formatCurrency, getCurrentTime } from '../../../utils/helpers';
import type { HistoryRecord } from '../../../types';

const OperatorSettlementDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settlements, updateSettlement, addHistoryRecord } = useStore();
  const [remark, setRemark] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const settlement = settlements.find((s) => s.id === id);
  const pendingSettlements = settlements.filter(
    (s) => s.status === 'pending_operator_review'
  );
  const currentIndex = pendingSettlements.findIndex((s) => s.id === id);

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

  const handleApprove = () => {
    const record: HistoryRecord = {
      time: getCurrentTime(),
      role: '运营',
      operator: '吴九',
      action: '审核通过',
      remark: remark || '审核通过，结算完成',
    };

    addHistoryRecord('settlement', settlement.id, record);
    updateSettlement({
      ...settlement,
      status: 'completed',
      updatedAt: record.time,
    });

    message.success('审核通过，结算完成！');
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleReject = () => {
    if (!remark) {
      message.warning('请填写驳回原因');
      return;
    }

    const record: HistoryRecord = {
      time: getCurrentTime(),
      role: '运营',
      operator: '吴九',
      action: '审核驳回',
      remark: remark,
    };

    addHistoryRecord('settlement', settlement.id, record);
    updateSettlement({
      ...settlement,
      status: 'rejected',
      updatedAt: record.time,
    });

    setShowRejectModal(false);
    message.success('已驳回申请！');
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    if (currentIndex < pendingSettlements.length - 1) {
      const nextSettlement = pendingSettlements[currentIndex + 1];
      navigate(`/operator/settlements/${nextSettlement.id}`);
    } else {
      message.info('所有任务已处理完成！');
      navigate('/operator/settlements');
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">审核操作</h3>
            {settlement.status === 'pending_operator_review' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">备注说明</p>
                  <Input.TextArea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请填写审核备注（可选）"
                    rows={4}
                  />
                </div>
                <Space direction="vertical" className="w-full">
                  <Button
                    type="primary"
                    size="large"
                    block
                    icon={<CheckCircle className="w-4 h-4" />}
                    onClick={handleApprove}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    审核通过
                  </Button>
                  <Button
                    size="large"
                    block
                    danger
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => setShowRejectModal(true)}
                  >
                    审核驳回
                  </Button>
                </Space>
              </div>
            )}
            {settlement.status !== 'pending_operator_review' && (
              <div className="text-center py-8 text-gray-500">
                该结算单已处理完成
              </div>
            )}
          </Card>
        </div>
      </div>

      {settlement.status === 'pending_operator_review' && (
        <ContinuousHandler
          onHandleNext={handleNext}
          hasNext={currentIndex < pendingSettlements.length - 1}
          currentTaskId={settlement.id}
          taskListLength={pendingSettlements.length - currentIndex - 1}
        />
      )}

      <Modal
        title="驳回申请"
        open={showRejectModal}
        onOk={handleReject}
        onCancel={() => setShowRejectModal(false)}
        okText="确认驳回"
        cancelText="取消"
      >
        <div className="space-y-4">
          <p className="text-gray-600">请确认驳回原因：</p>
          <p className="text-gray-800 font-medium">{remark}</p>
        </div>
      </Modal>
    </div>
  );
};

export default OperatorSettlementDetail;