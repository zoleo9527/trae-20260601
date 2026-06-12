import React from 'react';
import { WorkOrderList } from '../components/business/WorkOrderList';

export const WorkOrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">全部记录</h1>
            <p className="text-slate-300">查看和管理所有工单记录</p>
          </div>
        </div>
      </div>
      
      <WorkOrderList />
    </div>
  );
};
