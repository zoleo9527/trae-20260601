
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Zap, AlertTriangle, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import type { Station } from '../../shared/types';

interface StationMapProps {
  height?: string;
}

const stationColors: Record<string, string> = {
  normal: '#10b981',
  warning: '#f59e0b',
  offline: '#ef4444',
};

const stationIcons: Record<string, typeof MapPin> = {
  normal: Zap,
  warning: AlertTriangle,
  offline: WifiOff,
};

export function StationMap({ height = '400px' }: StationMapProps) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const data = await api.stations.list();
        setStations(data);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) {
    return (
      <div
        className="w-full bg-gray-50 rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mapBounds = {
    minLat: 39.7,
    maxLat: 40.1,
    minLng: 116.2,
    maxLng: 116.6,
  };

  const latToY = (lat: number) => {
    return ((mapBounds.maxLat - lat) / (mapBounds.maxLat - mapBounds.minLat)) * 100;
  };

  const lngToX = (lng: number) => {
    return ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * 100;
  };

  return (
    <div
      className="w-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl relative overflow-hidden"
      style={{ height }}
    >
      {/* 地图背景网格 */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* 模拟道路/环线 */}
        <ellipse
          cx="50%"
          cy="50%"
          rx="35%"
          ry="30%"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="8,4"
        />
        <ellipse
          cx="50%"
          cy="50%"
          rx="25%"
          ry="20%"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="2"
          strokeDasharray="8,4"
        />
        
        {/* 城市中心标记 */}
        <circle cx="50%" cy="50%" r="4" fill="#334155" />
        <text x="52%" y="48%" fontSize="12" fill="#64748b">北京市中心</text>
      </svg>

      {/* 站点标记 */}
      {stations.map((station) => {
        const x = lngToX(station.lng);
        const y = latToY(station.lat);
        const Icon = stationIcons[station.status] || MapPin;
        const isHovered = hoveredStation?.id === station.id;

        return (
          <div
            key={station.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              zIndex: isHovered ? 20 : 10,
            }}
            onMouseEnter={() => setHoveredStation(station)}
            onMouseLeave={() => setHoveredStation(null)}
            onClick={() => navigate(`/stations/${station.id}`)}
          >
            <div
              className={`relative flex items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
                isHovered ? 'scale-125' : 'scale-100'
              }`}
              style={{
                width: station.status === 'offline' ? '44px' : '36px',
                height: station.status === 'offline' ? '44px' : '36px',
                backgroundColor: stationColors[station.status],
                animation: station.status === 'offline' ? 'pulse 2s infinite' : 'none',
              }}
            >
              <Icon className="w-5 h-5 text-white" />
              
              {/* 告警闪烁效果 */}
              {station.status !== 'normal' && (
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-30"
                  style={{ backgroundColor: stationColors[station.status] }}
                />
              )}
            </div>

            {/* 站点名称标签 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap">
              <span className="text-xs font-medium text-gray-700 bg-white/80 px-2 py-0.5 rounded shadow-sm">
                {station.name}
              </span>
            </div>

            {/* 悬停详情卡片 */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl p-3 z-30">
                <div className="text-sm font-semibold text-gray-900 mb-2">{station.name}</div>
                <div className="text-xs text-gray-500 mb-2 line-clamp-2">{station.address}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">设备在线</span>
                  <span className="font-medium text-gray-900">
                    {station.onlineCount}/{station.deviceCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-500">合作方</span>
                  <span className="font-medium text-gray-900">{station.partnerName}</span>
                </div>
                <div className="mt-2 pt-2 border-t text-center">
                  <span className="text-xs text-blue-600">点击查看详情</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 图例 */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">图例</div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600">正常</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-600">告警</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600">离线</span>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">站点状态</div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {stations.filter((s) => s.status === 'normal').length}
            </div>
            <div className="text-xs text-gray-500">正常</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {stations.filter((s) => s.status === 'warning').length}
            </div>
            <div className="text-xs text-gray-500">告警</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              {stations.filter((s) => s.status === 'offline').length}
            </div>
            <div className="text-xs text-gray-500">离线</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
