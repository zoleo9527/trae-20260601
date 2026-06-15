import React, { useState, useEffect } from 'react';
import { Appeal, Evidence, AuditLog } from '../types';
import { APPEAL_TYPE_MAP, APPEAL_STATUS_MAP, USER_ROLE_MAP, ROLE_ALLOWED_STATUS } from '../types';
import { formatDeadline } from '../utils/appealLogic';
import { EvidenceList } from './EvidenceList';
import { AuditLogList } from './AuditLogList';
import { useAppealDetail } from '../contexts/AppealContext';

interface AppealDetailProps {
  appeal: Appeal;
  onClose: () => void;
}

export const AppealDetail: React.FC<AppealDetailProps> = ({ appeal, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'evidence' | 'audit'>('info');
  const [comment, setComment] = useState('');
  const [resolutionAmount, setResolutionAmount] = useState('');
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const { 
    handleAppeal, 
    currentUserId, 
    currentUserRole, 
    getEvidences, 
    getAuditLogs,
    setSelectedAppeal,
  } = useAppealDetail();

  useEffect(() => {
    loadEvidencesAndLogs();
  }, [appeal.id]);

  const loadEvidencesAndLogs = async () => {
    const evidencesRes = await getEvidences(appeal.id);
    setEvidences(evidencesRes);
    
    const logsRes = await getAuditLogs(appeal.id);
    setAuditLogs(logsRes);
  };

  const canHandle = ROLE_ALLOWED_STATUS[currentUserRole].includes(appeal.status) && 
    (!appeal.assignedTo || appeal.assignedTo === currentUserId);

  const handleAction = async (action: 'forward' | 'reject' | 'return' | 'resolve') => {
    setIsProcessing(true);
    setError(null);

    let resolutionAmt: number | undefined;
    if (action === 'resolve' && resolutionAmount) {
      resolutionAmt = parseFloat(resolutionAmount);
    }

    const currentUserName = {
      'u1': '王收货',
      'u2': '李检测', 
      'u3': '张财务',
      'u4': '赵管理员',
    }[currentUserId] || '未知用户';

    const response = await handleAppeal({
      appealId: appeal.id,
      action,
      comment,
      resolutionAmount: resolutionAmt,
      actorId: currentUserId,
      actorName: currentUserName,
      actorRole: currentUserRole,
    });

    if (response.success && response.data) {
      setSelectedAppeal(response.data.appeal);
      await loadEvidencesAndLogs();
      onClose();
    } else if (response.error) {
      setError(response.error);
    }

    setIsProcessing(false);
  };

  const getAvailableActions = () => {
    const actions: { key: string; label: string; visible: boolean }[] = [
      { 
        key: 'forward', 
        label: '转交下一环节', 
        visible: ['pending_receipt', 'pending_inspection', 'pending_finance', 'pending_confirmation'].includes(appeal.status)
      },
      { 
        key: 'reject', 
        label: '驳回申诉', 
        visible: ['pending_inspection', 'pending_finance'].includes(appeal.status)
      },
      { 
        key: 'return', 
        label: '退回补充', 
        visible: ['pending_receipt', 'pending_confirmation'].includes(appeal.status)
      },
      { 
        key: 'resolve', 
        label: '确认解决', 
        visible: ['pending_confirmation'].includes(appeal.status)
      },
    ];
    return actions.filter(a => a.visible);
  };

  const renderActionButtons = () => {
    if (!canHandle) {
      return (
        <div className="bg-gray-100 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-500">
            {appeal.assignedTo && appeal.assignedTo !== currentUserId 
              ? '当前由其他人员处理中' 
              : '当前角色无权处理此申诉'}
          </p>
        </div>
      );
    }

    const actions = getAvailableActions();

    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">处理操作</h4>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                {error.code}
              </span>
              <span className="text-sm text-red-700">{error.message}</span>
            </div>
          </div>
        )}

        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="请输入处理备注..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isProcessing}
        />
        
        {appeal.status === 'pending_confirmation' && (
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">处理金额</label>
            <input
              type="number"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入处理金额"
              value={resolutionAmount}
              onChange={(e) => setResolutionAmount(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        )}
        
        <div className="flex gap-2">
          {actions.map(action => (
            <button
              key={action.key}
              onClick={() => handleAction(action.key as any)}
              disabled={isProcessing}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                action.key === 'resolve' ? 'bg-green-600 text-white hover:bg-green-700' :
                action.key === 'reject' ? 'bg-red-600 text-white hover:bg-red-700' :
                action.key === 'return' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isProcessing ? '处理中...' : action.label}
            </button>
          ))}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            关闭
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">申诉详情</h2>
            <p className="text-sm text-gray-500">{appeal.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">申诉类型</p>
              <p className="font-medium text-gray-800">{APPEAL_TYPE_MAP[appeal.appealType]}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">当前状态</p>
              <p className={`font-medium ${
                appeal.status === 'resolved' ? 'text-green-600' :
                appeal.status === 'rejected' ? 'text-red-600' :
                appeal.status === 'returned' ? 'text-gray-600' : 'text-blue-600'
              }`}>
                {APPEAL_STATUS_MAP[appeal.status]}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">截止日期</p>
              <p className="font-medium text-gray-800">{formatDeadline(appeal.deadline)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">处理人</p>
              <p className="font-medium text-gray-800">{appeal.assignedTo ? {
                'u1': '王收货',
                'u2': '李检测', 
                'u3': '张财务',
                'u4': '赵管理员',
              }[appeal.assignedTo] : '-'}</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">商品信息</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-800">{appeal.productName} {appeal.productModel}</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">用户信息</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-800">{appeal.customerName} {appeal.customerPhone}</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">申诉描述</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-800">{appeal.description}</p>
            </div>
          </div>

          {appeal.estimatedAmount !== undefined && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">金额信息</h3>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">原估价</p>
                  <p className="font-medium text-gray-800">{appeal.estimatedAmount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">实付金额</p>
                  <p className="font-medium text-gray-800">{appeal.actualAmount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">用户诉求</p>
                  <p className="font-medium text-orange-600">{appeal.claimedAmount}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">处理金额</p>
                  <p className="font-medium text-green-600">{appeal.resolutionAmount || '-'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'info' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                处理流程
              </button>
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'evidence' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                证据归档 ({evidences.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'audit' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                审计日志 ({auditLogs.length})
              </button>
            </div>
          </div>

          {activeTab === 'info' && (
            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">处理流程</h4>
                <div className="relative">
                  <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-blue-200"></div>
                  <div className="space-y-4">
                    {[
                      { status: 'pending_receipt', label: '收货确认', role: '收货员', done: appeal.status !== 'pending_receipt' },
                      { status: 'pending_inspection', label: '检测复核', role: '检测师', done: ['pending_finance', 'pending_confirmation', 'resolved', 'rejected'].includes(appeal.status) },
                      { status: 'pending_finance', label: '财务处理', role: '财务', done: ['pending_confirmation', 'resolved'].includes(appeal.status) },
                      { status: 'pending_confirmation', label: '用户确认', role: '财务', done: appeal.status === 'resolved' },
                      { status: 'resolved', label: '已解决', role: '-', done: appeal.status === 'resolved' },
                    ].map((step, index) => (
                      <div key={step.status} className="flex gap-3 relative">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-300'
                        }`}>
                          {step.done ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${step.done ? 'text-gray-800' : 'text-gray-500'}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500">{step.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evidence' && <EvidenceList evidences={evidences} />}
          {activeTab === 'audit' && <AuditLogList logs={auditLogs} />}

          {renderActionButtons()}
        </div>
      </div>
    </div>
  );
};