import { useStore } from '@/store';
import { Link } from 'react-router-dom';
import {
  PawPrint,
  Stethoscope,
  Bell,
  ChevronRight,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
  const { animals, getTodayTasks, medicalRecords } = useStore();
  const tasks = getTodayTasks();

  const stats = [
    {
      label: '救助总数',
      value: animals.length,
      icon: PawPrint,
      color: 'bg-blue-500',
    },
    {
      label: '治疗中',
      value: animals.filter((a) => a.status === 'TREATING').length,
      icon: Stethoscope,
      color: 'bg-red-500',
    },
    {
      label: '待领养',
      value: animals.filter((a) => a.status === 'READY_FOR_ADOPTION').length,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: '今日回访',
      value: tasks.followUpsDue.length,
      icon: Bell,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">
          今天是 {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
        </h2>
        <p className="text-blue-100">
          今日有 {tasks.pendingRescue.length + tasks.pendingMedical.length + tasks.followUpsDue.length} 项待处理事务，加油！
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Rescue */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              <h3 className="font-semibold text-gray-900">待处理救助登记</h3>
              {tasks.pendingRescue.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                  {tasks.pendingRescue.length}
                </span>
              )}
            </div>
            <Link
              to="/rescue"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.pendingRescue.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                <p>暂无待处理救助</p>
              </div>
            ) : (
              tasks.pendingRescue.slice(0, 3).map((animal) => (
                <Link
                  key={animal.id}
                  to={`/rescue/${animal.id}`}
                  className="p-4 hover:bg-gray-50 block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{animal.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {animal.species} · {animal.breed} · 发现于 {animal.foundLocation.slice(0, 10)}...
                      </p>
                    </div>
                    <StatusBadge status={animal.status} type="rescue" />
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link
              to="/rescue/create"
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              新建救助登记
            </Link>
          </div>
        </div>

        {/* Pending Medical */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope size={18} className="text-red-500" />
              <h3 className="font-semibold text-gray-900">待医疗评估</h3>
              {tasks.pendingMedical.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  {tasks.pendingMedical.length}
                </span>
              )}
            </div>
            <Link
              to="/medical"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.pendingMedical.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                <p>所有动物已评估</p>
              </div>
            ) : (
              tasks.pendingMedical.slice(0, 3).map((animal) => (
                <Link
                  key={animal.id}
                  to={`/medical/${animal.id}`}
                  className="p-4 hover:bg-gray-50 block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{animal.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {animal.species} · {animal.age} · 当前位置: {animal.currentLocation.slice(0, 8)}...
                      </p>
                    </div>
                    <StatusBadge status={animal.medicalStatus} type="medical" />
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100">
            <Link
              to="/medical"
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Stethoscope size={18} />
              进入医疗评估
            </Link>
          </div>
        </div>

        {/* Follow-ups Due */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-500" />
              <h3 className="font-semibold text-gray-900">今日回访任务</h3>
              {tasks.followUpsDue.length > 0 && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                  {tasks.followUpsDue.length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {tasks.followUpsDue.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                <p>今日无回访任务</p>
              </div>
            ) : (
              tasks.followUpsDue.slice(0, 3).map((fu) => {
                const animal = animals.find((a) => a.id === fu.animalId);
                return (
                  <Link
                    key={fu.id}
                    to={`/rescue/${fu.animalId}`}
                    className="p-4 hover:bg-gray-50 block"
                  >
                    <div className="flex items-start gap-3">
                      <Clock size={16} className="text-purple-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{animal?.name || '未知动物'}</p>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{fu.content}</p>
                        <p className="text-xs text-gray-400 mt-1">负责人: {fu.operator}</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">最近医疗记录</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {medicalRecords.slice(0, 5).map((record) => {
            const animal = animals.find((a) => a.id === record.animalId);
            return (
              <Link
                key={record.id}
                to={`/medical/${record.animalId}`}
                className="p-4 hover:bg-gray-50 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Stethoscope size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {animal?.name || '未知'} - {record.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.date} · {record.veterinarian}
                    </p>
                  </div>
                </div>
                {record.cost && (
                  <span className="text-sm font-medium text-gray-700">¥{record.cost}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
