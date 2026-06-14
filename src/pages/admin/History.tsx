import { useState } from 'react';
import { Search } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../contexts/DataContext';
import { ADMIN_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

export function AdminHistory() {
  const { vehicles, followups } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const completedFollowups = followups.filter(f => f.status === '已完成' || f.status === '无法联系');

  const filteredFollowups = completedFollowups.filter(followup => {
    const vehicle = vehicles.find(v => v.id === followup.vehicleId);
    return vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           followup.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  return (
    <AppLayout role="admin" sidebarItems={ADMIN_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">回访历史</h1>
          <p className="text-gray-500 mt-1">查看所有已完成的车主回访记录</p>
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
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              共 <span className="font-bold text-admin">{filteredFollowups.length}</span> 条记录
            </div>
          </div>
        </div>

        {filteredFollowups.length > 0 ? (
          <div className="space-y-4">
            {filteredFollowups.map((followup) => {
              const vehicle = getVehicle(followup.vehicleId);
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
                      <StatusBadge status={followup.status} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">车主</p>
                        <p className="font-medium text-gray-900">{followup.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">电话</p>
                        <p className="font-medium text-gray-900">{followup.ownerPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">联系次数</p>
                        <p className="font-medium text-gray-900">{followup.attempts}次</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">完成时间</p>
                        <p className="font-medium text-gray-900">
                          {followup.result ? formatDate(followup.result.completedAt) : '-'}
                        </p>
                      </div>
                    </div>

                    {followup.followupRecords.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-xs text-gray-500">联系记录：</p>
                        {followup.followupRecords.map((record, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {record.type} · {record.contactResult}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(record.operatedAt)}
                              </span>
                            </div>
                            {record.feedback && (
                              <p className="text-sm text-gray-600">{record.feedback}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {followup.result && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">服务满意度</p>
                            <p className="font-medium text-green-700">
                              {followup.result.serviceSatisfaction}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">检测满意度</p>
                            <p className="font-medium text-green-700">
                              {followup.result.processSatisfaction}
                            </p>
                          </div>
                        </div>
                        {followup.result.feedback && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-gray-500">用户反馈</p>
                            <p className="text-sm text-gray-700 mt-1">
                              {followup.result.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="暂无回访记录"
            description={searchTerm ? '没有找到匹配的记录' : '还没有完成任何回访'}
          />
        )}
      </div>
    </AppLayout>
  );
}
