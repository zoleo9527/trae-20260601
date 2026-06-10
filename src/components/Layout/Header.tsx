import { Menu, Bell, Search, ChevronDown, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { DotStatus } from '../StatusBadge';
import { formatDateTime } from '../../utils/date';
import { getOperatorRoleLabel } from '../../data/mockData';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const operators = useStore(state => state.operators);
  const risks = useStore(state => state.risks);
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [showOperators, setShowOperators] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onlineCount = operators.filter(o => o.status === 'online').length;
  const busyCount = operators.filter(o => o.status === 'busy').length;

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="搜索车牌号、工单编号、车主姓名..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
        <span className="text-[11px] text-slate-500">在岗</span>
        <span className="text-sm font-bold text-emerald-600 font-mono">{onlineCount}</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500 font-mono">{operators.length}</span>
        <span className="text-[11px] text-amber-600 ml-2">忙碌 {busyCount}</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowOperators(!showOperators)}
          className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Users className="w-4 h-4 text-slate-500" />
          <span className="text-sm text-slate-600">处理人状态</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        {showOperators && (
          <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-slide-in">
            <div className="px-3 py-2 border-b border-slate-100">
              <div className="text-xs font-medium text-slate-500">当前在岗人员</div>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {operators.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                      {op.avatar}
                    </div>
                    <DotStatus
                      status={op.status}
                      className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{op.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {getOperatorRoleLabel(op.role)}
                      {op.currentTaskCount > 0 && (
                        <span className="ml-1">· 处理中 {op.currentTaskCount} 项</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
        <Bell className="w-5 h-5 text-slate-600" />
        {risks.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-alert">
            {risks.length}
          </span>
        )}
      </button>

      <div className="text-right pl-4 border-l border-slate-200">
        <div className="text-xs text-slate-500">当前时间</div>
        <div className="text-sm font-mono text-slate-800">{formatDateTime(currentTime)}</div>
      </div>
    </header>
  );
}
