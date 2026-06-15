import React from 'react';
import { CheckSquare, Package, Truck, Edit3, AlertCircle, Clock, User } from 'lucide-react';
import { ProcessRecord, Role } from '../types';

interface ProcessTimelineProps {
  records: ProcessRecord[];
}

const roleLabels: Record<Role, string> = {
  project_manager: '项目专员',
  producer: '制作师傅',
  installer: '安装负责人',
  admin: '管理员'
};

const roleColors: Record<Role, string> = {
  project_manager: 'bg-blue-100 text-blue-600',
  producer: 'bg-yellow-100 text-yellow-600',
  installer: 'bg-green-100 text-green-600',
  admin: 'bg-purple-100 text-purple-600'
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  quality_check: CheckSquare,
  quality_update: Edit3,
  packaging_create: Package,
  packaging_update: Edit3,
  shipment: Truck
};

const typeColors: Record<string, string> = {
  quality_check: 'bg-purple-500',
  quality_update: 'bg-orange-500',
  packaging_create: 'bg-blue-500',
  packaging_update: 'bg-cyan-500',
  shipment: 'bg-green-500'
};

export function ProcessTimeline({ records }: ProcessTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>暂无处理记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record, index) => {
        const Icon = typeIcons[record.type] || Clock;
        return (
          <div
            key={record.id}
            className={`relative pl-8 pb-4 ${index !== records.length - 1 ? 'border-l-2 border-gray-200' : ''}`}
            style={{ marginLeft: '12px' }}
          >
            <div
              className={`absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center -translate-x-[15px] ${typeColors[record.type]}`}
            >
              <Icon className="w-3 h-3 text-white" />
            </div>
            
            {record.offline && (
              <div className="absolute left-0 top-0 -translate-x-[15px] -translate-y-1">
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  离线
                </span>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-800">{record.title}</span>
                <span className="text-xs text-gray-400">{record.timestamp}</span>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{record.description}</p>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">{record.operatorName}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${roleColors[record.operatorRole]}`}>
                  {roleLabels[record.operatorRole]}
                </span>
              </div>

              {record.statusBefore && record.statusAfter && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">状态变化:</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      {record.statusBefore === 'quality_check' ? '质检中' :
                       record.statusBefore === 'pass' ? '已通过' :
                       record.statusBefore === 'fail' ? '未通过' :
                       record.statusBefore === 'pending' ? '进行中' :
                       record.statusBefore === 'packaging' ? '打包中' :
                       record.statusBefore === 'ready' ? '待发货' :
                       record.statusBefore === 'shipped' ? '已发货' :
                       record.statusBefore}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className={`px-2 py-0.5 rounded ${record.statusAfter === 'pass' || record.statusAfter === 'ready' || record.statusAfter === 'shipped' ? 'bg-green-100 text-green-600' : 
                                                                                             record.statusAfter === 'fail' ? 'bg-red-100 text-red-600' :
                                                                                             'bg-blue-100 text-blue-600'}`}>
                      {record.statusAfter === 'quality_check' ? '质检中' :
                       record.statusAfter === 'pass' ? '已通过' :
                       record.statusAfter === 'fail' ? '未通过' :
                       record.statusAfter === 'pending' ? '进行中' :
                       record.statusAfter === 'packaging' ? '打包中' :
                       record.statusAfter === 'ready' ? '待发货' :
                       record.statusAfter === 'shipped' ? '已发货' :
                       record.statusAfter}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}