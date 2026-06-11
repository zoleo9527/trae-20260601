'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import VisitsPage from '@/components/VisitsPage';
import FollowUpsPage from '@/components/FollowUpsPage';
import SubscriptionsPage from '@/components/SubscriptionsPage';
import MaterialsPage from '@/components/MaterialsPage';
import SigningPage from '@/components/SigningPage';
import LogsPage from '@/components/LogsPage';
import SystemInfoPage from '@/components/SystemInfoPage';

const pageTitles: Record<string, string> = {
  dashboard: '工作台',
  visits: '来访登记',
  followups: '跟进管理',
  subscriptions: '认购管理',
  materials: '认购资料',
  signing: '签约提醒',
  logs: '操作日志',
  'system-info': '系统说明',
};

export default function HomePage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const handleNavigate = (tab: string, id?: string) => {
    setActiveTab(tab);
    if (id) {
      setSelectedId(id);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'visits':
        return <VisitsPage selectedId={selectedId} />;
      case 'followups':
        return <FollowUpsPage selectedId={selectedId} />;
      case 'subscriptions':
        return (
          <SubscriptionsPage
            selectedId={selectedId}
            onNavigate={handleNavigate}
          />
        );
      case 'materials':
        return <MaterialsPage selectedId={selectedId} />;
      case 'signing':
        return <SigningPage selectedId={selectedId} />;
      case 'logs':
        return <LogsPage />;
      case 'system-info':
        return <SystemInfoPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={pageTitles[activeTab] || '工作台'} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
