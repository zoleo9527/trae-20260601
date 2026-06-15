"use client";

import React, { useState, useEffect } from 'react';
import { Navigation } from '../../components/Navigation';
import { StatsCard } from '../../components/StatsCard';
import { AppealCard } from '../../components/AppealCard';
import { AppealDetail } from '../../components/AppealDetail';
import { StatusTabs } from '../../components/StatusTabs';
import { mockAppeals, getAppealSummary } from '../../data/mockData';
import { Appeal } from '../../types';
import { getCurrentUserRole, isOverdue, isTodayCreated } from '../../utils/appealLogic';

export default function Page() {
  const [appeals] = useState<Appeal[]>(mockAppeals);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [summary, setSummary] = useState(getAppealSummary());

  const currentRole = getCurrentUserRole();

  const todayPendingList = appeals.filter(a => isTodayCreated(a.createdAt) && 
    ['pending_receipt', 'pending_inspection', 'pending_finance', 'pending_confirmation'].includes(a.status));
  
  const overdueList = appeals.filter(a => isOverdue(a.deadline) && !['resolved', 'rejected'].includes(a.status));
  
  const returnedList = appeals.filter(a => a.status === 'returned');

  const filteredAppeals = activeTab === 'all' 
    ? appeals 
    : appeals.filter(a => a.status === activeTab);

  const statusCounts = {
    all: appeals.length,
    pending_receipt: appeals.filter(a => a.status === 'pending_receipt').length,
    pending_inspection: appeals.filter(a => a.status === 'pending_inspection').length,
    pending_finance: appeals.filter(a => a.status === 'pending_finance').length,
    pending_confirmation: appeals.filter(a => a.status === 'pending_confirmation').length,
    resolved: appeals.filter(a => a.status === 'resolved').length,
    rejected: appeals.filter(a => a.status === 'rejected').length,
    returned: appeals.filter(a => a.status === 'returned').length,
  };

  const handleUpdateAppeal = (updatedAppeal: Appeal) => {
    // In a real app, this would update the backend
    console.log('Updated appeal:', updatedAppeal);
    setSummary(getAppealSummary());
  };

  const urgentIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const clockIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const alertIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const checkIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentUserRole={currentRole} />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">售后申诉管理</h1>
          <p className="text-gray-500 mt-1">处理数码回收售后申诉，查看证据归档</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard title="今日待处理" count={summary.todayPending} icon={urgentIcon} color="blue" />
          <StatsCard title="超时申诉" count={summary.overdueCount} icon={clockIcon} color="red" />
          <StatsCard title="退回补充" count={summary.returnedCount} icon={alertIcon} color="orange" />
          <StatsCard title="已解决" count={summary.resolvedCount} icon={checkIcon} color="purple" />
        </div>

        {todayPendingList.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-blue-500 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">今日待处理</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">{todayPendingList.length}</span>
            </div>
            <div className="grid gap-4">
              {todayPendingList.map(appeal => (
                <AppealCard 
                  key={appeal.id} 
                  appeal={appeal} 
                  onClick={() => setSelectedAppeal(appeal)}
                />
              ))}
            </div>
          </section>
        )}

        {overdueList.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-red-500 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">超时申诉</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">{overdueList.length}</span>
            </div>
            <div className="grid gap-4">
              {overdueList.map(appeal => (
                <AppealCard 
                  key={appeal.id} 
                  appeal={appeal} 
                  onClick={() => setSelectedAppeal(appeal)}
                />
              ))}
            </div>
          </section>
        )}

        {returnedList.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-6 bg-orange-500 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">退回补充</h2>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">{returnedList.length}</span>
            </div>
            <div className="grid gap-4">
              {returnedList.map(appeal => (
                <AppealCard 
                  key={appeal.id} 
                  appeal={appeal} 
                  onClick={() => setSelectedAppeal(appeal)}
                  showUrgency={false}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gray-500 rounded"></div>
              <h2 className="text-lg font-semibold text-gray-800">全部申诉</h2>
            </div>
            <StatusTabs activeTab={activeTab} onTabChange={setActiveTab} counts={statusCounts} />
          </div>
          <div className="grid gap-4">
            {filteredAppeals.length > 0 ? (
              filteredAppeals.map(appeal => (
                <AppealCard 
                  key={appeal.id} 
                  appeal={appeal} 
                  onClick={() => setSelectedAppeal(appeal)}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">暂无申诉记录</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {selectedAppeal && (
        <AppealDetail 
          appeal={selectedAppeal} 
          onClose={() => setSelectedAppeal(null)}
          onUpdate={handleUpdateAppeal}
        />
      )}
    </div>
  );
}