import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save,
  Send,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import { useWorkOrderStore } from '../stores/workOrderStore';
import { useAuthStore } from '../stores/authStore';
import { StatusTag } from '../components/business/StatusTag';
import { HistoryTimeline } from '../components/business/HistoryTimeline';
import { formatDate, getUrgencyColor } from '../lib/utils';
import type { PolicyJudgment, WorkOrder } from '../types';

const PolicyJudgeReadOnly: React.FC<{ workOrder: WorkOrder }> = ({ workOrder }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">政策判断（已提交）</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">判断依据</label>
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
            {workOrder.policyJudgment?.judgmentBasis}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">政策引用</label>
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
            {workOrder.policyJudgment?.policyReference}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            风险提示
          </label>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
            {workOrder.policyJudgment?.riskWarning}
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">处理意见</label>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-green-800">
            {workOrder.policyJudgment?.handlingSuggestion}
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>判断人：{workOrder.policyJudgment?.judgedBy}</span>
          <span>判断时间：{formatDate(workOrder.policyJudgment?.judgedAt || '')}</span>
        </div>
      </div>
    </div>
  );
};

export const PolicyJudge: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { getWorkOrderById, submitPolicyJudgment, saveDraft, getDraft, startPolicyJudge, getNextWorkOrder, getPrevWorkOrder, workOrders, clearDraft } = useWorkOrderStore();
  
  const workOrder = id ? getWorkOrderById(id) : null;
  
  const [formData, setFormData] = useState<PolicyJudgment>({
    judgmentBasis: '',
    policyReference: '',
    riskWarning: '',
    handlingSuggestion: '',
    judgedBy: '',
    judgedAt: ''
  });
  
  useEffect(() => {
    if (!id && user) {
      const pendingWorkOrder = workOrders.find(wo => 
        wo.status === '待判断' || wo.status === '判断中'
      );
      
      if (pendingWorkOrder) {
        navigate(`/policy-judge/${pendingWorkOrder.id}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [id, user, navigate, workOrders]);
  
  useEffect(() => {
    if (workOrder && user) {
      if (workOrder.policyJudgment) {
        setFormData(workOrder.policyJudgment);
      } else {
        const draft = getDraft(workOrder.id);
        if (draft) {
          setFormData({
            judgmentBasis: draft.judgmentBasis || '',
            policyReference: draft.policyReference || '',
            riskWarning: draft.riskWarning || '',
            handlingSuggestion: draft.handlingSuggestion || '',
            judgedBy: user.name,
            judgedAt: ''
          });
        } else {
          setFormData({
            judgmentBasis: '',
            policyReference: '',
            riskWarning: '',
            handlingSuggestion: '',
            judgedBy: user.name,
            judgedAt: ''
          });
        }
      }
    }
  }, [workOrder, user, getDraft]);
  
  useEffect(() => {
    if (workOrder && workOrder.status === '待判断' && user) {
      startPolicyJudge(workOrder.id, user.name);
    }
  }, [workOrder, user, startPolicyJudge]);
  
  if (!workOrder) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">正在跳转到待办工单...</p>
      </div>
    );
  }
  
  const canProcessStatuses = ['待判断', '判断中'];
  const nextWorkOrder = getNextWorkOrder(workOrder.id, canProcessStatuses);
  const prevWorkOrder = getPrevWorkOrder(workOrder.id, canProcessStatuses);
  
  const handleSubmit = (isDraft: boolean = false) => {
    if (!isDraft && (!formData.judgmentBasis || !formData.policyReference || !formData.handlingSuggestion)) {
      alert('请填写完整的政策判断信息');
      return;
    }
    
    if (isDraft) {
      saveDraft(workOrder.id, formData);
      alert('草稿保存成功！');
    } else {
      submitPolicyJudgment(workOrder.id, {
        ...formData,
        judgedBy: user?.name || '',
        judgedAt: new Date().toISOString()
      });
      
      clearDraft(workOrder.id);
      
      alert('政策判断提交成功！');
      if (nextWorkOrder) {
        navigate(`/policy-judge/${nextWorkOrder.id}`);
      } else {
        navigate('/dashboard');
      }
    }
  };
  
  const handleNavigate = (targetId: string) => {
    navigate(`/policy-judge/${targetId}`);
  };
  
  const isReadOnly = workOrder.policyJudgment !== undefined;
  const canEdit = canProcessStatuses.includes(workOrder.status) && !isReadOnly;
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">政策判断处理</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-semibold text-blue-600">{workOrder.orderNo}</span>
                <StatusTag status={workOrder.status} />
                <span className={`text-sm ${getUrgencyColor(workOrder.urgencyLevel)}`}>
                  {workOrder.urgencyLevel}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isReadOnly ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                已完成
              </div>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={!canEdit}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                提交判断
              </button>
            )}
            
            <button
              onClick={() => prevWorkOrder && handleNavigate(prevWorkOrder.id)}
              disabled={!prevWorkOrder}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => nextWorkOrder && handleNavigate(nextWorkOrder.id)}
              disabled={!nextWorkOrder}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">客户名称：</span>
              <span className="font-medium text-gray-900">{workOrder.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">业务类型：</span>
              <span className="font-medium text-gray-900">{workOrder.businessType}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">创建时间：</span>
              <span className="font-medium text-gray-900 ml-2">{formatDate(workOrder.createdAt)}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">责任人：</span>
              <span className="font-medium text-gray-900 ml-2">{workOrder.assignee}</span>
            </div>
          </div>
        </div>
      </div>
      
      {isReadOnly ? (
        <PolicyJudgeReadOnly workOrder={workOrder} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            政策判断信息
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                判断依据 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.judgmentBasis}
                onChange={(e) => setFormData({ ...formData, judgmentBasis: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入政策判断依据，包括相关法规、政策条款等..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                政策引用 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.policyReference}
                onChange={(e) => setFormData({ ...formData, policyReference: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="如：财税〔2023〕7号公告第一条"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                风险提示
              </label>
              <textarea
                value={formData.riskWarning}
                onChange={(e) => setFormData({ ...formData, riskWarning: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                placeholder="请输入可能存在的风险点和注意事项..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                处理意见 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.handlingSuggestion}
                onChange={(e) => setFormData({ ...formData, handlingSuggestion: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-green-50"
                placeholder="请输入具体的处理建议和操作步骤..."
              />
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleSubmit(true)}
                disabled={!canEdit}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                保存草稿
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <HistoryTimeline remarks={workOrder.historyRemarks} />
      </div>
    </div>
  );
};
