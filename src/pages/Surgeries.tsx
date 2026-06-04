import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSurgeryStore } from '@/store/useSurgeryStore';
import { statusLabels, statusColors, formatTime, roleLabels } from '@/utils/status';
import {
  Search,
  Filter,
  X,
  ChevronRight,
  User,
  Clock,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SurgeryDetail from '@/components/surgery/SurgeryDetail';

export default function Surgeries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { surgeries, selectSurgery, selectedSurgeryId, currentRole } =
    useSurgeryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedId = searchParams.get('id');

  useEffect(() => {
    if (selectedId) {
      selectSurgery(selectedId);
    }
  }, [selectedId, selectSurgery]);

  const filteredSurgeries = surgeries.filter((s) => {
    const matchesSearch =
      s.patientName.includes(searchQuery) ||
      s.surgeryType.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectSurgery = (id: string) => {
    selectSurgery(id);
    setSearchParams({ id });
  };

  const handleCloseDetail = () => {
    selectSurgery(null);
    setSearchParams({});
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden transition-all duration-300',
          selectedSurgeryId ? 'mr-96' : ''
        )}
      >
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">手术列表</h1>
              <p className="text-gray-500 mt-1">共 {surgeries.length} 台手术</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索患者姓名、手术类型..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">全部状态</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            {filteredSurgeries.map((surgery) => (
              <div
                key={surgery.id}
                onClick={() => handleSelectSurgery(surgery.id)}
                className={cn(
                  'bg-white rounded-xl p-5 border cursor-pointer transition-all duration-200 hover:shadow-md',
                  selectedSurgeryId === surgery.id
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : 'border-gray-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        surgery.status === 'exception'
                          ? 'bg-red-100'
                          : 'bg-blue-100'
                      )}
                    >
                      <span
                        className={cn(
                          'font-semibold',
                          surgery.status === 'exception'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        )}
                      >
                        {surgery.patientName[0]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {surgery.patientName}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            statusColors[surgery.status]
                          )}
                        >
                          {statusLabels[surgery.status]}
                        </span>
                        {surgery.exceptions.filter(
                          (e) => e.status !== 'resolved'
                        ).length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3" />
                            异常
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {surgery.surgeryType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {formatTime(surgery.scheduledTime)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        {surgery.room}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        {surgery.doctorName}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {surgery.nurseName}
                      </p>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">
                        当前处理:{' '}
                        <span className="text-gray-700 font-medium">
                          {getCurrentHandler(surgery)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {surgery.lensReservation && (
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs',
                            surgery.lensReservation.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : surgery.lensReservation.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          晶体:{' '}
                          {surgery.lensReservation.status === 'confirmed'
                            ? '已确认'
                            : surgery.lensReservation.status === 'rejected'
                            ? '已退回'
                            : '待确认'}
                        </span>
                      )}
                      {surgery.materialConsumption && (
                        <span
                          className={cn(
                            'px-2 py-1 rounded text-xs',
                            surgery.materialConsumption.status === 'verified'
                              ? 'bg-green-100 text-green-700'
                              : surgery.materialConsumption.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : surgery.materialConsumption.status === 'submitted'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          核销:{' '}
                          {surgery.materialConsumption.status === 'verified'
                            ? '已复核'
                            : surgery.materialConsumption.status === 'rejected'
                            ? '已退回'
                            : surgery.materialConsumption.status === 'submitted'
                            ? '待复核'
                            : '草稿'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedSurgeryId && (
        <div className="fixed right-0 top-16 bottom-0 w-96 bg-white border-l border-gray-200 shadow-xl z-40 overflow-hidden">
          <SurgeryDetail
            surgeryId={selectedSurgeryId}
            onClose={handleCloseDetail}
          />
        </div>
      )}
    </div>
  );
}

function getCurrentHandler(surgery: any): string {
  switch (surgery.status) {
    case 'scheduled':
      return surgery.nurseName + ' (' + roleLabels.nurse + ')';
    case 'applying':
      return surgery.nurseName + ' (' + roleLabels.nurse + ')';
    case 'lens_pending':
      return surgery.doctorName + ' (' + roleLabels.doctor + ')';
    case 'lens_confirmed':
      return surgery.doctorName + ' (' + roleLabels.doctor + ')';
    case 'in_progress':
      return surgery.doctorName + ' (' + roleLabels.doctor + ')';
    case 'verifying':
      return (surgery.followupName || '待分配') + ' (' + roleLabels.followup + ')';
    case 'exception':
      return '管理员 (' + roleLabels.admin + ')';
    case 'completed':
      return '已完成';
    default:
      return '未知';
  }
}
