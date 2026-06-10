import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import type { CoopStatus } from '@/lib/api';

interface CoopStatusGridProps {
  coops: CoopStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'border-farm-border',
  in_progress: 'border-blue-500',
  pending_confirm: 'border-farm-orange',
  completed: 'border-farm-green',
  anomaly: 'border-farm-red',
};

const STATUS_BG: Record<string, string> = {
  pending: 'bg-farm-card',
  in_progress: 'bg-blue-500/10',
  pending_confirm: 'bg-farm-orange/10',
  completed: 'bg-farm-green/10',
  anomaly: 'bg-farm-red/10',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  pending_confirm: '待确认',
  completed: '已完成',
  anomaly: '异常',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  pending: 'bg-farm-muted',
  in_progress: 'bg-blue-500',
  pending_confirm: 'bg-farm-orange',
  completed: 'bg-farm-green',
  anomaly: 'bg-farm-red',
};

function ElapsedTimer({ minutes }: { minutes: number | null }) {
  const [elapsed, setElapsed] = useState(minutes || 0);

  useEffect(() => {
    if (minutes === null) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 60000);
    return () => clearInterval(timer);
  }, [minutes]);

  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;

  return (
    <span className={`font-mono text-xs ${h >= 2 ? 'text-farm-red animate-pulse-overdue' : 'text-farm-muted'}`}>
      {h > 0 ? `${h}h` : ''}{m}m
    </span>
  );
}

export default function CoopStatusGrid({ coops }: CoopStatusGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-3 gap-3">
      {coops.map((coop) => (
        <button
          key={coop.coop_id}
          onClick={() => navigate('/inspection')}
          className={`rounded-lg p-4 border-l-4 ${STATUS_COLORS[coop.status]} ${STATUS_BG[coop.status]} text-left transition-all hover:scale-[1.02] ${
            coop.is_overdue ? 'border-l-farm-red animate-pulse-overdue shadow-lg shadow-farm-red/20' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-farm-text font-bold text-lg">{coop.coop_code}</span>
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[coop.status]}`} />
          </div>
          <div className="flex items-center gap-1 mb-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              coop.status === 'anomaly' ? 'bg-farm-red/20 text-farm-red' :
              coop.status === 'completed' ? 'bg-farm-green/20 text-farm-green' :
              'bg-farm-card text-farm-muted'
            }`}>
              {STATUS_LABELS[coop.status]}
            </span>
          </div>
          {coop.inspector_name && (
            <div className="flex items-center gap-1 text-xs text-farm-muted">
              <User size={10} />
              {coop.inspector_name}
            </div>
          )}
          {coop.elapsed_minutes !== null && (
            <div className="flex items-center gap-1 text-xs mt-1">
              <Clock size={10} className="text-farm-muted" />
              <ElapsedTimer minutes={coop.elapsed_minutes} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
