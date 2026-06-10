import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, Bike, CheckCircle, Clock, Flame, Loader } from 'lucide-react';
import { useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useAppStore } from '../../store/useAppStore';

const createCustomIcon = (status: string, selected: boolean, repeatCount: number, offset: boolean) => {
  const size = selected ? 44 : 36;
  const pulseSize = selected ? 60 : 48;
  
  let bgColor = '#3b82f6';
  let iconChar = '🚲';
  
  if (status === 'pending') {
    bgColor = '#f59e0b';
  } else if (status === 'assigned' || status === 'processing') {
    bgColor = '#8b5cf6';
  } else if (status === 'completed') {
    bgColor = '#f97316';
  } else if (status === 'closed') {
    bgColor = '#10b981';
  }

  const hasRepeat = repeatCount > 1;
  if (hasRepeat && status !== 'closed') {
    bgColor = '#ef4444';
  }

  const offsetRing = offset ? 'box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.6), 0 0 15px rgba(251, 191, 36, 0.5);' : '';
  const repeatRing = hasRepeat ? 'box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.4), 0 0 20px rgba(239, 68, 68, 0.3);' : offsetRing;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px;">
      ${selected ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: ${pulseSize}px; height: ${pulseSize}px; border-radius: 50%; background: ${bgColor}; opacity: 0.3; animation: pulse-ring 1.5s ease-out infinite;"></div>` : ''}
      <div style="width: ${size}px; height: ${size}px; background: ${bgColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; border: 3px solid white; ${repeatRing} transition: all 0.3s ease;">
        ${hasRepeat ? '🔥' : offset ? '⚠️' : '🚲'}
      </div>
      ${hasRepeat ? `<div style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 10px; border: 2px solid white;">${repeatCount}</div>` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

const MapController = () => {
  const { selectedComplaintId, complaints, selectedHotspotId, hotspots } = useAppStore();
  const map = useMap();

  useEffect(() => {
    if (selectedComplaintId) {
      const complaint = complaints.find(c => c.id === selectedComplaintId);
      if (complaint) {
        map.flyTo([complaint.location.lat, complaint.location.lng], 16, {
          duration: 0.8
        });
      }
    }
  }, [selectedComplaintId, complaints, map]);

  useEffect(() => {
    if (selectedHotspotId) {
      const hotspot = hotspots.find(h => h.id === selectedHotspotId);
      if (hotspot) {
        map.flyTo([hotspot.center.lat, hotspot.center.lng], 15, {
          duration: 0.8
        });
      }
    }
  }, [selectedHotspotId, hotspots, map]);

  return null;
};

export const MapView = () => {
  const { complaints, selectedComplaintId, setSelectedComplaint, hotspots, selectedHotspotId, activeTab } = useAppStore();

  const center: [number, number] = [39.95, 116.35];
  const zoom = 12;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'assigned':
      case 'processing': return <Loader className="w-4 h-4" />;
      case 'completed': return <AlertTriangle className="w-4 h-4" />;
      case 'closed': return <CheckCircle className="w-4 h-4" />;
      default: return <Bike className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      pending: '待派单',
      assigned: '已派单',
      processing: '处理中',
      completed: '待关闭',
      closed: '已关闭'
    };
    return map[status] || status;
  };

  return (
    <div className="flex-1 relative h-full">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
        .leaflet-container {
          background: #e8eef4 !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <MapController />

        {hotspots.map((hotspot) => (
          <Circle
            key={`hotspot-${hotspot.id}`}
            center={[hotspot.center.lat, hotspot.center.lng]}
            radius={hotspot.radius}
            pathOptions={{
              color: selectedHotspotId === hotspot.id ? '#ef4444' : '#f97316',
              fillColor: selectedHotspotId === hotspot.id ? '#ef4444' : '#f97316',
              fillOpacity: activeTab === 'hotspots' ? 0.15 : 0.08,
              weight: selectedHotspotId === hotspot.id ? 2 : 1,
              dashArray: '5, 5'
            }}
          />
        ))}

        {complaints.map((complaint) => (
          <Marker
            key={complaint.id}
            position={[complaint.location.lat, complaint.location.lng]}
            icon={createCustomIcon(
              complaint.status,
              selectedComplaintId === complaint.id,
              complaint.repeatCount || 0,
              complaint.location.offset || false
            )}
            eventHandlers={{
              click: () => {
                setSelectedComplaint(
                  selectedComplaintId === complaint.id ? null : complaint.id
                );
              }
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <div className="font-semibold text-slate-800 mb-1">{complaint.title}</div>
                <div className="text-xs text-slate-500 mb-2">{complaint.location.address}</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full ${
                    complaint.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    complaint.status === 'closed' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {getStatusText(complaint.status)}
                  </span>
                  <span className="text-slate-400 font-mono">{complaint.id}</span>
                </div>
                {(complaint.repeatCount || 0) > 1 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                    <Flame className="w-3 h-3" />
                    <span>该区域已投诉 {complaint.repeatCount} 次</span>
                  </div>
                )}
                {complaint.location.offset && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span>定位可能有偏移</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 text-xs space-y-2 border border-slate-200">
        <div className="font-semibold text-slate-700 mb-2">图例说明</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-amber-500" />
          <span className="text-slate-600">待派单</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500" />
          <span className="text-slate-600">处理中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span className="text-slate-600">待关闭</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span className="text-slate-600">已关闭</span>
        </div>
        <div className="border-t border-slate-200 my-1 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-slate-600">重复投诉</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-4 h-4 rounded-full bg-amber-400 ring-2 ring-amber-300" />
            <span className="text-slate-600">定位偏移</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 flex gap-1 bg-white/95 backdrop-blur rounded-lg shadow-lg p-1 border border-slate-200">
        <button
          onClick={() => {}}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'list'
              ? 'bg-cyan-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          工单视图
        </button>
        <button
          onClick={() => {}}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === 'hotspots'
              ? 'bg-orange-500 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          热图视图
        </button>
      </div>
    </div>
  );
};
