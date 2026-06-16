import { useState, useEffect } from 'react';
import { FileText, Clock, User, MapPin, Tag } from 'lucide-react';
import type { OperationLog } from '@/types';
import { operationLogApi } from '@/api';

export default function OperationLogs() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const data = await operationLogApi.list();
    setLogs(data);
    setLoading(false);
  };

  const getTypeLabel = (type: string) => {
    return type === 'out_of_stock' ? '售罄处理' : '临时补货';
  };

  const getTypeColor = (type: string) => {
    return type === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">操作日志</h2>
        <p className="text-sm text-gray-500">记录系统所有操作，支持追溯和审计</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">暂无操作日志</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                        <Tag className="w-3 h-3 mr-1" />
                        {getTypeLabel(log.type)}
                      </span>
                      <span className="text-lg font-semibold text-gray-800">{log.action}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{log.detail}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{log.operator_name} ({log.operator_role})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{log.region} - {log.store_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{log.operation_time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${log.type === 'out_of_stock' ? 'bg-red-100' : 'bg-blue-100'}`}>
                      <FileText className={`w-6 h-6 ${log.type === 'out_of_stock' ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
