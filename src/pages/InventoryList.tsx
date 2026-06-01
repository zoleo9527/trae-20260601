import React from 'react';
import {
  Calendar,
  Sparkles,
  CheckSquare,
  DollarSign,
  CheckCircle,
  Eye,
  Building,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StatusCard } from '../components/StatusCard';
import { StatusBadge } from '../components/StatusBadge';
import { Room, StatusFilter, RoomStatus } from '../types/inventory';

interface InventoryListProps {
  onViewDetail: (room: Room) => void;
}

const filterConfigs: { status: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { status: 'ALL', label: '全部房源', icon: <Building className="w-5 h-5" /> },
  { status: 'CHECKED_OUT_TODAY', label: '今日退房', icon: <Calendar className="w-5 h-5" /> },
  { status: 'PENDING_CLEANING', label: '待保洁', icon: <Sparkles className="w-5 h-5" /> },
  { status: 'PENDING_REINSPECTION', label: '待复检', icon: <CheckSquare className="w-5 h-5" /> },
  { status: 'DEPOSIT_PENDING', label: '押金待确认', icon: <DollarSign className="w-5 h-5" /> },
  { status: 'COMPLETED', label: '已完成', icon: <CheckCircle className="w-5 h-5" /> },
];

export const InventoryList: React.FC<InventoryListProps> = ({ onViewDetail }) => {
  const { statusFilter, setStatusFilter, getFilteredRooms, getStatusCounts } = useInventory();
  const filteredRooms = getFilteredRooms();
  const statusCounts = getStatusCounts();

  const getTotalCount = () => {
    return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">退房验房管理</h2>
        <div className="text-[11px] text-gray-500">
          更新时间: {new Date().toLocaleString('zh-CN')}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {filterConfigs.map((config) => (
          <StatusCard
            key={config.status}
            status={config.status}
            label={config.label}
            count={config.status === 'ALL' ? getTotalCount() : statusCounts[config.status as RoomStatus]}
            isActive={statusFilter === config.status}
            onClick={() => setStatusFilter(config.status)}
            icon={config.icon}
          />
        ))}
      </div>

      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  房号
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  客人信息
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  入住
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  退房
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  押金
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  问题
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  状态
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 text-[11px] uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRooms.map((room, index) => (
                <tr
                  key={room.id}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50 transition-colors`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800">
                      {room.building} {room.roomNumber}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-gray-800">{room.guestName}</div>
                    <div className="text-[11px] text-gray-500">{room.guestPhone}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{room.checkInDate}</td>
                  <td className="px-3 py-2 text-gray-600">{room.checkOutDate}</td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-800">¥{room.depositAmount}</span>
                  </td>
                  <td className="px-3 py-2">
                    {room.issues.length > 0 ? (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded-sm ${
                          room.issues.length >= 2
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {room.issues.length} 项
                      </span>
                    ) : (
                      <span className="text-gray-400 text-[11px]">无</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={room.status} />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onViewDetail(room)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50 rounded-sm transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRooms.length === 0 && (
          <div className="py-8 text-center text-gray-400 text-sm">
            暂无符合条件的房源
          </div>
        )}
      </div>
    </div>
  );
};
