import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useWorkOrderStore } from '../stores/workOrderStore';
import { WorkOrderList } from '../components/business/WorkOrderList';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const workOrders = useWorkOrderStore(state => state.workOrders);
  
  if (!user) return null;
  
  const stats = {
    pending: workOrders.filter(wo => 
      (user.role === '税务顾问' && (wo.status === '待判断' || wo.status === '判断中')) ||
      (user.role === '项目经理' && wo.status === '待审批') ||
      (user.role === '客户财务' && wo.status === '审批通过')
    ).length,
    processing: workOrders.filter(wo => wo.status === '判断中').length,
    completed: workOrders.filter(wo => 
      wo.status === '审批通过' || wo.status === '已签收' || wo.status === '处理完成'
    ).length,
    rejected: workOrders.filter(wo => wo.status === '审批驳回').length
  };
  
  const statCards = [
    { 
      label: '待处理', 
      value: stats.pending, 
      icon: Clock, 
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600'
    },
    { 
      label: '处理中', 
      value: stats.processing, 
      icon: TrendingUp, 
      color: 'yellow',
      gradient: 'from-yellow-500 to-orange-500'
    },
    { 
      label: '已完成', 
      value: stats.completed, 
      icon: CheckCircle, 
      color: 'green',
      gradient: 'from-green-500 to-emerald-600'
    },
    { 
      label: '已驳回', 
      value: stats.rejected, 
      icon: AlertTriangle, 
      color: 'red',
      gradient: 'from-red-500 to-pink-600'
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              欢迎使用税务咨询工作台
            </h1>
            <p className="text-blue-100">
              {user.role === '税务顾问' && '您可以通过政策判断处理工单，为客户提供专业的税务建议'}
              {user.role === '项目经理' && '您可以审批税务顾问的政策判断结果，确保方案准确合规'}
              {user.role === '客户财务' && '您可以查看已审批通过的方案，并进行签收确认'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-sm text-blue-100 mb-1">今日处理</p>
              <p className="text-3xl font-bold">{stats.completed}</p>
              <p className="text-xs text-blue-200 mt-1">件</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>
      
      {user.role === '税务顾问' && stats.pending > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">您有 {stats.pending} 条工单待处理</p>
                <p className="text-sm text-gray-600">点击开始处理政策判断</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/policy-judge')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始处理
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {user.role === '项目经理' && stats.pending > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">您有 {stats.pending} 条方案待审批</p>
                <p className="text-sm text-gray-600">请及时审批以确保业务进度</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/approval')}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              开始审批
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {user.role === '客户财务' && stats.pending > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">您有 {stats.pending} 条方案待签收</p>
                <p className="text-sm text-gray-600">请查看并确认签收</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/sign-receipt')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              查看方案
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <WorkOrderList />
    </div>
  );
};
