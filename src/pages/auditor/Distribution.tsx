import { useState } from 'react';
import { Search, Send, CheckCircle } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../contexts/DataContext';
import { AUDITOR_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { ReportDistribution } from '../../types';

export function AuditorDistribution() {
  const { vehicles, reports, distributions, distributeReport } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [distributing, setDistributing] = useState<string | null>(null);

  const pendingDistributions = distributions.filter(d => 
    d.status === '待发放' || d.status === '发放中'
  );
  
  const completedDistributions = distributions.filter(d => 
    d.status === '已发放' || d.status === '发放异常'
  );

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getReport = (reportId: string) => {
    return reports.find(r => r.id === reportId);
  };

  const getDistributionTag = (dist: ReportDistribution) => {
    if (dist.status === '发放异常') {
      return '发放异常';
    }
    if (dist.status === '待发放') {
      const auditTime = getReport(dist.reportId)?.auditedAt;
      if (auditTime) {
        const hoursSinceAudit = (Date.now() - new Date(auditTime).getTime()) / (1000 * 60 * 60);
        if (hoursSinceAudit > 24) {
          return '拖延';
        }
      }
    }
    return null;
  };

  const handleDistribute = (dist: ReportDistribution) => {
    setDistributing(dist.id);
    try {
      distributeReport(dist.id);
      setTimeout(() => {
        setDistributing(null);
      }, 2500);
    } catch (error) {
      setDistributing(null);
      console.error('Failed to distribute:', error);
    }
  };

  const allDistributions = [...pendingDistributions, ...completedDistributions];

  const filteredDistributions = allDistributions.filter(dist => {
    const report = getReport(dist.reportId);
    const vehicle = report ? getVehicle(report.vehicleId) : null;
    return vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehicle?.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AppLayout role="auditor" sidebarItems={AUDITOR_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">报告发放</h1>
          <p className="text-gray-500 mt-1">发放已审核通过的检测报告给车主</p>
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-auditor"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                待发放：<span className="font-bold text-orange-600">{pendingDistributions.length}</span> 份
              </span>
              <span className="text-gray-600">
                已发放：<span className="font-bold text-green-600">{completedDistributions.length}</span> 份
              </span>
            </div>
          </div>
        </div>

        {filteredDistributions.length > 0 ? (
          <div className="space-y-4">
            {filteredDistributions.map((dist) => {
              const report = getReport(dist.reportId);
              const vehicle = report ? getVehicle(report.vehicleId) : null;
              const distTag = getDistributionTag(dist);
              
              return (
                <Card key={dist.id}>
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
                      <div className="flex gap-2">
                        {distTag && <StatusBadge status={distTag} />}
                        <StatusBadge status={dist.status} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">车主</p>
                        <p className="font-medium text-gray-900">{vehicle?.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">电话</p>
                        <p className="font-medium text-gray-900">{vehicle?.ownerPhone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">检测结论</p>
                        <p className={`font-medium ${
                          report?.conclusion === '合格' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {report?.conclusion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">审核通过</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(report?.auditedAt || '')}
                        </p>
                      </div>
                    </div>

                    {dist.status === '发放中' && (
                      <div className="p-3 bg-blue-50 rounded-lg mb-4">
                        <p className="text-sm text-blue-600">
                          报告正在发送给车主，请稍候...
                        </p>
                      </div>
                    )}

                    {dist.status === '发放异常' && (
                      <div className="p-3 bg-red-50 rounded-lg mb-4">
                        <p className="text-sm text-red-600">
                          报告发放失败：{dist.remark || '未知原因'}
                        </p>
                      </div>
                    )}

                    {dist.status === '已发放' && (
                      <div className="p-3 bg-green-50 rounded-lg mb-4">
                        <p className="text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          报告已成功发放给车主，回访任务已自动创建
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        创建时间：{formatDate(dist.createdAt)}
                        {dist.sentAt && (
                          <> · 发放时间：{formatDate(dist.sentAt)}</>
                        )}
                      </div>
                      
                      {(dist.status === '待发放' || dist.status === '发放异常') && (
                        <Button
                          className="bg-auditor hover:bg-auditor-dark"
                          loading={distributing === dist.id}
                          onClick={() => handleDistribute(dist)}
                        >
                          <Send className="w-4 h-4" />
                          确认发放
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="暂无待发放报告"
            description="所有已审核通过的报告都已发放完毕"
          />
        )}
      </div>
    </AppLayout>
  );
}
