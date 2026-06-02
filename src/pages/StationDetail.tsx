
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Zap, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';
import type { Station, Device, Fault } from '../../shared/types';

export function StationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<Station | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [stationData, devicesData, faultsData] = await Promise.all([
          api.stations.get(id),
          api.stations.devices(id),
          api.faults.list(),
        ]);
        setStation(stationData);
        setDevices(devicesData);
        setFaults(faultsData.filter((f) => f.stationId === id));
      } catch (error) {
        console.error('Failed to fetch station data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!station) {
    return <div>站点不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/stations')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回站点列表
        </button>
      </div>

      {/* 站点信息 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{station.name}</h1>
              <StatusBadge type="station" status={station.status} />
            </div>
            <div className="flex items-center text-gray-500 mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              {station.address}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">合作方：{station.partnerName}</p>
            <p className="text-sm text-gray-500">分账比例：{(station.splitRatio * 100).toFixed(0)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{station.deviceCount}</p>
            <p className="text-sm text-gray-500 mt-1">设备总数</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{station.onlineCount}</p>
            <p className="text-sm text-gray-500 mt-1">在线设备</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {station.deviceCount - station.onlineCount}
            </p>
            <p className="text-sm text-gray-500 mt-1">离线设备</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{faults.filter((f) => f.status !== 'resolved' && f.status !== 'closed').length}</p>
            <p className="text-sm text-gray-500 mt-1">活跃故障</p>
          </div>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            设备列表
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">设备名称</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">型号</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">功率</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后在线</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{device.name}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{device.model}</td>
                  <td className="px-5 py-4 text-gray-600">{device.power}kW</td>
                  <td className="px-5 py-4">
                    <StatusBadge type="device" status={device.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(device.lastOnline).toLocaleString('zh-CN')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 故障历史 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
            故障历史
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">故障设备</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">严重程度</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">检测时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {faults.map((fault) => (
                <tr key={fault.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">{fault.deviceName}</span>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
