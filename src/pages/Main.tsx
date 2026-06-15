import { useState } from 'react';
import { useAppStore } from '../store';
import { UserRole } from '../types';
import { 
  Store, Palette, Package, LogOut, Lock, Warehouse, FileText, 
  ClipboardList, AlertTriangle, History, ChevronDown, ChevronRight,
  User
} from 'lucide-react';
import ColorLockList from '../components/ColorLockList';
import InventoryReservationList from '../components/InventoryReservationList';
import SampleBookPanel from '../components/SampleBookPanel';
import MeasureOrderList from '../components/MeasureOrderList';
import ReplenishRequestList from '../components/ReplenishRequestList';
import ColorLockDetail from '../components/ColorLockDetail';
import ReservationDetail from '../components/ReservationDetail';

type TabType = 'lock' | 'reservation' | 'sample' | 'measure' | 'replenish' | 'history';

const roleTabs: Record<UserRole, { key: TabType; label: string; icon: typeof Lock }[]> = {
  sales: [
    { key: 'lock', label: '色号锁定', icon: Lock },
    { key: 'reservation', label: '库存预留', icon: Warehouse },
    { key: 'sample', label: '样板册', icon: Palette },
    { key: 'measure', label: '量房单', icon: FileText },
    { key: 'history', label: '历史记录', icon: History },
  ],
  designer: [
    { key: 'lock', label: '色号锁定', icon: Lock },
    { key: 'sample', label: '样板册', icon: Palette },
    { key: 'measure', label: '量房单', icon: FileText },
    { key: 'history', label: '历史记录', icon: History },
  ],
  warehouse: [
    { key: 'reservation', label: '库存预留', icon: Warehouse },
    { key: 'lock', label: '色号锁定', icon: Lock },
    { key: 'replenish', label: '补货申请', icon: ClipboardList },
    { key: 'history', label: '历史记录', icon: History },
  ],
};

export default function Main() {
  const currentUser = useAppStore((state) => state.currentUser);
  const logout = useAppStore((state) => state.logout);
  const colorLocks = useAppStore((state) => state.colorLocks);
  const reservations = useAppStore((state) => state.reservations);

  const [activeTab, setActiveTab] = useState<TabType>('lock');
  const [selectedLockId, setSelectedLockId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [showResponsibilityWarning, setShowResponsibilityWarning] = useState(true);

  if (!currentUser) return null;

  const tabs = roleTabs[currentUser.role];
  const pendingLocks = colorLocks.filter(l => l.status === 'pending').length;
  const pendingReservations = reservations.filter(r => r.status === 'pending').length;
  const warningItems = colorLocks.filter(l => l.responsibilityFlag || l.status === 'pending').length;

  const handleLogout = () => {
    logout();
  };

  const renderContent = () => {
    if (selectedLockId) {
      return <ColorLockDetail lockId={selectedLockId} onBack={() => setSelectedLockId(null)} />;
    }
    if (selectedReservationId) {
      return <ReservationDetail reservationId={selectedReservationId} onBack={() => setSelectedReservationId(null)} />;
    }

    switch (activeTab) {
      case 'lock':
        return <ColorLockList onSelect={(id) => setSelectedLockId(id)} />;
      case 'reservation':
        return <InventoryReservationList onSelect={(id) => setSelectedReservationId(id)} />;
      case 'sample':
        return <SampleBookPanel />;
      case 'measure':
        return <MeasureOrderList />;
      case 'replenish':
        return <ReplenishRequestList />;
      case 'history':
        return <ColorLockList showAll />;
      default:
        return <ColorLockList onSelect={(id) => setSelectedLockId(id)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">瓷砖门店</h1>
              <p className="text-xs text-slate-500">色号锁定系统</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {tabs.map(({ key, label, icon: Icon }) => {
              const isActive = activeTab === key;
              const hasBadge = (key === 'lock' && pendingLocks > 0) || (key === 'reservation' && pendingReservations > 0);
              const badgeCount = key === 'lock' ? pendingLocks : pendingReservations;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-amber-50 text-amber-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                  {hasBadge && (
                    <span className="ml-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {showResponsibilityWarning && warningItems > 0 && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-amber-800">责任提醒</span>
                    <button 
                      onClick={() => setShowResponsibilityWarning(false)}
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-amber-700">
                    有 {warningItems} 项色号锁定存在责任不清或待处理状态
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            {(selectedLockId || selectedReservationId) && (
              <button 
                onClick={() => {
                  setSelectedLockId(null);
                  setSelectedReservationId(null);
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="text-sm">返回列表</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-full">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{currentUser.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                currentUser.role === 'sales' ? 'bg-blue-100 text-blue-700' :
                currentUser.role === 'designer' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {currentUser.role === 'sales' ? '导购' : currentUser.role === 'designer' ? '设计师' : '仓库员'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
