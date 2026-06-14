import TopOverviewBar from '@/components/layout/TopOverviewBar';
import LeftRolePanel from '@/components/layout/LeftRolePanel';
import SceneSwitcher from '@/components/layout/SceneSwitcher';
import CaseCardList from '@/components/case/CaseCardList';
import CaseDetailPanel from '@/components/case/CaseDetailPanel';
import NotificationLayer from '@/components/common/AlertBanner';
import { useCaseStore } from '@/stores/caseStore';

export default function Workbench() {
  const activeCaseId = useCaseStore((s) => s.activeCaseId);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      <NotificationLayer />

      <TopOverviewBar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="w-56 shrink-0">
          <LeftRolePanel />
        </aside>

        <section className="w-[380px] shrink-0 border-l border-slate-200 bg-slate-50">
          <CaseCardList />
        </section>

        <main className="flex-1 min-w-0 border-l border-slate-200 p-3 bg-gradient-to-br from-slate-100 via-slate-50 to-white">
          <CaseDetailPanel />
        </main>
      </div>

      <SceneSwitcher />
    </div>
  );
}
