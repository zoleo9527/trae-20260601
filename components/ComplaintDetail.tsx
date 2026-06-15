import { ComplaintRecord, UserRole } from '@/data/types';
import { statusOptions, rejectReasonOptions, satisfactionOptions } from '@/data/mockData';
import { X, User, Phone, Clock, AlertCircle, CheckCircle, MessageSquare, FileText } from 'lucide-react';

interface ComplaintDetailProps {
  complaint: ComplaintRecord;
  currentRole: UserRole;
  onClose: () => void;
  onHandle: (action: 'accept' | 'reject' | 'repair' | 'return_repair' | 'parts' | 'return_parts' | 'revisit' | 'return_revisit', data: Record<string, string>) => void;
}

export default function ComplaintDetail({ complaint, currentRole, onClose, onHandle }: ComplaintDetailProps) {
  const getStatusColor = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    if (!statusConfig) return 'bg-gray-100 text-gray-600';
    
    const colorMap: Record<string, string> = {
      warning: 'bg-warning-100 text-warning-600',
      primary: 'bg-primary-100 text-primary-600',
      success: 'bg-success-100 text-success-600',
      danger: 'bg-danger-100 text-danger-600',
    };
    return colorMap[statusConfig.color] || 'bg-gray-100 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig?.label || status;
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow: Record<string, string> = {
      '待客服受理': '待维修工程师处理',
      '待维修工程师处理': '待配件管理员处理',
      '待配件管理员处理': '待回访',
      '待回访': '已完成',
    };
    return statusFlow[currentStatus] || currentStatus;
  };

  const canHandle = () => {
    return complaint.currentAssignee === currentRole;
  };

  const getActionButtons = () => {
    if (!canHandle()) return null;
    
    if (complaint.status === '待客服受理') {
      return (
        <div className="flex gap-3">
          <button
            onClick={() => onHandle('accept', { remark: '' })}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            受理并派工
          </button>
          <button
            onClick={() => onHandle('reject', { reason: '', remark: '' })}
            className="flex-1 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
          >
            驳回工单
          </button>
        </div>
      );
    }
    
    if (complaint.status === '待维修工程师处理') {
      return (
        <div className="flex gap-3">
          <button
            onClick={() => onHandle('repair', { content: '', parts: '', remark: '' })}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            完成维修
          </button>
          <button
            onClick={() => onHandle('return_repair', { reason: '', remark: '' })}
            className="flex-1 px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors"
          >
            退回补录
          </button>
        </div>
      );
    }
    
    if (complaint.status === '待配件管理员处理') {
      return (
        <div className="flex gap-3">
          <button
            onClick={() => onHandle('parts', { parts: '', remark: '' })}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            配件已准备
          </button>
          <button
            onClick={() => onHandle('return_parts', { reason: '', remark: '' })}
            className="flex-1 px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors"
          >
            退回补录
          </button>
        </div>
      );
    }
    
    if (complaint.status === '待回访') {
      return (
        <div className="flex gap-3">
          <button
            onClick={() => onHandle('revisit', { satisfaction: '', content: '' })}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            完成回访
          </button>
          <button
            onClick={() => onHandle('return_revisit', { reason: '', remark: '' })}
            className="flex-1 px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 transition-colors"
          >
            退回补录
          </button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-gray-800">{complaint.id}</span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(complaint.status)}`}>
              {getStatusLabel(complaint.status)}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3">客户信息</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{complaint.customerName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">{complaint.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-800">投诉时间: {complaint.complaintTime}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3">产品信息</h3>
            <div className="space-y-2">
              <p><span className="text-gray-500">产品类型:</span> {complaint.productType}</p>
              <p><span className="text-gray-500">产品型号:</span> {complaint.productModel}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3">投诉内容</h3>
            <p className="text-gray-700">{complaint.complaintContent}</p>
          </div>
          
          {complaint.customerService && (
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-primary-800">客服处理记录</h3>
              </div>
              <div className="space-y-2">
                <p><span className="text-gray-500">处理人:</span> {complaint.customerService.handler}</p>
                <p><span className="text-gray-500">处理时间:</span> {complaint.customerService.handleTime}</p>
                {complaint.customerService.remark && (
                  <p><span className="text-gray-500">备注:</span> {complaint.customerService.remark}</p>
                )}
              </div>
            </div>
          )}
          
          {complaint.engineer && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">维修工程师记录</h3>
              </div>
              <div className="space-y-2">
                <p><span className="text-gray-500">处理人:</span> {complaint.engineer.handler}</p>
                <p><span className="text-gray-500">处理时间:</span> {complaint.engineer.handleTime}</p>
                {complaint.engineer.repairContent && (
                  <p><span className="text-gray-500">维修内容:</span> {complaint.engineer.repairContent}</p>
                )}
                {complaint.engineer.partsUsed && complaint.engineer.partsUsed.length > 0 && (
                  <p><span className="text-gray-500">使用配件:</span> {complaint.engineer.partsUsed.join(', ')}</p>
                )}
                {complaint.engineer.remark && (
                  <p><span className="text-gray-500">备注:</span> {complaint.engineer.remark}</p>
                )}
                {complaint.engineer.returnHandler && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回处理人:</span> {complaint.engineer.returnHandler}</p>
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回时间:</span> {complaint.engineer.returnTime}</p>
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回原因:</span> {complaint.engineer.returnReason}</p>
                    {complaint.engineer.returnRemark && (
                      <p className="text-sm text-warning-600"><span className="text-gray-500">退回备注:</span> {complaint.engineer.returnRemark}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {complaint.partsManager && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800">配件管理员记录</h3>
              </div>
              <div className="space-y-2">
                <p><span className="text-gray-500">处理人:</span> {complaint.partsManager.handler}</p>
                <p><span className="text-gray-500">处理时间:</span> {complaint.partsManager.handleTime}</p>
                {complaint.partsManager.partsPrepared && complaint.partsManager.partsPrepared.length > 0 && (
                  <p><span className="text-gray-500">准备配件:</span> {complaint.partsManager.partsPrepared.join(', ')}</p>
                )}
                {complaint.partsManager.remark && (
                  <p><span className="text-gray-500">备注:</span> {complaint.partsManager.remark}</p>
                )}
                {complaint.partsManager.returnHandler && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回处理人:</span> {complaint.partsManager.returnHandler}</p>
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回时间:</span> {complaint.partsManager.returnTime}</p>
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回原因:</span> {complaint.partsManager.returnReason}</p>
                    {complaint.partsManager.returnRemark && (
                      <p className="text-sm text-warning-600"><span className="text-gray-500">退回备注:</span> {complaint.partsManager.returnRemark}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {complaint.revisit && (
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-800">回访记录</h3>
              </div>
              <div className="space-y-2">
                <p><span className="text-gray-500">回访人:</span> {complaint.revisit.handler}</p>
                <p><span className="text-gray-500">回访时间:</span> {complaint.revisit.revisitTime}</p>
                {complaint.revisit.customerSatisfaction && (
                  <p>
                    <span className="text-gray-500">满意度:</span> 
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      complaint.revisit.customerSatisfaction === '满意' ? 'bg-success-100 text-success-600' :
                      complaint.revisit.customerSatisfaction === '一般' ? 'bg-warning-100 text-warning-600' :
                      'bg-danger-100 text-danger-600'
                    }`}>
                      {complaint.revisit.customerSatisfaction}
                    </span>
                  </p>
                )}
                {complaint.revisit.revisitContent && (
                  <p><span className="text-gray-500">回访内容:</span> {complaint.revisit.revisitContent}</p>
                )}
                {complaint.revisit.returnHandler && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回处理人:</span> {complaint.revisit.returnHandler}</p>
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回时间:</span> {complaint.revisit.returnTime}</p>
                    <p className="text-sm text-warning-600"><span className="text-gray-500">退回原因:</span> {complaint.revisit.returnReason}</p>
                    {complaint.revisit.returnRemark && (
                      <p className="text-sm text-warning-600"><span className="text-gray-500">退回备注:</span> {complaint.revisit.returnRemark}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {complaint.rejectReason && (
            <div className="bg-danger-50 rounded-xl p-4 border border-danger-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-danger-600" />
                <h3 className="font-semibold text-danger-800">驳回记录</h3>
              </div>
              <div className="space-y-2">
                <p><span className="text-gray-500">驳回原因:</span> {complaint.rejectReason}</p>
                <p><span className="text-gray-500">驳回时间:</span> {complaint.rejectTime}</p>
                {complaint.rejectRemark && (
                  <p><span className="text-gray-500">驳回说明:</span> {complaint.rejectRemark}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-800 mb-3">处理历史</h3>
            <div className="space-y-3">
              {complaint.history.map((record) => (
                <div key={record.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{record.action}</span>
                      <span className="text-xs text-gray-400">{record.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="text-gray-500">{record.operator}:</span> {record.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">当前处理人: {complaint.currentAssignee}</p>
              {canHandle() && (
                <p className="text-sm text-primary-600 mt-1">您可以对此工单进行处理</p>
              )}
            </div>
            {getActionButtons()}
          </div>
        </div>
      </div>
    </div>
  );
}
