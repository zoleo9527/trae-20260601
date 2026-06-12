import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  ChevronRight,
  FileText,
  Zap,
  Clock
} from 'lucide-react';
import type { WorkOrder, FilterParams, WorkOrderStatus } from '../../types';
import { StatusTag } from './StatusTag';
import { formatDate, getUrgencyColor } from '../../lib/utils';
import { useWorkOrderStore } from '../../stores/workOrderStore';

export const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  const { filters, setFilters, getFilteredWorkOrders } = useWorkOrderStore();
  const filteredWorkOrders = getFilteredWorkOrders();
  
  const handleFilterChange = (key: keyof FilterParams, value: string | string[] | undefined) => {
    setFilters({ ...filters, [key]: value });
  };
  
  const handleRowClick = (workOrder: WorkOrder) => {
    navigate(`/work-orders/${workOrder.id}`);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索工单编号、客户名称..."
              value={filters.keyword || ''}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filters.businessType || ''}
            onChange={(e) => handleFilterChange('businessType', e.target.value || undefined)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部业务类型</option>
            <option value="政策咨询">政策咨询</option>
            <option value="税务筹划">税务筹划</option>
            <option value="争议处理">争议处理</option>
          </select>
          
          <select
            value={filters.urgencyLevel || ''}
            onChange={(e) => handleFilterChange('urgencyLevel', e.target.value || undefined)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部紧急程度</option>
            <option value="普通">普通</option>
            <option value="紧急">紧急</option>
            <option value="加急">加急</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">快速筛选：</span>
          {(['待判断', '判断中', '待审批', '审批通过', '审批驳回', '已签收'] as WorkOrderStatus[]).map(status => (
            <button
              key={status}
              onClick={() => {
                const currentStatuses = filters.status || [];
                if (currentStatuses.includes(status)) {
                  handleFilterChange('status', currentStatuses.filter(s => s !== status));
                } else {
                  handleFilterChange('status', [...currentStatuses, status]);
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                (filters.status || []).includes(status)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            工单列表 
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredWorkOrders.length} 条记录)
            </span>
          </h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredWorkOrders.map(workOrder => (
            <div
              key={workOrder.id}
              onClick={() => handleRowClick(workOrder)}
              className="px-6 py-4 hover:bg-blue-50/50 cursor-pointer transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-blue-600 group-hover:text-blue-700">
                      {workOrder.orderNo}
                    </span>
                    <StatusTag status={workOrder.status} />
                    <span className={`flex items-center gap-1 text-sm ${getUrgencyColor(workOrder.urgencyLevel)}`}>
                      {workOrder.urgencyLevel === '加急' && <Zap className="w-3 h-3" />}
                      {workOrder.urgencyLevel === '紧急' && <Zap className="w-3 h-3" />}
                      {workOrder.urgencyLevel}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{workOrder.customerName}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">{workOrder.businessType}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(workOrder.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                        {workOrder.assignee}
                      </span>
                    </div>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ))}
          
          {filteredWorkOrders.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>暂无工单数据</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
