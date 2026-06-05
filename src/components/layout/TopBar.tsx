import { User, Bell, AlertTriangle, Activity } from 'lucide-react';
import { useStore } from '@/store';
import { usePressureIndicator } from '@/hooks/usePressureIndicator';
import { roleNames, type UserRole } from '@/types';

export function TopBar() {
  const { currentRole, setCurrentRole } = useStore();
  const { todoCount, pressureLevel, pressurePercent, isHighPressure, alerts } = usePressureIndicator();
  
  const roles: UserRole[] = ['reception', 'coach', 'manager'];
  
  const pressureColors = {
    low: 'from-emerald-500 to-emerald-600',
    medium: 'from-amber-500 to-amber-600',
    high: 'from-orange-500 to-orange-600',
    critical: 'from-red-500 to-red-600'
  };
  
  return (
    <header className="bg-slate-900 border-b border-slate-700">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-white tracking-tight">
              🏸 球馆运营工作台
            </h1>
            
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-all
                    ${currentRole === role
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                    }
                  `}
                >
                  <User className="w-3.5 h-3.5 inline mr-1.5" />
                  {roleNames[role]}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {alerts.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                <Bell className={`w-4 h-4 text-red-400 ${isHighPressure ? 'animate-bounce' : ''}`} />
                <span className="text-sm text-red-400 font-medium">{alerts.length} 条告警</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isHighPressure ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
              <div className="w-32">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">现场压力</span>
                  <span className={`font-medium ${isHighPressure ? 'text-red-400' : 'text-slate-400'}`}>
                    {pressurePercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${pressureColors[pressureLevel as keyof typeof pressureColors]} transition-all duration-500 ${isHighPressure ? 'animate-pulse' : ''}`}
                    style={{ width: `${pressurePercent}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg border
              ${todoCount >= 5
                ? 'bg-red-500/10 border-red-500/30'
                : todoCount >= 3
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-800 border-slate-700'
              }
            `}>
              <span className="text-xs text-slate-500">待办</span>
              <span className={`
                text-lg font-bold font-mono
                ${todoCount >= 5 ? 'text-red-400 animate-wiggle' : ''}
                ${todoCount >= 3 && todoCount < 5 ? 'text-amber-400' : 'text-slate-200'}
              `}>
                {todoCount}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {alerts.length > 0 && (
        <div className="bg-red-500/5 border-t border-red-500/20 px-6 py-2 overflow-hidden">
          <div className="flex items-center gap-4 animate-marquee">
            {alerts.concat(alerts).map((alert, index) => (
              <div key={`${alert.id}-${index}`} className="flex items-center gap-2 whitespace-nowrap text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-red-300">
                  {alert.studentName} - {alert.coachName}
                  {alert.isOverdue && ' · 处理超时'}
                  {alert.hasResponsibilityRisk && ' · 责任待澄清'}
                  {alert.status === 'pending_manager_audit' && ' · 待仲裁'}
                </span>
                <span className="text-slate-600">|</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
