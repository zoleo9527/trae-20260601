import { useState } from 'react';
import { useFarmStore } from '@/store';
import { Search, Calendar, Download, History, Stethoscope, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RecentChangeRecord {
  id: number;
  type: 'veterinary' | 'quarantine' | 'exception';
  status?: string;
  cattleId?: number;
  vetRecordId?: number;
  quarantineId?: number;
  symptoms?: string;
  diagnosis?: string;
  reason?: string;
  description?: string;
  vetName?: string;
  operator?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function Traceability() {
  const store = useFarmStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'veterinary' | 'quarantine' | 'exception'>('all');
  const [selectedCattle, setSelectedCattle] = useState<number | null>(null);

  const allRecords: RecentChangeRecord[] = [
    ...store.veterinaryRecords.map(r => ({ ...r, type: 'veterinary' as const })),
    ...store.quarantineRecords.map(r => ({ ...r, type: 'quarantine' as const })),
    ...store.exceptionRecords.map(r => ({ ...r, type: 'exception' as const })),
  ];

  const filteredRecords = allRecords.filter(record => {
    const matchesKeyword = searchKeyword === '' || 
      record.type === 'veterinary' && (record.symptoms?.includes(searchKeyword) || record.diagnosis?.includes(searchKeyword)) ||
      record.type === 'quarantine' && record.reason?.includes(searchKeyword) ||
      record.type === 'exception' && record.description?.includes(searchKeyword);
    const matchesType = selectedType === 'all' || record.type === selectedType;
    const matchesCattle = selectedCattle === null || record.cattleId === selectedCattle;
    return matchesKeyword && matchesType && matchesCattle;
  });

  const sortedRecords = filteredRecords.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'veterinary': return Stethoscope;
      case 'quarantine': return ShieldCheck;
      case 'exception': return AlertTriangle;
      default: return History;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'veterinary': return '兽医巡诊';
      case 'quarantine': return '隔离管理';
      case 'exception': return '异常记录';
      default: return '未知';
    }
  };

  const getStatusLabel = (type: string, status?: string) => {
    if (!status) return '';
    const statusMap: Record<string, Record<string, string>> = {
      veterinary: { pending: '待处理', processing: '处理中', completed: '已完成', rejected: '已驳回' },
      quarantine: { pending: '待审核', quarantining: '隔离中', completed: '已解除', rejected: '已驳回' },
      exception: { reject: '驳回', warning: '警告', info: '信息' },
    };
    return statusMap[type]?.[status] || status;
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">数据追溯</h2>
          <p className="text-sm text-gray-500 mt-1">查看完整的操作历史和状态变更记录</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-pasture-500 text-white rounded-lg hover:bg-pasture-600 transition-colors">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索症状、诊断、原因..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
            />
          </div>
          
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
          >
            <option value="all">全部类型</option>
            <option value="veterinary">兽医巡诊</option>
            <option value="quarantine">隔离管理</option>
            <option value="exception">异常记录</option>
          </select>

          <select
            value={selectedCattle || ''}
            onChange={(e) => setSelectedCattle(e.target.value ? Number(e.target.value) : null)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pasture-500"
          >
            <option value="">全部牛只</option>
            {store.cattle.map(cattle => (
              <option key={cattle.id} value={cattle.id}>{cattle.tagId} {cattle.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="divide-y divide-gray-100">
            {sortedRecords.map((record) => {
              const Icon = getIcon(record.type);
              const cattle = record.cattleId !== undefined ? store.getCattleById(record.cattleId) : undefined;
              
              return (
                <div key={`${record.type}-${record.id}`} className="relative pl-16 pr-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className={`absolute left-4 w-8 h-8 rounded-full flex items-center justify-center ${
                    record.type === 'veterinary' ? 'bg-pasture-100' :
                    record.type === 'quarantine' ? 'bg-orange-100' : 'bg-yellow-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      record.type === 'veterinary' ? 'text-pasture-600' :
                      record.type === 'quarantine' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.type === 'veterinary' ? 'bg-pasture-100 text-pasture-700' :
                          record.type === 'quarantine' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {getTypeLabel(record.type)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">#{record.id}</span>
                        {record.status && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'completed' || record.status === 'quarantining' ? 'bg-green-100 text-green-700' :
                            record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            record.status === 'rejected' || record.type === 'exception' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getStatusLabel(record.type, record.status)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        {record.type === 'veterinary' && record.symptoms}
                        {record.type === 'quarantine' && record.reason}
                        {record.type === 'exception' && record.description}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {cattle && (
                          <span>{cattle.tagId} {cattle.name}</span>
                        )}
                        {record.vetName && record.type === 'veterinary' && (
                          <span>兽医: {record.vetName}</span>
                        )}
                        {record.operator && (
                          <span>操作人: {record.operator}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {record.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {sortedRecords.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>暂无记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
