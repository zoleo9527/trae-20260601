import { ComplaintRecord, UserRole } from '@/data/types';
import { statusOptions } from '@/data/mockData';
import { ChevronRight, Phone, Clock } from 'lucide-react';

interface ComplaintListProps {
  complaints: ComplaintRecord[];
  currentRole: UserRole;
  onSelect: (complaint: ComplaintRecord) => void;
}

export default function ComplaintList({ complaints, currentRole, onSelect }: ComplaintListProps) {
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

  const isAssignedToCurrentRole = (complaint: ComplaintRecord) => {
    return complaint.currentAssignee === currentRole;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800">工单列表</h2>
        <p className="text-sm text-gray-500 mt-1">
          显示 {complaints.length} 条记录
          {currentRole && (
            <span className="ml-2">
              | 我的待办: {complaints.filter(isAssignedToCurrentRole).length} 条
            </span>
          )}
        </p>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-[calc(100vh-320px)] overflow-y-auto scrollbar-thin">
        {complaints.map((complaint) => {
          const isMine = isAssignedToCurrentRole(complaint);
          return (
            <div
              key={complaint.id}
              onClick={() => onSelect(complaint)}
              className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                isMine ? 'bg-primary-50/50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-500">{complaint.id}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                      {getStatusLabel(complaint.status)}
                    </span>
                    {isMine && (
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
                        我的待办
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-gray-800">{complaint.productType} - {complaint.productModel}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{complaint.complaintContent}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {complaint.customerName} {complaint.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {complaint.complaintTime}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
