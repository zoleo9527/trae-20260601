import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ShiftList from '@/components/ShiftList';
import { useShiftStore } from '@/store/shiftStore';
import { mockDiscrepancySummaries } from '@/data/mockData';

export default function Dashboard() {
  const { shifts } = useShiftStore();

  const pendingShifts = shifts.filter((s) => s.status === 'pending').length;
  const reviewingShifts = shifts.filter((s) => s.status === 'reviewing').length;
  const confirmedShifts = shifts.filter((s) => s.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">班结工作台</h2>
        <p className="text-gray-500 mt-1">管理和复核加油站班结差异，确保交接班数据准确</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">待复核</p>
              <p className="text-3xl font-bold mt-1">{pendingShifts}</p>
              <p className="text-amber-100 text-sm mt-1">个班结等待处理</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">复核中</p>
              <p className="text-3xl font-bold mt-1">{reviewingShifts}</p>
              <p className="text-blue-100 text-sm mt-1">个班结正在复核</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">已确认</p>
              <p className="text-3xl font-bold mt-1">{confirmedShifts}</p>
              <p className="text-emerald-100 text-sm mt-1">个班结已完成</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">差异分类统计</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {mockDiscrepancySummaries.map((summary) => (
            <StatCard key={summary.type} summary={summary} />
          ))}
        </div>
      </div>

      <ShiftList shifts={shifts} />
    </div>
  );
}
