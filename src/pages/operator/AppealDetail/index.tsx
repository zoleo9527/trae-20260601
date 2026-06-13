import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, message, Modal, Space, Radio } from 'antd';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import FlowProgress from '../../../components/common/FlowProgress';
import EvidenceViewer from '../../../components/business/EvidenceViewer';
import HistoryTimeline from '../../../components/common/HistoryTimeline';
import ContinuousHandler from '../../../components/common/ContinuousHandler';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import { getCurrentTime } from '../../../utils/helpers';
import type { HistoryRecord } from '../../../types';

const OperatorAppealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appeals, updateAppeal, addHistoryRecord, settlements, updateSettlement } = useStore();
  const [remark, setRemark] = useState('');
  const [decision, setDecision] = useState<'support' | 'reject'>('support');
  const [showModal, setShowModal] = useState(false);

  const appeal = appeals.find((a) => a.id === id);
  const pendingAppeals = appeals.filter(
    (a) => a.status === 'pending_operator_arbitration'
  );
  const currentIndex = pendingAppeals.findIndex((a) => a.id === id);

  if (!appeal) {
    return <div>申诉不存在</div>;
  }

  const getFlowSteps = () => {
    return ['企业HR发起申诉', '招聘顾问补充', '运营仲裁', '申诉完成'];
  };

  const getCurrentStep = () => {
    switch (appeal.status) {
      case 'pending_recruiter_response':
        return 1;
      case 'pending_operator_arbitration':
        return 2;
      case 'resolved':
        return 3;
      case 'rejected':
        return 3;
      default:
        return 0;
    }
  };

  const handleArbitrate = () => {
    if (!remark) {
      message.warning('请填写仲裁说明');
      return;
    }

    const action = decision === 'support' ? '支持申诉' : '驳回申诉';
    const newStatus = decision === 'support' ? 'resolved' : 'rejected';

    const record: HistoryRecord = {
      time: getCurrentTime(),
      role: '运营',
      operator: '吴九',
      action: '仲裁结果',
      remark: `${action}：${remark}`,
    };

    addHistoryRecord('appeal', appeal.id, record);
    updateAppeal({
      ...appeal,
      status: newStatus,
      updatedAt: record.time,
    });

    if (decision === 'support') {
      const settlement = settlements.find((s) => s.id === appeal.settlementId);
      if (settlement) {
        updateSettlement({
          ...settlement,
          status: 'rejected',
          updatedAt: record.time,
        });
      }
    }

    setShowModal(false);
    message.success(`仲裁完成：${action}`);
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    if (currentIndex < pendingAppeals.length - 1) {
      const nextAppeal = pendingAppeals[currentIndex + 1];
      navigate(`/operator/appeals/${nextAppeal.id}`);
    } else {
      message.info('所有申诉已处理完成！');
      navigate('/operator/appeals');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">异常申诉详情</h2>
        <p className="text-gray-600 mt-1">申诉ID: {appeal.id}</p>
      </div>

      <FlowProgress currentStep={getCurrentStep()} steps={getFlowSteps()} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {appeal.position}
                </h3>
                <p className="text-gray-600">{appeal.company}</p>
              </div>
              <StatusBadge status={appeal.status} type="appeal" />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-600 mb-1">申诉原因</p>
              <p className="text-gray-800 font-medium">{appeal.appealReason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">招聘顾问</p>
                <p className="text-sm font-medium">{appeal.recruiterName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">企业HR</p>
                <p className="text-sm font-medium">{appeal.hrName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">关联结算单</p>
                <p className="text-sm font-medium text-blue-600">
                  {appeal.settlementId}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">创建时间</p>
                <p className="text-sm font-medium">{appeal.createdAt}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">证据材料</h3>
            <EvidenceViewer evidence={appeal.evidence} />
          </Card>

          <HistoryTimeline history={appeal.history} />
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">仲裁操作</h3>
            {appeal.status === 'pending_operator_arbitration' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">仲裁决定</p>
                  <Radio.Group
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    className="w-full"
                  >
                    <Space direction="vertical" className="w-full">
                      <Radio value="support" className="w-full p-2 border rounded hover:bg-orange-50">
                        支持申诉（调整结算）
                      </Radio>
                      <Radio value="reject" className="w-full p-2 border rounded hover:bg-green-50">
                        驳回申诉（维持原结算）
                      </Radio>
                    </Space>
                  </Radio.Group>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">仲裁说明</p>
                  <Input.TextArea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请填写仲裁说明"
                    rows={4}
                  />
                </div>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => setShowModal(true)}
                >
                  提交仲裁结果
                </Button>
              </div>
            )}
            {appeal.status !== 'pending_operator_arbitration' && (
              <div className="text-center py-8 text-gray-500">
                该申诉已处理完成
              </div>
            )}
          </Card>
        </div>
      </div>

      {appeal.status === 'pending_operator_arbitration' && (
        <ContinuousHandler
          onHandleNext={handleNext}
          hasNext={currentIndex < pendingAppeals.length - 1}
          currentTaskId={appeal.id}
          taskListLength={pendingAppeals.length - currentIndex - 1}
        />
      )}

      <Modal
        title="确认仲裁结果"
        open={showModal}
        onOk={handleArbitrate}
        onCancel={() => setShowModal(false)}
        okText="确认提交"
        cancelText="取消"
      >
        <div className="space-y-4">
          <p className="text-gray-600">仲裁决定：</p>
          <p className="text-gray-800 font-medium">
            {decision === 'support' ? '支持申诉（调整结算）' : '驳回申诉（维持原结算）'}
          </p>
          <p className="text-gray-600">仲裁说明：</p>
          <p className="text-gray-800">{remark}</p>
        </div>
      </Modal>
    </div>
  );
};

export default OperatorAppealDetail;