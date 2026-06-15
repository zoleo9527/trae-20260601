import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, FileX, Fuel, Wrench, XCircle, Truck, Calendar, User, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/common/StatCard';
import { FilterTabs } from '@/components/common/FilterTabs';
import { AnomalyCard } from '@/components/common/AnomalyCard';
import { AnomalyType, Role, ROLE_LABELS } from '@/types';
import { countAnomaliesByType, countPendingAnomalies } from '@/utils/filterUtils';
import { formatDate, calculateDaysBetween, calculateOverdueInfo, getToday } from '@/utils/dateUtils';

const Dashboard: React.FC = () => {
  const anomalies = useAppStore((state) => state.anomalies);
  const filterAnomalies = useAppStore((state) => state.filterAnomalies);
  const currentRole = useAppStore((state) => state.currentRole);
  const equipments = useAppStore((state) => state.equipments);
  const contracts = useAppStore((state) => state.contracts);
  const reservations = useAppStore((state) => state.reservations);
  const getEquipmentById = useAppStore((state) => state.getEquipmentById);
  const getCustomerById = useAppStore((state) => state.getCustomerById);
  const getReservationById = useAppStore((state) => state.getReservationById);

  const [selectedType, setSelectedType] = useState<AnomalyType | 'all'>('all');
  const [selectedRole, setSelectedRole] = useState<Role | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = countPendingAnomalies(anomalies);
  const overdueCount = countAnomaliesByType(anomalies, 'overdue');
  const materialCount = countAnomaliesByType(anomalies, 'material_missing');
  const reviewFailedCount = countAnomaliesByType(anomalies, 'review_failed');

  const inUseEquipments = equipments.filter((e) => e.status === 'in_use').length;
  const availableEquipments = equipments.filter((e) => e.status === 'available').length;
  const repairingEquipments = equipments.filter((e) => e.status === 'repairing').length;

  const upcomingExpiries = useMemo(() => {
    return contracts
      .filter((c) => c.status === 'active' || c.status === 'overdue')
      .map((c) => {
        const reservation = getReservationById(c.reservationId);
        if (!reservation) return null;
        const equipment = getEquipmentById(reservation.equipmentId);
        const customer = getCustomerById(reservation.customerId);
        
        const overdueInfo = calculateOverdueInfo(
          c.status,
          reservation.expectedEndDate,
          equipment?.dailyRate || 0,
          c.overdueDays,
          c.actualEndDate
        );
        
        return {
          contractId: c.id,
          contractNo: c.contractNo,
          equipmentName: equipment ? `${equipment.name} ${equipment.model}` : '',
          customerName: customer?.name || '',
          expectedEndDate: reservation.expectedEndDate,
          daysLeft: overdueInfo.daysLeft,
          isOverdue: overdueInfo.isOverdue,
          overdueDays: overdueInfo.overdueDays,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.daysLeft - b!.daysLeft)
      .slice(0, 5);
  }, [contracts, getReservationById, getEquipmentById, getCustomerById]);

  const pendingReservations = reservations.filter((r) => r.status === 'pending').length;
  const activeContracts = contracts.filter((c) => c.status === 'active' || c.status === 'overdue').length;

  const typeOptions = [
    { value: 'all' as const, label: '全部', count: anomalies.filter(a => a.status !== 'resolved').length },
    { value: 'overdue' as const, label: '超时未还', count: overdueCount },
    { value: 'material_missing' as const, label: '缺材料', count: materialCount },
    { value: 'fuel_dispute' as const, label: '油耗争议', count: countAnomaliesByType(anomalies, 'fuel_dispute') },
    { value: 'liability_dispute' as const, label: '维修责任', count: countAnomaliesByType(anomalies, 'liability_dispute') },
    { value: 'review_failed' as const, label: '复核不通过', count: reviewFailedCount },
  ];

  const roleOptions: { value: Role | 'all'; label: string; count: number }[] = [
    { value: 'all', label: '全部', count: anomalies.filter(a => a.status !== 'resolved').length },
    { value: 'manager', label: ROLE_LABELS['manager'], count: anomalies.filter(a => a.currentHandler === 'manager' && a.status !== 'resolved').length },
    { value: 'dispatcher', label: ROLE_LABELS['dispatcher'], count: anomalies.filter(a => a.currentHandler === 'dispatcher' && a.status !== 'resolved').length },
    { value: 'repairer', label: ROLE_LABELS['repairer'], count: anomalies.filter(a => a.currentHandler === 'repairer' && a.status !== 'resolved').length },
  ];

  const filteredAnomalies = useMemo(() => {
    return filterAnomalies({
      type: selectedType,
      handler: selectedRole,
      search: searchQuery,
    }).filter(a => a.status !== 'resolved');
  }, [anomalies, selectedType, selectedRole, searchQuery, filterAnomalies]);

  const myAnomalies = anomalies.filter(
    (a) => a.currentHandler === currentRole && a.status !== 'resolved'
  );

  const roleTodos = useMemo(() => {
    return [
      {
        role: 'manager' as const,
        label: ROLE_LABELS['manager'],
        todos: [
          ...anomalies.filter(a => a.currentHandler === 'manager' && a.status === 'pending').map(a => ({ id: a.id, text: a.description, type: '异常' as const })),
          ...contracts.filter(c => c.status === 'fuel_verified').map(c => ({ id: c.id, text: `合同${c.contractNo}油耗争议待处理`, type: '油耗' as const })),
        ].slice(0, 4),
      },
      {
        role: 'dispatcher' as const,
        label: ROLE_LABELS['dispatcher'],
        todos: [
          ...reservations.filter(r => r.status === 'pending').map(r => ({ id: r.id, text: `预约${r.reservationNo}材料核验`, type: '预约' as const })),
          ...reservations.filter(r => r.status === 'material_verified').map(r => ({ id: r.id, text: `预约${r.reservationNo}待派车`, type: '派车' as const })),
          ...anomalies.filter(a => a.currentHandler === 'dispatcher' && a.status === 'pending').map(a => ({ id: a.id, text: a.description, type: '异常' as const })),
        ].slice(0, 4),
      },
      {
        role: 'repairer' as const,
        label: ROLE_LABELS['repairer'],
        todos: [
          ...anomalies.filter(a => a.currentHandler === 'repairer' && a.status === 'pending').map(a => ({ id: a.id, text: a.description, type: '异常' as const })),
        ].slice(0, 4),
      },
    ];
  }, [anomalies, reservations, contracts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">异常单看板</h1>
          <p className="text-sm text-gray-500 mt-1">
            当前角色：
            <span className="font-medium text-[#1e3a5f]">
              {ROLE_LABELS[currentRole]}
            </span>
            {myAnomalies.length > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                · 您有 {myAnomalies.length} 个待处理异常
              </span>
            )}
            <span className="ml-4 text-gray-400">|</span>
            <span className="ml-4">
              待处理预约 <span className="font-bold text-orange-600 font-mono">{pendingReservations}</span>
            </span>
            <span className="mx-2">·</span>
            <span>
              在租合同 <span className="font-bold text-[#1e3a5f] font-mono">{activeContracts}</span>
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="待处理异常"
            value={pendingCount}
            bgColor="bg-yellow-500"
            textColor="text-white"
            icon={<AlertTriangle size={28} />}
          />
          <StatCard
            title="超时未还"
            value={overdueCount}
            bgColor="bg-orange-500"
            textColor="text-white"
            icon={<Clock size={28} />}
          />
          <StatCard
            title="缺材料"
            value={materialCount}
            bgColor="bg-yellow-600"
            textColor="text-white"
            icon={<FileX size={28} />}
          />
          <StatCard
            title="复核不通过"
            value={reviewFailedCount}
            bgColor="bg-rose-600"
            textColor="text-white"
            icon={<XCircle size={28} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Fuel size={18} />
                <span className="text-sm font-medium">油耗争议</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {countAnomaliesByType(anomalies, 'fuel_dispute')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <Wrench size={18} />
                <span className="text-sm font-medium">维修责任认定</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {countAnomaliesByType(anomalies, 'liability_dispute')}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">已解决</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 font-mono">
                {anomalies.filter((a) => a.status === 'resolved').length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Truck size={16} className="text-[#1e3a5f]" />
              设备状态概览
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-green-50 rounded border border-green-100">
                <p className="text-2xl font-bold text-green-600 font-mono">{availableEquipments}</p>
                <p className="text-xs text-gray-500 mt-1">空闲可租</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
                <p className="text-2xl font-bold text-blue-600 font-mono">{inUseEquipments}</p>
                <p className="text-xs text-gray-500 mt-1">在租中</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded border border-orange-100">
                <p className="text-2xl font-bold text-orange-600 font-mono">{repairingEquipments}</p>
                <p className="text-xs text-gray-500 mt-1">维修中</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-orange-500" />
              租期到期提醒（按到期时间排序）
            </h3>
            {upcomingExpiries.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无在租合同</p>
            ) : (
              <div className="space-y-2">
                {upcomingExpiries.map((item) => {
                  if (!item) return null;
                  return (
                    <Link
                      key={item.contractId}
                      to={`/contract/${item.contractId}`}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        item.isOverdue
                          ? 'bg-red-50 border-red-200 hover:bg-red-100'
                          : item.daysLeft <= 2
                          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-bold text-[#1e3a5f]">{item.contractNo}</span>
                          {item.isOverdue ? (
                            <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded animate-pulse">
                              已超期
                            </span>
                          ) : item.daysLeft <= 2 ? (
                            <span className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded">
                              即将到期
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {item.equipmentName} · {item.customerName}
                        </p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className={`text-lg font-bold font-mono ${
                          item.isOverdue ? 'text-red-600' : item.daysLeft <= 2 ? 'text-orange-600' : 'text-gray-700'
                        }`}>
                          {item.isOverdue ? `${Math.abs(item.daysLeft)}天` : `${item.daysLeft}天`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(item.expectedEndDate)}到期
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {roleTodos.map((rt) => (
              <div
                key={rt.role}
                className={`bg-white rounded-lg border p-4 ${
                  currentRole === rt.role ? 'border-[#1e3a5f] ring-1 ring-[#1e3a5f]/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${
                    currentRole === rt.role ? 'text-[#1e3a5f]' : 'text-gray-800'
                  }`}>
                    <User size={16} />
                    {rt.label}待办
                  </h3>
                  {rt.todos.length > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">
                      {rt.todos.length}
                    </span>
                  )}
                </div>
                {rt.todos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">暂无待办</p>
                ) : (
                  <ul className="space-y-2">
                    {rt.todos.map((todo) => (
                      <li key={todo.id} className="text-xs text-gray-600 flex items-start gap-2">
                        <ChevronRight size={12} className={`flex-shrink-0 mt-0.5 ${
                          currentRole === rt.role ? 'text-[#1e3a5f]' : 'text-gray-400'
                        }`} />
                        <span className="line-clamp-2">{todo.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <FilterTabs
          types={typeOptions}
          roles={roleOptions}
          selectedType={selectedType}
          selectedRole={selectedRole}
          searchQuery={searchQuery}
          onTypeChange={setSelectedType}
          onRoleChange={setSelectedRole}
          onSearchChange={setSearchQuery}
        />

        <div className="space-y-4">
          {filteredAnomalies.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">暂无符合条件的异常单</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">
                  共 {filteredAnomalies.length} 条记录，按卡顿时间排序
                </p>
              </div>
              {filteredAnomalies.map((anomaly) => (
                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
