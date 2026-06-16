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
const API_BASE = 'http://localhost:3001/api';

function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [showCompensationModal, setShowCompensationModal] = useState(false);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'compensated' | 'followup' | 'abnormal'>('pending');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const response = await fetch(`${API_BASE}/complaints`);
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      } else {
        throw new Error('API response not ok');
      }
    } catch (error) {
      console.error('获取投诉列表失败，使用本地数据:', error);
      setComplaints(mockComplaints);
    }
  };

  const handleAddComplaint = async (complaintData: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintData)
      });
      if (response.ok) {
        fetchComplaints();
        setShowComplaintForm(false);
      }
    } catch (error) {
      console.error('添加投诉失败:', error);
      const newComplaint: Complaint = {
        ...complaintData,
        id: `C${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setComplaints(prev => [newComplaint, ...prev]);
      setShowComplaintForm(false);
    }
  };

  const handleAddCompensation = async (compensationData: {
    complaintId: string;
    type: 'drinks' | 'discount' | 'free_entry' | 'storage';
    amount: number;
    description: string;
    authorizedBy: string;
    isAbnormal: boolean;
    abnormalReason?: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/compensations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compensationData)
      });
      if (response.ok) {
        fetchComplaints();
        setShowCompensationModal(false);
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error('添加补偿失败:', error);
      setComplaints(prev => prev.map(c => {
        if (c.id === compensationData.complaintId) {
          return {
            ...c,
            status: 'compensated',
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            compensate: {
              id: `K${Date.now()}`,
              complaintId: c.id,
              type: compensationData.type,
              amount: compensationData.amount,
              description: compensationData.description,
              authorizedBy: compensationData.authorizedBy,
              authorizedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              isAbnormal: compensationData.isAbnormal,
              abnormalReason: compensationData.abnormalReason
            }
          };
        }
        return c;
      }));
      setShowCompensationModal(false);
      setSelectedComplaint(null);
    }
  };

  const handleVerifyCompensation = async (compensationId: string, verifiedBy: string) => {
    try {
      const response = await fetch(`${API_BASE}/compensations/${compensationId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedBy })
      });
      if (response.ok) {
        fetchComplaints();
      }
    } catch (error) {
      console.error('核销失败:', error);
      setComplaints(prev => prev.map(c => {
        if (c.compensate?.id === compensationId) {
          return {
            ...c,
            compensate: {
              ...c.compensate,
              verifiedBy,
              verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          };
        }
        return c;
      }));
    }
  };

  const handleAddFollowup = async (complaintId: string, followupData: {
    followupBy: string;
    followupResult: 'resolved' | 'pending';
    followupNote: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/complaints/${complaintId}/followup`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followupData)
      });
      if (response.ok) {
        fetchComplaints();
        setShowFollowupModal(false);
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error('记录回访失败:', error);
      setComplaints(prev => prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: followupData.followupResult === 'resolved' ? 'resolved' : 'followup',
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
            followup: {
              followupBy: followupData.followupBy,
              followupResult: followupData.followupResult,
              followupNote: followupData.followupNote,
              followupAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
            }
          };
        }
        return c;
      }));
      setShowFollowupModal(false);
      setSelectedComplaint(null);
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const compensatedCount = complaints.filter(c => c.status === 'compensated').length;
  const followupCount = complaints.filter(c => c.status === 'followup').length;
  const abnormalCount = complaints.filter(c => c.compensate?.isAbnormal).length;

  const abnormalComplaints = complaints.filter(c => c.compensate?.isAbnormal);

  const tabs = [
    { key: 'pending' as const, label: '当晚待处理', count: pendingCount },
    { key: 'compensated' as const, label: '已补偿', count: compensatedCount },
    { key: 'followup' as const, label: '待回访', count: followupCount },
    { key: 'abnormal' as const, label: '异常核销', count: abnormalCount },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">酒吧运营-现场投诉与赠饮核销</h1>
            <p className="text-gray-400 mt-1">订台客服、吧台、现场经理协同处理客诉</p>
          </div>
          <button
            onClick={() => setShowComplaintForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
          >
            <span className="text-lg">+</span>
            <span>登记投诉</span>
          </button>
        </div>

        <Stats 
          pendingCount={pendingCount}
          compensatedCount={compensatedCount}
          followupCount={followupCount}
          abnormalCount={abnormalCount}
        />

        <div className="flex space-x-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {activeTab === 'abnormal' ? (
          <ComplaintTable 
            complaints={abnormalComplaints}
            title="异常核销"
            statusFilter="all"
            onAddCompensation={(complaint: Complaint) => {
              setSelectedComplaint(complaint);
              setShowCompensationModal(true);
            }}
            onVerifyCompensation={handleVerifyCompensation}
            onAddFollowup={(complaint: Complaint) => {
              setSelectedComplaint(complaint);
              setShowFollowupModal(true);
            }}
          />
        ) : (
          <ComplaintTable 
            complaints={complaints}
            title={tabs.find(t => t.key === activeTab)?.label || ''}
            statusFilter={activeTab}
            onAddCompensation={(complaint: Complaint) => {
              setSelectedComplaint(complaint);
              setShowCompensationModal(true);
            }}
            onVerifyCompensation={handleVerifyCompensation}
            onAddFollowup={(complaint: Complaint) => {
              setSelectedComplaint(complaint);
              setShowFollowupModal(true);
            }}
          />
        )}
      </main>

      {showComplaintForm && (
        <ComplaintForm 
          onSubmit={handleAddComplaint}
          onClose={() => setShowComplaintForm(false)}
        />
      )}

      {showCompensationModal && selectedComplaint && (
        <CompensationModal 
          complaint={selectedComplaint}
          onSubmit={handleAddCompensation}
          onClose={() => {
            setShowCompensationModal(false);
            setSelectedComplaint(null);
          }}
        />
      )}

      {showFollowupModal && selectedComplaint && (
        <FollowupModal 
          complaint={selectedComplaint}
          onSubmit={handleAddFollowup}
          onClose={() => {
            setShowFollowupModal(false);
            setSelectedComplaint(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
