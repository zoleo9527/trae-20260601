
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Zap, Users, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Station } from '../../shared/types';

export function Stations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await api.stations.list(statusFilter ? { status: statusFilter } : undefined);
        setStations(data);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [statusFilter]);

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address.toLowerCase().includes(searchTerm.toLowerCase())
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
              placeholder="搜索站点名称或地址..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态筛选：</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="normal">正常</option>
              <option value="warning">告警</option>
              <option value="offline">离线</option>
            </select>
          </div>
        </div>
      </div>

      {/* 站点列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => (
          <div
            key={station.id}
            onClick={() => navigate(`/stations/${station.id}`)}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{station.name}</h3>
                  <StatusBadge type="station" status={station.status} />
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{station.address}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-500 mb-1">
                  <Zap className="w-4 h-4 mr-1" />
                  <span className="text-xs">设备</span>
                </div>
                <p className="font-semibold text-gray-900">
                  {station.onlineCount}/{station.deviceCount}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-500 mb-1">
                  <Users className="w-4 h-4 mr-1" />
                  <span className="text-xs">合作方</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{station.partnerName}</p>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500 mb-1">分账比例</div>
                <p className="font-semibold text-gray-900">{(station.splitRatio * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
