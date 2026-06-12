import React, { useEffect } from 'react';
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
  Download,
  FileCheck,
  ClipboardCheck,
  FileSignature,
  CheckCircle
} from 'lucide-react';
import { useWorkOrderStore } from '../stores/workOrderStore';
import { useAuthStore } from '../stores/authStore';
import { StatusTag } from '../components/business/StatusTag';
import { HistoryTimeline } from '../components/business/HistoryTimeline';
import { formatDate, formatFileSize, getUrgencyColor } from '../lib/utils';

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { getWorkOrderById, getNextWorkOrder, getPrevWorkOrder, workOrders } = useWorkOrderStore();
  
  useEffect(() => {
    if (!id && user) {
      const pendingWorkOrder = workOrders.find(wo => {
        if (user.role === '税务顾问') {
          return wo.status === '待判断' || wo.status === '判断中';
        } else if (user.role === '项目经理') {
          return wo.status === '待审批';
        } else if (user.role === '客户财务') {
          return wo.status === '审批通过';
        }
        return false;
      });
      
      if (pendingWorkOrder) {
        if (user.role === '税务顾问') {
          navigate(`/policy-judge/${pendingWorkOrder.id}`, { replace: true });
        } else if (user.role === '项目经理') {
          navigate(`/approval/${pendingWorkOrder.id}`, { replace: true });
        } else if (user.role === '客户财务') {
          navigate(`/sign-receipt/${pendingWorkOrder.id}`, { replace: true });
        }
      }
    }
  }, [id, user, navigate, workOrders]);
  
  const workOrder = id ? getWorkOrderById(id) : null;
  
  if (!workOrder) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">工单不存在</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          返回首页
        </button>
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
  
  const handleProcess = () => {
    if (user?.role === '税务顾问') {
      navigate(`/policy-judge/${workOrder.id}`);
    } else if (user?.role === '项目经理') {
      navigate(`/approval/${workOrder.id}`);
    } else if (user?.role === '客户财务') {
      navigate(`/sign-receipt/${workOrder.id}`);
    }
  };
  
  const getProcessButton = () => {
    if (!user) return null;
    
    const role = user.role;
    const status = workOrder.status;
    
    if (role === '税务顾问' && (status === '待判断' || status === '判断中')) {
      return (
        <button
          onClick={handleProcess}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileCheck className="w-5 h-5" />
          {status === '待判断' ? '开始判断' : '继续判断'}
        </button>
      );
    }
    
    if (role === '项目经理' && status === '待审批') {
      return (
        <button
          onClick={handleProcess}
          className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          <ClipboardCheck className="w-5 h-5" />
          开始审批
        </button>
      );
    }
    
    if (role === '客户财务' && status === '审批通过') {
      return (
        <button
          onClick={handleProcess}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FileSignature className="w-5 h-5" />
          确认签收
        </button>
      );
    }
    
    if (status === '处理完成' || status === '已签收') {
      return (
        <div className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          {status === '处理完成' ? '已处理完成' : '已签收'}
        </div>
      );
    }
    
    return null;
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
          
          <div className="flex items-center gap-3">
            {getProcessButton()}
            
            <div className="flex items-center gap-2 ml-4">
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
            
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <span>判断人：{workOrder.policyJudgment.judgedBy}</span>
              <span>判断时间：{formatDate(workOrder.policyJudgment.judgedAt)}</span>
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
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {workOrder.approval.approvalOpinion}
              </div>
            </div>
            
            {workOrder.approval.rejectReason && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  驳回原因
                </label>
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-red-800">
                  {workOrder.approval.rejectReason}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">审批结论：</span>
                <StatusTag status={workOrder.approval.approvalResult === '通过' ? '审批通过' : '审批驳回'} />
              </div>
              <div className="flex-1 text-sm text-gray-600 text-right">
                {workOrder.approval.approvedBy} · {formatDate(workOrder.approval.approvedAt)}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {workOrder.signReceipt && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">签收确认</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">签收确认</label>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-sm text-green-800">
                {workOrder.signReceipt.receiptConfirm}
              </div>
            </div>
            
            {workOrder.signReceipt.receiptRemark && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">签收备注</label>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                  {workOrder.signReceipt.receiptRemark}
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
              <span>签收人：{workOrder.signReceipt.receivedBy}</span>
              <span>签收时间：{formatDate(workOrder.signReceipt.receivedAt)}</span>
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
