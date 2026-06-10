import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Egg } from 'lucide-react';
import type { DashboardStats } from '@/lib/api';

interface PressureBarProps {
  stats: DashboardStats | null;
}

export default function PressureBar({ stats }: PressureBarProps) {
  const navigate = useNavigate();

  const segments = [
    {
      label: '超时巡检',
      count: stats?.overdue_inspections || 0,
      color: 'bg-farm-red',
      textColor: 'text-farm-red',
      pulseColor: 'shadow-farm-red/50',
      icon: Clock,
      onClick: () => navigate('/inspection?status=overdue'),
    },
    {
      label: '未完成产蛋',
      count: stats?.incomplete_egg_records || 0,
      color: 'bg-farm-orange',
      textColor: 'text-farm-orange',
      pulseColor: 'shadow-farm-orange/50',
      icon: Egg,
      onClick: () => navigate('/egg-records?status=pending'),
    },
    {
      label: '待处理异常',
      count: stats?.pending_anomalies || 0,
      color: 'bg-farm-yellow',
      textColor: 'text-farm-yellow',
      pulseColor: 'shadow-farm-yellow/50',
      icon: AlertTriangle,
      onClick: () => {},
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {segments.map((seg) => (
        <button
          key={seg.label}
          onClick={seg.onClick}
          className={`bg-farm-card border border-farm-border rounded-lg p-4 flex items-center gap-4 hover:border-farm-muted transition-colors ${
            seg.count > 0 ? `shadow-lg ${seg.pulseColor}` : ''
          }`}
        >
          <div className={`${seg.color}/20 p-3 rounded-lg`}>
            <seg.icon size={24} className={seg.textColor} />
          </div>
          <div className="text-left">
            <div className={`font-mono font-bold text-3xl ${seg.count > 0 ? seg.textColor : 'text-farm-muted'} ${seg.count > 0 ? 'animate-pulse-overdue' : ''}`}>
              {seg.count}
            </div>
            <div className="text-farm-muted text-sm">{seg.label}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
