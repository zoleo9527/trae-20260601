import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PhoneCall, AlertTriangle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../contexts/DataContext';
import { ADMIN_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';


export function AdminFollowup() {
  const navigate = useNavigate();
  const { vehicles, followups } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredFollowups = followups.filter(followup => {
    const vehicle = vehicles.find(v => v.id === followup.vehicleId);
    const matchesSearch = vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         followup.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || followup.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  

  const isOverdue = (deadline: string, status: string) => {
    return status !== '已完成' && new Date(deadline) < new Date();
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const statusCounts = {
    all: followups.length,
    '待回访': followups.filter(f => f.status === '待回访').length,
    '回访中': followups.filter(f => f.status === '回访中').length,
    '已完成': followups.filter(f => f.status === '已完成').length,
    '无法联系': followups.filter(f => f.status === '无法联系').length,
  };

  return (
    <AppLayout role="admin" sidebarItems={ADMIN_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">回访管理</h1>
          <p className="text-gray-500 mt-1">执行车主回访并记录满意度</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索车牌号或车主姓名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-admin text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '全部' : status} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredFollowups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFollowups.map((followup) => {
              const vehicle = getVehicle(followup.vehicleId);
              
              const overdue = isOverdue(followup.deadline, followup.status);
              
              return (
                <Card key={followup.id}>
                  <CardContent>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {vehicle?.plateNumber}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {vehicle?.brand} {vehicle?.model}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {overdue && followup.status !== '已完成' && (
                          <StatusBadge status="拖延" size="sm" />
                        )}
                        <StatusBadge status={followup.status} size="sm" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">车主：</span>
                        <span className="text-gray-900">{followup.ownerName}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">电话：</span>
                        <span className="text-gray-900">{followup.ownerPhone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">截止：</span>
                        <span className={overdue ? 'text-red-600' : 'text-gray-900'}>
                          {formatDate(followup.deadline)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">联系次数：</span>
                        <span className="text-gray-900">{followup.attempts}次</span>
                      </div>
                    </div>

                    {followup.result && (
                      <div className="p-3 bg-green-50 rounded-lg mb-4">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">满意度：</span>
                          {followup.result.serviceSatisfaction}
                        </p>
                        {followup.result.feedback && (
                          <p className="text-xs text-green-600 mt-1">
                            {followup.result.feedback}
                          </p>
                        )}
                      </div>
                    )}

                    {followup.followupRecords.length > 0 && !followup.result && (
                      <div className="p-3 bg-gray-50 rounded-lg mb-4">
                        <p className="text-xs text-gray-500 mb-1">最近联系记录：</p>
                        <p className="text-sm text-gray-700">
                          {followup.followupRecords[followup.followupRecords.length - 1].contactResult}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleCall(followup.ownerPhone)}
                      >
                        <PhoneCall className="w-4 h-4" />
                        拨打电话
                      </Button>
                      <Button
                        className="flex-1 bg-admin hover:bg-admin-dark"
                        onClick={() => navigate(`/admin/followup/${followup.id}`)}
                      >
                        执行回访
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="暂无回访任务"
            description={searchTerm ? '没有找到匹配的回访任务' : '暂无待回访的任务'}
          />
        )}
      </div>
    </AppLayout>
  );
}
