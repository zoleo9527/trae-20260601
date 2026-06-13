import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, message, Upload } from 'antd';
import { CheckCircle, Upload as UploadIcon } from 'lucide-react';
import FlowProgress from '../../../components/common/FlowProgress';
import EvidenceViewer from '../../../components/business/EvidenceViewer';
import HistoryTimeline from '../../../components/common/HistoryTimeline';
import StatusBadge from '../../../components/common/StatusBadge';
import { useStore } from '../../../contexts/AppContext';
import { getCurrentTime } from '../../../utils/helpers';
import type { HistoryRecord, Evidence } from '../../../types';

const RecruiterAppealDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appeals, updateAppeal, addHistoryRecord, settlements } = useStore();
  const [remark, setRemark] = useState('');
  const [files, setFiles] = useState<string[]>([]);

  const appeal = appeals.find((a) => a.id === id);
  const settlement = settlements.find((s) => s.id === appeal?.settlementId);

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

  const handleAddEvidence = () => {
    if (!remark) {
      message.warning('请填写说明内容');
      return;
    }

    const currentTime = getCurrentTime();
    const newEvidence: Evidence = {
      role: '招聘顾问',
      files: files.length > 0 ? files : ['补充说明材料.pdf'],
      description: remark,
    };

    const appealRecord: HistoryRecord = {
      time: currentTime,
      role: '招聘顾问',
      operator: appeal.recruiterName,
      action: '补充说明',
      remark: remark,
    };

    addHistoryRecord('appeal', appeal.id, appealRecord);
    updateAppeal({
      ...appeal,
      evidence: [...appeal.evidence, newEvidence],
      status: 'pending_operator_arbitration',
      updatedAt: currentTime,
    });

    if (settlement) {
      const settlementRecord: HistoryRecord = {
        time: currentTime,
        role: '招聘顾问',
        operator: appeal.recruiterName,
        action: '申诉补充说明',
        remark: `针对申诉补充说明：${remark}`,
      };
      addHistoryRecord('settlement', settlement.id, settlementRecord);
    }

    setRemark('');
    setFiles([]);
    message.success('补充说明已提交，等待运营仲裁');
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
            <h3 className="text-lg font-semibold text-gray-800 mb-4">补充说明</h3>
            {appeal.status === 'pending_recruiter_response' && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">说明内容</p>
                  <Input.TextArea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="请填写补充说明内容"
                    rows={4}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">上传材料</p>
                  <Upload
                    multiple
                    showUploadList={true}
                    beforeUpload={(file) => {
                      setFiles([...files, file.name]);
                      return false;
                    }}
                  >
                    <Button icon={<UploadIcon className="w-4 h-4" />}>
                      选择文件
                    </Button>
                  </Upload>
                </div>
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleAddEvidence}
                  className="bg-green-500 hover:bg-green-600"
                >
                  提交补充说明
                </Button>
              </div>
            )}
            {appeal.status === 'pending_operator_arbitration' && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-blue-500 mb-2">等待运营仲裁</p>
                <p className="text-xs">补充说明已提交，等待运营仲裁</p>
              </div>
            )}
            {appeal.status === 'resolved' && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-orange-500 mb-2">申诉已支持</p>
                <p className="text-xs">结算已撤销，返费不予发放</p>
              </div>
            )}
            {appeal.status === 'rejected' && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-green-500 mb-2">申诉已驳回</p>
                <p className="text-xs">结算已恢复，返费正常发放</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecruiterAppealDetail;