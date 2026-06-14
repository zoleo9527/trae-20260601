import { useState } from 'react';
import { Search, Check, X, Eye } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardContent } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Textarea } from '../../components/common/Input';
import { EmptyState } from '../../components/common/EmptyState';
import { useData } from '../../contexts/DataContext';
import { AUDITOR_SIDEBAR } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';
import { InspectionReport } from '../../types';

export function AuditorReports() {
  const { vehicles, reports, auditReport } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const pendingReports = reports.filter(r => r.status === '待审核');

  const filteredReports = pendingReports.filter(report => {
    const vehicle = vehicles.find(v => v.id === report.vehicleId);
    return vehicle?.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           vehicle?.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getVehicle = (vehicleId: string) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const handleApprove = (report: InspectionReport) => {
    auditReport(report.id, '已通过', undefined, '王审核');
    alert('报告审核通过！');
  };

  const handleReject = () => {
    if (selectedReport && rejectReason) {
      auditReport(selectedReport.id, '已驳回', rejectReason, '王审核');
      setShowRejectModal(false);
      setSelectedReport(null);
      setRejectReason('');
      alert('报告已驳回');
    }
  };

  return (
    <AppLayout role="auditor" sidebarItems={AUDITOR_SIDEBAR}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">待审核报告</h1>
          <p className="text-gray-500 mt-1">审核检测报告并做出决定</p>
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
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              待审核：<span className="font-bold text-orange-600">{pendingReports.length}</span> 份
            </div>
          </div>
        </div>

        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => {
              const vehicle = getVehicle(report.vehicleId);
              return (
                <Card key={report.id}>
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
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
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
                          report.conclusion === '合格' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {report.conclusion}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">检测员</p>
                        <p className="font-medium text-gray-900">{report.inspectorName}</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-gray-500">检测项目</p>
                      <div className="flex flex-wrap gap-2">
                        {report.items.map((item, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              item.result === '合格'
                                ? 'bg-green-100 text-green-700'
                                : item.result === '不合格'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {item.name}：{item.result}
                          </span>
                        ))}
                      </div>
                    </div>

                    {report.remark && (
                      <div className="p-3 bg-gray-50 rounded-lg mb-4">
                        <p className="text-xs text-gray-500">备注</p>
                        <p className="text-sm text-gray-700">{report.remark}</p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      提交时间：{formatDate(report.submittedAt || '')}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(report)}
                      >
                        <Check className="w-4 h-4" />
                        通过
                      </Button>
                      <Button
                        variant="danger"
                        className="flex-1"
                        onClick={() => {
                          setSelectedReport(report);
                          setShowRejectModal(true);
                        }}
                      >
                        <X className="w-4 h-4" />
                        驳回
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="w-4 h-4" />
                        详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="暂无待审核报告"
            description="所有报告都已审核完毕"
          />
        )}

        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedReport(null);
            setRejectReason('');
          }}
          title="驳回报告"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              请输入驳回原因：
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请详细说明驳回原因，以便检测员修改..."
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReport(null);
                  setRejectReason('');
                }}
              >
                取消
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                确认驳回
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
