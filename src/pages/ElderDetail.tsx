import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Bed, Heart, Calendar, Phone, MessageSquare, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate } from '../utils/date';

export function ElderDetail() {
  const { id } = useParams<{ id: string }>();
  const { elders, beds, users, familyMembers, getVisitsByElderId, getCommunicationsByElderId } = useStore();

  const elder = elders.find(e => e.id === id);
  const bed = beds.find(b => b.id === elder?.bedId);
  const primaryNurse = users.find(u => u.id === elder?.primaryNurseId);
  const families = familyMembers.filter(f => f.elderId === id);
  const visits = getVisitsByElderId(id || '');
  const communications = getCommunicationsByElderId(id || '');

  if (!elder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700">老人信息不存在</h2>
        <Link to="/elders" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
          返回列表
        </Link>
      </div>
    );
  }

  const healthStatusConfig = {
    good: { label: '良好', className: 'bg-green-100 text-green-700' },
    fair: { label: '一般', className: 'bg-yellow-100 text-yellow-700' },
    poor: { label: '较差', className: 'bg-orange-100 text-orange-700' },
    critical: { label: '危重', className: 'bg-red-100 text-red-700' },
  };

  const health = healthStatusConfig[elder.healthStatus];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/elders" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{elder.name}</h1>
          <p className="text-gray-500">{elder.age}岁 / {elder.gender === 'male' ? '男' : '女'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="label">身份证号</label>
                    <p className="text-gray-900 font-mono">{elder.idCard}</p>
                  </div>
                  <div>
                    <label className="label">健康状态</label>
                    <span className={`badge ${health.className}`}>
                      <Heart className="h-3 w-3 mr-1" />
                      {health.label}
                    </span>
                  </div>
                  <div>
                    <label className="label">入住日期</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {elder.checkInDate}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">床位信息</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Bed className="h-4 w-4 text-gray-400" />
                      {bed?.floor} {bed?.roomNumber} {bed?.bedNumber}
                    </p>
                  </div>
                  <div>
                    <label className="label">责任护工</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {primaryNurse?.name || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                探视记录
              </h2>
              <Link to="/visits" className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </Link>
            </div>
            <div className="card-body">
              {visits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无探视记录</p>
              ) : (
                <div className="space-y-3">
                  {visits.slice(0, 5).map(visit => (
                    <Link
                      key={visit.id}
                      to={`/visits/${visit.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{visit.visitorName}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(visit.requestedDate)} {visit.requestedTimeSlot}
                        </p>
                      </div>
                      <StatusBadge status={visit.status} type="visit" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                沟通记录
              </h2>
              <Link to="/communications" className="text-sm text-primary-600 hover:text-primary-700">
                查看全部
              </Link>
            </div>
            <div className="card-body">
              {communications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无沟通记录</p>
              ) : (
                <div className="space-y-3">
                  {communications.slice(0, 5).map(comm => (
                    <Link
                      key={comm.id}
                      to={`/communications/${comm.id}`}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{comm.title}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{comm.content}</p>
                      </div>
                      <StatusBadge status={comm.status} type="communication" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">家属信息</h2>
            </div>
            <div className="card-body space-y-4">
              {families.length === 0 ? (
                <p className="text-gray-500 text-sm">暂无家属信息</p>
              ) : (
                families.map(family => (
                  <div key={family.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{family.name}</p>
                        <p className="text-sm text-gray-500">{family.relationship}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{family.phone}</span>
                    </div>
                    {family.wechatId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span>微信：{family.wechatId}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                快捷操作
              </h2>
            </div>
            <div className="card-body space-y-2">
              <Link to="/visits/new" className="btn btn-primary w-full text-center block">
                预约探视
              </Link>
              <Link to="/communications/new" className="btn btn-secondary w-full text-center block">
                记录沟通
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
