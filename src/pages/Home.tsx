import React from 'react';
import { Users, ChefHat, CreditCard, ArrowRight, FileText } from 'lucide-react';

export default function Home() {
  const workflowSteps = [
    {
      icon: Users,
      title: '前厅经理',
      role: 'manager',
      action: '提交等位排号',
      description: '记录顾客信息、用餐人数，创建排号记录',
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      icon: ChefHat,
      title: '后厨主管',
      role: 'chef',
      action: '确认桌台分配',
      description: '查看可用桌台，确认分配并写入独立分配记录',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: CreditCard,
      title: '收银员',
      role: 'cashier',
      action: '完成结账释放桌台',
      description: '结算账单，更新桌台状态为可用',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="w-6 h-6 text-orange-500" />
        <div>
          <h2 className="text-lg font-bold text-gray-800">角色交接链路</h2>
          <p className="text-sm text-gray-500">清晰的职责划分，完整的责任追溯</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.role}>
              <div className={`flex flex-col items-center p-4 rounded-xl ${step.bgColor}`}>
                <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className={`font-bold ${step.textColor}`}>{step.title}</h3>
                <p className="text-sm font-medium text-gray-700 mt-1">{step.action}</p>
                <p className="text-xs text-gray-500 mt-1 text-center max-w-[120px]">{step.description}</p>
              </div>
              {index < workflowSteps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-gray-400 hidden md:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">责任追溯机制</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
            <span>所有操作自动记录到系统日志</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
            <span>桌台分配有独立的分配记录表</span>
          </li>
          <li className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
            <span>排号详情页展示完整操作时间线</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
