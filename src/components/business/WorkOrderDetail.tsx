import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  FileText, 
  AlertTriangle,
  User,
  Calendar,
  Paperclip,
  Download
} from 'lucide-react';
import { useWorkOrderStore } from '../../stores/workOrderStore';
import { useAuthStore } from '../../stores/authStore';
import { StatusTag } from './StatusTag';
import { HistoryTimeline } from './HistoryTimeline';
import { formatDate, formatFileSize, getUrgencyColor } from '../../lib/utils';

export const WorkOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { getWorkOrderById, getNextWorkOrder, getPrevWorkOrder } = useWorkOrderStore();
  
  const workOrder = id ? getWorkOrderById(id) : null;
  
  if (!workOrder) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">工单不存在</p>
      </div>
    );
  }
  
  const nextWorkOrder = getNextWorkOrder(workOrder.id);
  const prevWorkOrder = getPrevWorkOrder(workOrder.id);
  
  const handleNavigate = (targetId: string) => {
    if (user?.role === '税务顾问') {
      navigate(`/policy-judge/${targetId}`);
    } else if (user?.role === '项目经理') {
      navigate(`/approval/${targetId}`);
    } else {
      navigate(`/sign-receipt/${targetId}`);
    }
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
              <h1 className="text-2xl font-bold text-gray-900">{workOrder.orderNo}</h1>
              <div className="flex items-center gap-3 mt-2">
                <StatusTag status={workOrder.status} size="md" />
                <span className={`flex items-center gap-1 text-sm font-medium ${getUrgencyColor(workOrder.urgencyLevel)}`}>
                  {workOrder.urgencyLevel}
                </span>
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
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4" />
                客户名称
              </label>
              <p className="text-lg font-medium text-gray-900">{workOrder.customerName}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4" />
                业务类型
              </label>
              <p className="text-lg font-medium text-gray-900">{workOrder.businessType}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                <User className="w-4 h-4" />
                责任人
              </label>
              <p className="text-lg font-medium text-gray-900">{workOrder.assignee}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                创建时间
              </label>
              <p className="text-lg font-medium text-gray-900">{formatDate(workOrder.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {workOrder.policyJudgment && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">政策判断</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">判断依据</label>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {workOrder.policyJudgment.judgmentBasis}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">政策引用</label>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                {workOrder.policyJudgment.policyReference}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                风险提示
              </label>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
                {workOrder.policyJudgment.riskWarning}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">处理意见</label>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-green-800">
                {workOrder.policyJudgment.handlingSuggestion}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {workOrder.approval && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">方案审批</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">审批意见</label>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                {workOrder.approval.approvalOpinion}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">审批结论：</span>
              <StatusTag status={workOrder.approval.approvalResult === '通过' ? '审批通过' : '审批驳回'} />
            </div>
          </div>
        </div>
      )}
      
      {workOrder.attachments && workOrder.attachments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            附件列表
          </h2>
          
          <div className="space-y-2">
            {workOrder.attachments.map(attachment => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{attachment.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} | 上传人：{attachment.uploadedBy}
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  下载
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <HistoryTimeline remarks={workOrder.historyRemarks} />
      </div>
    </div>
  );
};
