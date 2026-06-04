import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { getRelativeTime } from '../utils/date';
import type { CommunicationStatus } from '../types';
import { cn } from '../utils/cn';
import { hasPermission } from '../utils/permissions';

const statusFilters: { value: CommunicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '处理中' },
  { value: 'stuck', label: '异常卡住' },
  { value: 'escalated', label: '已升级' },
  { value: 'completed', label: '已完成' },
];

const typeLabels: Record<string, string> = {
  wechat: '微信',
  phone: '电话',
  on_site: '现场',
  video: '视频',
  letter: '信件',
};

export function CommunicationList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser, getCommunicationsByCurrentUser, elders, familyMembers, users } = useStore();

  const filter = searchParams.get('filter') || 'all';

  let communications = getCommunicationsByCurrentUser();

  if (filter !== 'all') {
    communications = communications.filter(c => c.status === filter);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    communications = communications.filter(c => {
      const elder = elders.find(e => e.id === c.elderId);
      const family = familyMembers.find(f => f.id === c.familyMemberId);
      const assignedTo = users.find(u => u.id === c.assignedTo);
      return (
        c.title.toLowerCase().includes(query) ||
        c.content.toLowerCase().includes(query) ||
        c.requestId.toLowerCase().includes(query) ||
        elder?.name.toLowerCase().includes(query) ||
        family?.name.toLowerCase().includes(query) ||
        assignedTo?.name.toLowerCase().includes(query)
      );
    });
  }

  const getElderName = (elderId: string) => {
    const elder = elders.find(e => e.id === elderId);
    return elder?.name || '未知';
  };

  const getAssigneeName = (userId?: string) => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user?.name || '未知';
  };

  const canCreate = currentUser && hasPermission(currentUser.role, 'canCreateCommunication');

  const stuckComms = communications.filter(c => c.status === 'stuck' || c.status === 'escalated');
  const normalComms = communications.filter(c => c.status !== 'stuck' && c.status !== 'escalated');
  const sortedComms = [...stuckComms, ...normalComms];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家属沟通管理</h1>
          <p className="mt-1 text-gray-500">管理所有家属沟通记录</p>
        </div>
        {canCreate && (
          <Link to="/communications/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新建沟通
          </Link>
        )}
      </div>

      {stuckComms.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            发现 {stuckComms.length} 条异常/升级的沟通记录，需要立即处理！
          </div>
          <p className="text-sm text-red-600">
            超时未处理或已升级的沟通记录，请优先跟进
          </p>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索标题、内容、老人姓名、处理人..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(item => (
                  <button
                    key={item.value}
                    onClick={() => setSearchParams({ filter: item.value })}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      filter === item.value
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedComms.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无数据
          </div>
        ) : (
          sortedComms.map(comm => (
            <Link
              key={comm.id}
              to={`/communications/${comm.id}`}
              className={cn(
                'card hover:shadow-md transition-shadow',
                (comm.status === 'stuck' || comm.status === 'escalated') && 'border-red-300 bg-red-50'
              )}
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{comm.requestId}</span>
                    <StatusBadge status={comm.status} type="communication" />
                  </div>
                  <PriorityBadge priority={comm.priority} />
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{comm.title}</h3>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{comm.content}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <User className="h-4 w-4" />
                    <span>{getElderName(comm.elderId)}</span>
                    <span className="text-gray-300">·</span>
                    <MessageSquare className="h-4 w-4" />
                    <span>{typeLabels[comm.type] || comm.type}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-gray-500">
                    <span>处理人：{getAssigneeName(comm.assignedTo)}</span>
                    <span>{getRelativeTime(comm.createdAt)}</span>
                  </div>
                </div>

                {comm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {comm.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {(comm.status === 'stuck' || comm.status === 'escalated') && (
                  <div className="mt-3 flex items-center gap-1 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">需要立即处理</span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
