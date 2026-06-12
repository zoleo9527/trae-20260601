import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  XCircle,
  Building2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { useWorkOrderStore } from '../stores/workOrderStore';
import { useAuthStore } from '../stores/authStore';
import { StatusTag } from '../components/business/StatusTag';
import { HistoryTimeline } from '../components/business/HistoryTimeline';
import { formatDate } from '../lib/utils';
import type { Approval } from '../types';

export const ApprovalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { getWorkOrderById, submitApproval, getNextWorkOrder, getPrevWorkOrder, workOrders } = useWorkOrderStore();
  
  const workOrder = id ? getWorkOrderById(id) : null;
  
  useEffect(() => {
    if (!id && user) {
      const pendingWorkOrder = workOrders.find(wo => 
        wo.status === '待审批'
      );
      
      if (pendingWorkOrder) {
        navigate(`/approval/${pendingWorkOrder.id}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [id, user, navigate, workOrders]);
  
  const [formData, setFormData] = useState<Partial<Approval>>({
    approvalOpinion: '',
    approvalResult: undefined,
    rejectReason: ''
  });
  
  if (!workOrder) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">正在跳转到待审批工单...</p>
      </div>
    );
  }
  
  if (!workOrder.policyJudgment) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
        <p className="text-gray-500">该工单尚未完成政策判断，无法审批</p>
      </div>
    );
  }
  
  const nextWorkOrder = getNextWorkOrder(workOrder.id);
  const prevWorkOrder = getPrevWorkOrder(workOrder.id);
  
  const handleSubmit = () => {
    if (!formData.approvalOpinion) {
      alert('请填写审批意见');
      return;
    }
    if (!formData.approvalResult) {
      alert('请选择审批结论');
      return;
    }
    if (formData.approvalResult === '驳回' && !formData.rejectReason) {
      alert('驳回时必须填写驳回原因');
      return;
    }
    
    submitApproval(workOrder.id, {
      approvalOpinion: formData.approvalOpinion || '',
      approvalResult: formData.approvalResult as '通过' | '驳回',
      rejectReason: formData.rejectReason,
      approvedBy: user?.name || '',
      approvedAt: new Date().toISOString()
    });
    
    alert('审批提交成功！');
    if (nextWorkOrder) {
      navigate(`/approval/${nextWorkOrder.id}`);
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleNavigate = (targetId: string) => {
    navigate(`/approval/${targetId}`);
  };
  
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
              <h1 className="text-2xl font-bold text-gray-900">方案审批</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-semibold text-blue-600">{workOrder.orderNo}</span>
                <StatusTag status={workOrder.status} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
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
              <span className="text-gray-600">判断人：</span>
              <span className="font-medium text-gray-900 ml-2">{workOrder.policyJudgment?.judgedBy}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">政策判断详情</h2>
        
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
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">审批意见</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              审批意见 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.approvalOpinion}
              onChange={(e) => setFormData({ ...formData, approvalOpinion: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入审批意见..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              审批结论 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setFormData({ ...formData, approvalResult: '通过' })}
                className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                  formData.approvalResult === '通过'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">通过</p>
              </button>
              <button
                onClick={() => setFormData({ ...formData, approvalResult: '驳回' })}
                className={`flex-1 py-4 rounded-lg border-2 transition-all ${
                  formData.approvalResult === '驳回'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <XCircle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-medium">驳回</p>
              </button>
            </div>
          </div>
          
          {formData.approvalResult === '驳回' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                驳回原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.rejectReason}
                onChange={(e) => setFormData({ ...formData, rejectReason: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                placeholder="请输入驳回原因和修改建议..."
              />
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className={`px-6 py-2.5 text-white rounded-lg transition-colors flex items-center gap-2 ${
                formData.approvalResult === '通过' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : formData.approvalResult === '驳回'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              提交审批
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <HistoryTimeline remarks={workOrder.historyRemarks} />
      </div>
    </div>
  );
};
