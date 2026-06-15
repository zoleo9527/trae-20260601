'use client';

import { useState, useMemo } from 'react';
import { ComplaintRecord, ComplaintStatus, UserRole } from '@/data/types';
import { mockComplaints, mockStats } from '@/data/mockData';
import Sidebar from '@/components/Sidebar';
import StatsCard from '@/components/StatsCard';
import FilterBar from '@/components/FilterBar';
import ComplaintList from '@/components/ComplaintList';
import ComplaintDetail from '@/components/ComplaintDetail';
import HandleModal from '@/components/HandleModal';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole>('客服');
  const [complaints, setComplaints] = useState<ComplaintRecord[]>(mockComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);
  const [handleAction, setHandleAction] = useState<'accept' | 'reject' | 'repair' | 'return_repair' | 'parts' | 'return_parts' | 'revisit' | 'return_revisit' | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('客服');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setRoleFilter(role);
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      if (statusFilter !== 'all' && complaint.status !== statusFilter) return false;
      if (roleFilter !== 'all' && complaint.currentAssignee !== roleFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          complaint.id.toLowerCase().includes(query) ||
          complaint.customerName.toLowerCase().includes(query) ||
          complaint.productType.toLowerCase().includes(query) ||
          complaint.productModel.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [complaints, statusFilter, roleFilter, searchQuery]);

  const stats = useMemo(() => {
    const pending = complaints.filter(
      (c) => 
        c.status !== '已完成' && 
        c.status !== '已驳回' && 
        c.currentAssignee === currentRole
    ).length;
    const abnormal = complaints.filter(
      (c) => c.status === '已驳回'
    ).length;
    const completed = complaints.filter(
      (c) => c.status === '已完成'
    ).length;
    return { pendingCount: pending, abnormalCount: abnormal, completedCount: completed };
  }, [complaints, currentRole]);

  const handleComplaintSelect = (complaint: ComplaintRecord) => {
    setSelectedComplaint(complaint);
  };

  const handleCloseDetail = () => {
    setSelectedComplaint(null);
    setHandleAction(null);
  };

  const handleOpenHandleModal = (action: 'accept' | 'reject' | 'repair' | 'return_repair' | 'parts' | 'return_parts' | 'revisit' | 'return_revisit') => {
    setHandleAction(action);
  };

  const handleCloseHandleModal = () => {
    setHandleAction(null);
  };

  const handleSubmitAction = (data: Record<string, string>) => {
    if (!selectedComplaint) return;

    const now = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\//g, '-');

    const handlerMap: Record<UserRole, string> = {
      '客服': '王芳',
      '维修工程师': '李强',
      '配件管理员': '陈明',
    };

    const handler = handlerMap[currentRole];

    let updatedComplaints = complaints.map((c) => {
      if (c.id !== selectedComplaint.id) return c;

      let newStatus = c.status;
      let newAssignee = c.currentAssignee;
      let newHistory = [...c.history];
      let updates: Partial<ComplaintRecord> = {};

      switch (handleAction) {
        case 'accept':
          newStatus = '待维修工程师处理';
          newAssignee = '维修工程师';
          updates.customerService = {
            handler,
            handleTime: now,
            remark: data.remark || undefined,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '客服受理',
            detail: data.remark || '已受理并派工',
          });
          break;

        case 'reject':
          newStatus = '已驳回';
          updates.rejectReason = data.reason as any;
          updates.rejectRemark = data.remark;
          updates.rejectTime = now;
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '工单驳回',
            detail: `${data.reason}: ${data.remark}`,
          });
          break;

        case 'repair':
          newStatus = '待配件管理员处理';
          newAssignee = '配件管理员';
          updates.engineer = {
            handler,
            handleTime: now,
            repairContent: data.content,
            partsUsed: data.parts ? data.parts.split(',').map((p: string) => p.trim()) : undefined,
            remark: data.remark || undefined,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '维修完成',
            detail: data.content,
          });
          break;

        case 'parts':
          newStatus = '待回访';
          newAssignee = '客服';
          updates.partsManager = {
            handler,
            handleTime: now,
            partsPrepared: data.parts ? data.parts.split(',').map((p: string) => p.trim()) : undefined,
            remark: data.remark || undefined,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '配件准备',
            detail: `已准备配件: ${data.parts}`,
          });
          break;

        case 'revisit':
          newStatus = '已完成';
          updates.revisit = {
            handler,
            revisitTime: now,
            customerSatisfaction: data.satisfaction as any,
            revisitContent: data.content || undefined,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '回访完成',
            detail: `满意度: ${data.satisfaction}${data.content ? `, ${data.content}` : ''}`,
          });
          break;

        case 'return_repair':
          newStatus = '待客服受理';
          newAssignee = '客服';
          updates.engineer = {
            handler,
            handleTime: now,
            ...c.engineer,
            returnReason: data.reason as any,
            returnRemark: data.remark,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '维修退回',
            detail: `${data.reason}: ${data.remark}`,
          });
          break;

        case 'return_parts':
          newStatus = '待维修工程师处理';
          newAssignee = '维修工程师';
          updates.partsManager = {
            handler,
            handleTime: now,
            ...c.partsManager,
            returnReason: data.reason as any,
            returnRemark: data.remark,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '配件退回',
            detail: `${data.reason}: ${data.remark}`,
          });
          break;

        case 'return_revisit':
          newStatus = '待配件管理员处理';
          newAssignee = '配件管理员';
          updates.revisit = {
            handler,
            revisitTime: now,
            customerSatisfaction: c.revisit?.customerSatisfaction || '一般',
            ...c.revisit,
            returnReason: data.reason as any,
            returnRemark: data.remark,
          };
          newHistory.push({
            id: `h${Date.now()}`,
            time: now,
            operator: handler,
            action: '回访退回',
            detail: `${data.reason}: ${data.remark}`,
          });
          break;
      }

      return {
        ...c,
        ...updates,
        status: newStatus,
        currentAssignee: newAssignee,
        history: newHistory,
      };
    });

    setComplaints(updatedComplaints);
    const updated = updatedComplaints.find((c) => c.id === selectedComplaint.id);
    if (updated) {
      setSelectedComplaint(updated);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar currentRole={currentRole} onRoleChange={handleRoleChange} />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">家电售后工作台</h1>
          <p className="text-gray-600 mt-1">
            当前角色: <span className="font-medium text-primary-600">{currentRole}</span>
          </p>
        </div>
        
        <StatsCard stats={stats} />
        
        <FilterBar
          statusFilter={statusFilter}
          roleFilter={roleFilter}
          searchQuery={searchQuery}
          onStatusChange={setStatusFilter}
          onRoleChange={setRoleFilter}
          onSearchChange={setSearchQuery}
        />
        
        <ComplaintList
          complaints={filteredComplaints}
          currentRole={currentRole}
          onSelect={handleComplaintSelect}
        />
      </main>
      
      {selectedComplaint && (
        <ComplaintDetail
          complaint={selectedComplaint}
          currentRole={currentRole}
          onClose={handleCloseDetail}
          onHandle={handleOpenHandleModal}
        />
      )}
      
      {handleAction && selectedComplaint && (
        <HandleModal
          complaint={selectedComplaint}
          action={handleAction}
          onClose={handleCloseHandleModal}
          onSubmit={handleSubmitAction}
        />
      )}
    </div>
  );
}
