import { useAppStore } from '../store/useAppStore';
import RoleTabs from '../components/RoleTabs';
import DispatcherBoard from '../components/DispatcherBoard';
import GuideBoard from '../components/GuideBoard';
import FleetBoard from '../components/FleetBoard';
import DispatchPanel from '../components/DispatchPanel';
import CheckInPanel from '../components/CheckInPanel';
import TimelineView from '../components/TimelineView';
import FollowUpModal from '../components/FollowUpModal';

const ROLE_LABELS = {
  dispatcher: '计调看板',
  guide: '导游看板',
  fleet: '车队调度看板',
} as const;

export default function Dashboard() {
  const { role, setRole } = useAppStore();

  const renderBoard = () => {
    switch (role) {
      case 'dispatcher':
        return <DispatcherBoard />;
      case 'guide':
        return <GuideBoard />;
      case 'fleet':
        return <FleetBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                导游派遣与接团签到
              </h1>
              <p className="text-sm text-blue-200 mt-0.5">旅游地接社 · 行程交接管理</p>
            </div>
            <RoleTabs currentRole={role} onRoleChange={setRole} />
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            {ROLE_LABELS[role]}
          </h2>
          <div className="text-xs text-slate-400">数据截止：{new Date().toLocaleDateString('zh-CN')}</div>
        </div>
        {renderBoard()}
      </main>

      <DispatchPanel />
      <CheckInPanel />
      <TimelineView />
      <FollowUpModal />
    </div>
  );
}
