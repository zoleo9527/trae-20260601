import { Link } from '@remix-run/react';
import type { Vehicle, User } from '~/types';
import { formatDateShort, formatMoney, getStatusLabel, getStatusColor } from '~/utils/formatters';

interface VehicleCardProps {
  vehicle: Vehicle;
  manager?: User;
  taskCount?: number;
  completedTasks?: number;
  totalCost?: number;
}

export default function VehicleCard({ vehicle, manager, taskCount = 0, completedTasks = 0, totalCost = 0 }: VehicleCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">{vehicle.licensePlate}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {getStatusLabel(vehicle.status)}
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mt-1">{vehicle.brand} {vehicle.model}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{formatMoney(vehicle.estimatedValue)}</div>
            <div className="text-sm text-gray-500">预估价值</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-sm">
            <span className="text-gray-500">年份:</span>
            <span className="ml-2 text-gray-900">{vehicle.year}年</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">里程:</span>
            <span className="ml-2 text-gray-900">{(vehicle.mileage / 10000).toFixed(1)}万公里</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">颜色:</span>
            <span className="ml-2 text-gray-900">{vehicle.color}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">收车价:</span>
            <span className="ml-2 text-gray-900">{formatMoney(vehicle.purchasePrice)}</span>
          </div>
        </div>

        {taskCount > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">整备进度</span>
              <span className="font-medium text-gray-900">{completedTasks}/{taskCount} 任务</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${(completedTasks / taskCount) * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">预估费用: {formatMoney(totalCost)}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            <span>收车经理: {manager?.name || '未知'}</span>
            <span className="mx-2">|</span>
            <span>入库: {formatDateShort(new Date(vehicle.createdAt))}</span>
          </div>
          <Link 
            to={`/vehicles/${vehicle.id}`} 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            查看详情
          </Link>
        </div>
      </div>
    </div>
  );
}
