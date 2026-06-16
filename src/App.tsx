import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuditLog } from '@/pages/AuditLog';
import { Dashboard } from '@/pages/Dashboard';
import { OrderManagement } from '@/pages/OrderManagement';
import { SoldOutManagement } from '@/pages/SoldOutManagement';
import { SoupBaseManagement } from '@/pages/SoupBaseManagement';
import { TodoManagement } from '@/pages/TodoManagement';
import { useStore } from '@/store/store';
import { useEffect, useState } from 'react';
  const pendingCount = complaints.filter(c => c.status === 'pending').length
  const compensatedCount = complaints.filter(c => c.status === 'compensated').length
  const followupCount = complaints.filter(c => c.status === 'followup').length
  const abnormalCount = complaints.filter(c => c.compensate?.isAbnormal).length

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setComplaints(prev => prev.map(c => 
      c.id === id ? { ...c, status: newStatus as Complaint['status'], updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) } : c
    ))
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Stats 
          pendingCount={pendingCount}
          compensatedCount={compensatedCount}
          followupCount={followupCount}
          abnormalCount={abnormalCount}
        />

        <div className="space-y-6">
          <ComplaintTable 
            complaints={complaints}
            title="当晚待处理"
            statusFilter="pending"
            onUpdateStatus={handleUpdateStatus}
          />

          <ComplaintTable 
            complaints={complaints}
            title="已补偿"
            statusFilter="compensated"
            onUpdateStatus={handleUpdateStatus}
          />

          <ComplaintTable 
            complaints={complaints}
            title="待回访"
            statusFilter="followup"
            onUpdateStatus={handleUpdateStatus}
          />

          <ComplaintTable 
            complaints={complaints}
            title="异常核销"
            statusFilter="compensated"
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </main>
    </div>
  )
}

export default App