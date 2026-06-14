import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Calendar, User, ChevronRight, MessageSquare, Clock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { useCommunicationStore, useUserStore } from '../store';
import { fetchCommunications, addCommunicationHistory, updateCommunicationStatus } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CommunicationQuickActions } from '../components/CommunicationQuickActions';
import type { Communication, CommunicationFilter } from '../types';

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'ongoing', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

const priorityOptions = [
  { value: '', label: '全部优先级' },
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' },
];

const exceptionReasonLabels: Record<string, string> = {
  no_response: '家长未回应',
  refuse: '拒绝沟通',
  schedule_conflict: '时间冲突',
  emergency: '紧急情况',
  other: '其他',
};

export function CommunicationsList() {
  const { communications, setCommunications, filter, setFilter, updateCommunication } = useCommunicationStore();
  const { currentRole } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status') as CommunicationFilter['status'];
    const priority = searchParams.get('priority') as CommunicationFilter['priority'];
    if (status || priority) {
      setFilter({ status, priority });
    }
  }, [searchParams, setFilter]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchCommunications(filter);
      setCommunications(data);
      setLoading(false);
    }
    loadData();
  }, [filter, setCommunications]);

  const filteredCommunications = useMemo(() => {
    let filtered = communications.filter(c => 
      c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (currentRole !== 'admin') {
      filtered = filtered.filter(c => c.responsibleRole === currentRole);
    }
    
    filtered.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return timeB - timeA;
    });
    
    return filtered;
  }, [communications, searchTerm, currentRole]);

  const handleStatusChange = (status: string) => {
    setFilter({ ...filter, status: status ? status as Communication['status'] : undefined });
  };

  const handlePriorityChange = (priority: string) => {
    setFilter({ ...filter, priority: priority ? priority as Communication['priority'] : undefined });
  };

  const handleQuickAction = async (action: string, communication: Communication, result?: string) => {
    if (action === 'complete') {
      const response = await updateCommunicationStatus(communication.id, 'completed', result);
      updateCommunication(response.communication);
    } else {
      const typeMap: Record<string, 'call' | 'message' | 'meeting'> = {
        call: 'call',
        message: 'message',
        meeting: 'meeting',
      };
      const type = typeMap[action];
      if (type) {
        const actionLabels: Record<string, string> = {
          call: '电话沟通',
          message: '消息沟通',
          meeting: '面谈沟通',
        };
        const response = await addCommunicationHistory(communication.id, type, `${actionLabels[action]} - 已${action === 'call' ? '拨打' : action === 'message' ? '发送' : '预约'}`);
        updateCommunication(response.communication);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">家长沟通</h1>
          <p className="text-gray-500 mt-1">管理与家长的沟通任务</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学员或主题..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">筛选:</span>
            <select
              value={filter.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={filter.priority || ''}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            共 {filteredCommunications.length} 条记录
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 py-4">
                  <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-40 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : filteredCommunications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">暂无匹配的沟通记录</p>
            </div>
          ) : (
            filteredCommunications.map(communication => (
              <div
                key={communication.id}
                className={`px-6 py-4 transition-colors flex items-center gap-4 group ${
                  communication.status === 'completed' 
                    ? 'bg-green-50 hover:bg-green-100' 
                    : communication.exceptionReason 
                    ? 'bg-red-50 hover:bg-red-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Link
                  to={`/communications/${communication.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="relative">
                    <img
                      src={communication.studentAvatar}
                      alt={communication.studentName}
                      className="w-14 h-14 rounded-full bg-gray-100"
                    />
                    {communication.status === 'completed' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {communication.exceptionReason && communication.status !== 'completed' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{communication.studentName}</span>
                      <PriorityBadge priority={communication.priority} />
                      {communication.status === 'completed' && (
                        <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                          已完成
                        </span>
                      )}
                      {communication.exceptionReason && communication.status !== 'completed' && (
                        <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          异常
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{communication.subject}</p>
                    
                    {communication.result && (
                      <div className="mt-2 p-2 bg-green-100 rounded-lg border border-green-200">
                        <p className="text-xs text-green-800 line-clamp-2">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          {communication.result}
                        </p>
                      </div>
                    )}
                    
                    {communication.exceptionReason && !communication.result && (
                      <div className="mt-2 p-2 bg-red-100 rounded-lg border border-red-200">
                        <p className="text-xs text-red-800">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          {exceptionReasonLabels[communication.exceptionReason]}: {communication.exceptionDescription}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {communication.responsibleName}
                      </span>
                      {communication.lastContactAt && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          最后联系: {communication.lastContactAt}
                        </span>
                      )}
                      {communication.nextFollowUpAt && communication.status !== 'completed' && (
                        <span className="text-xs text-amber-600 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          下次跟进: {communication.nextFollowUpAt}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        更新于 {communication.updatedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={communication.status} type="communication" />
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                </Link>
                <CommunicationQuickActions communication={communication} onAction={handleQuickAction} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}