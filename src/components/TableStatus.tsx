import React from 'react';
import { Table, Users, MapPin } from 'lucide-react';
import { Table as TableType } from '../types';

interface TableStatusProps {
  tables: TableType[];
  onTableClick: (table: TableType) => void;
}

const statusConfig: Record<TableType['status'], { label: string; color: string; bgColor: string; borderColor: string }> = {
  available: { label: '空闲', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-300' },
  occupied: { label: '在用', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-300' },
  reserved: { label: '已预订', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300' },
  cleaning: { label: '清洁中', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
};

export const TableStatus: React.FC<TableStatusProps> = ({ tables, onTableClick }) => {
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const reservedCount = tables.filter((t) => t.status === 'reserved').length;
  const cleaningCount = tables.filter((t) => t.status === 'cleaning').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">桌台状态</h2>
            <p className="text-sm text-gray-500">实时桌台使用情况</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-xs text-gray-500">{availableCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-xs text-gray-500">{occupiedCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-xs text-gray-500">{reservedCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-xs text-gray-500">{cleaningCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => onTableClick(table)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${statusConfig[table.status].bgColor} ${statusConfig[table.status].borderColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-800 text-lg">{table.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full bg-white ${statusConfig[table.status].color}`}>
                  {statusConfig[table.status].label}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{table.capacity}人桌</span>
              </div>
              {table.position && (
                <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{table.position}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>空闲</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>在用</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span>已预订</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>清洁中</span>
          </div>
        </div>
      </div>
    </div>
  );
};
