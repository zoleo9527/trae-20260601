import { useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SaleControlPage from './SaleControlPage';
import ApprovalPage from './ApprovalPage';
import HistoryPage from './HistoryPage';
import { cn } from '@/lib/utils';

type TabKey = 'sale' | 'approval' | 'history';

export default function Home() {
  const { currentUser, setCurrentUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabKey>('sale');

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'sale', label: '房源销控' },
    { key: 'approval', label: '锁定审批' },
    { key: 'history', label: '历史记录' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <Header currentUser={currentUser} onUserChange={setCurrentUser} />
        <main className="pt-16">
          <div className="border-b border-slate-200 bg-white px-6 sticky top-16 z-20">
            <div className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-5 py-3.5 text-sm font-medium transition-all relative',
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'sale' && <SaleControlPage />}
            {activeTab === 'approval' && <ApprovalPage />}
            {activeTab === 'history' && <HistoryPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
