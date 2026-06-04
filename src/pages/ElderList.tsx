import { Link } from 'react-router-dom';
import { User, Bed, Heart, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../utils/cn';

const healthStatusConfig = {
  good: { label: '良好', className: 'bg-green-100 text-green-700' },
  fair: { label: '一般', className: 'bg-yellow-100 text-yellow-700' },
  poor: { label: '较差', className: 'bg-orange-100 text-orange-700' },
  critical: { label: '危重', className: 'bg-red-100 text-red-700' },
};

export function ElderList() {
  const { elders, beds, users } = useStore();

  const getBedInfo = (bedId: string) => {
    const bed = beds.find(b => b.id === bedId);
    return bed ? `${bed.floor} ${bed.roomNumber} ${bed.bedNumber}` : '-';
  };

  const getNurseName = (nurseId: string) => {
    const nurse = users.find(u => u.id === nurseId);
    return nurse?.name || '-';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">老人信息</h1>
        <p className="mt-1 text-gray-500">查看在院老人基本信息</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {elders.map(elder => {
          const health = healthStatusConfig[elder.healthStatus];
          return (
            <Link
              key={elder.id}
              to={`/elders/${elder.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-12 w-12 rounded-full flex items-center justify-center',
                      elder.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100'
                    )}>
                      <User className={cn(
                        'h-6 w-6',
                        elder.gender === 'male' ? 'text-blue-600' : 'text-pink-600'
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{elder.name}</p>
                      <p className="text-sm text-gray-500">{elder.age}岁</p>
                    </div>
                  </div>
                  <span className={cn('badge', health.className)}>
                    <Heart className="h-3 w-3 mr-1" />
                    {health.label}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Bed className="h-4 w-4 text-gray-400" />
                    <span>床位：{getBedInfo(elder.bedId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>责任护工：{getNurseName(elder.primaryNurseId)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>入住：{elder.checkInDate}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
