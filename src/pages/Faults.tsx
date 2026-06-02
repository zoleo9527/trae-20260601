
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Fault } from '../../shared/types';

export function Faults() {
  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFaults = async () => {
      try {
        const params = statusFilter ? { status: statusFilter } : undefined;
        const data = await api.faults.list(params);
        setFaults(data);
      } catch (error) {
        console.error('Failed to fetch faults:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaults();
  }, [statusFilter]);

  const filteredFaults = faults.filter(
    (fault) =>
      fault.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.deviceName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索站点或设备..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态：</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>
      </div>

      {/* 故障列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">故障设备</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属站点</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">严重程度</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">检测时间</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredFaults.map((fault) => (
              <tr key={fault.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-medium text-gray-900">{fault.deviceName}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-600">{fault.stationName}</td>
                <td className="px-5 py-4 text-gray-600">
                  {fault.type === 'offline' && '设备离线'}
                  {fault.type === 'interrupt' && '充电中断'}
                  {fault.type === 'hardware' && '硬件故障'}
                  {fault.type === 'network' && '网络故障'}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge type="faultSeverity" status={fault.severity} />
                </td>
                <td className="px-5 py-4">
                  <StatusBadge type="fault" status={fault.status} />
                </td>
                <td className="px-5 py-4 text-gray-600">
                  {new Date(fault.detectedAt).toLocaleString('zh-CN')}
                </td>
                <td className="px-5 py-4">
                  <button
                    onClick={() => navigate(`/faults/${fault.id}`)}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    查看详情
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
