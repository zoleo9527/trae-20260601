import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaseStore } from '@/store/useCaseStore';
import { useUserStore } from '@/store/useUserStore';
import StatusTag from '@/components/StatusTag/StatusTag';
import Modal from '@/components/Modal/Modal';
import { formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { ReviewLog } from '@/types';
import {
  CheckSquare,
  Search,
  Filter,
  Stethoscope,
  Home,
  Archive,
  Edit3,
  CheckCircle,
  XCircle,
  MessageSquare,
  Eye,
  ChevronRight
} from 'lucide-react';

type ReviewTab = 'medical' | 'foster' | 'archive';

export default function ReviewCenter() {
  const navigate = useNavigate();
  const { cases, medicalRecords, fosterRecords, reviewLogs, addReviewLog, addTimelineEvent } = useCaseStore();
  const currentUser = useUserStore((state) => state.currentUser);
  const getUserName = useUserStore((state) => state.getUserName);

  const [activeTab, setActiveTab] = useState<ReviewTab>('medical');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [supplementReason, setSupplementReason] = useState('');

  const pendingMedicalReviews = medicalRecords.filter(r => !r.reviewed);
  const pendingFosterReviews = fosterRecords.filter(f => f.status === 'ended' && !reviewLogs.some(r => r.caseId === f.caseId && r.type === 'foster'));
  const pendingArchiveReviews = cases.filter(c => c.status === 'adopted' && !reviewLogs.some(r => r.caseId === c.id && r.type === 'archive'));

  const getReviewItems = () => {
    switch (activeTab) {
      case 'medical':
        return pendingMedicalReviews.map(r => {
          const caseData = cases.find(c => c.id === r.caseId);
          return {
            ...r,
            caseName: caseData?.animalName,
            caseNo: caseData?.caseNo,
          };
        });
      case 'foster':
        return pendingFosterReviews.map(r => {
          const caseData = cases.find(c => c.id === r.caseId);
          return {
            ...r,
            caseName: caseData?.animalName,
            caseNo: caseData?.caseNo,
          };
        });
      case 'archive':
        return pendingArchiveReviews.map(c => ({
          id: c.id,
          caseId: c.id,
          caseName: c.animalName,
          caseNo: c.caseNo,
          status: c.status,
        }));
      default:
        return [];
    }
  };

  const reviewItems = getReviewItems();

  const handleReview = (status: 'approved' | 'rejected' | 'supplement_needed') => {
    if (!selectedItem || !reviewNotes) return;

    const typeMap: Record<ReviewTab, 'medical' | 'foster' | 'archive'> = {
      medical: 'medical',
      foster: 'foster',
      archive: 'archive',
    };

    const newReview: ReviewLog = {
      id: `rl_${Date.now()}`,
      caseId: selectedItem.caseId,
      type: typeMap[activeTab],
      status,
      reviewer: currentUser.id,
      reviewNotes,
      supplementReason: status === 'supplement_needed' ? supplementReason : undefined,
      createdAt: new Date().toISOString(),
    };

    addReviewLog(newReview);

    const titleMap = {
      medical: '医疗记录复核',
      foster: '寄养记录复核',
      archive: '归档复核',
    };

    addTimelineEvent({
      id: `te_${Date.now()}`,
      caseId: selectedItem.caseId,
      type: 'review',
      title: `${titleMap[activeTab]}：${status === 'approved' ? '通过' : status === 'rejected' ? '拒绝' : '需补录'}`,
      description: reviewNotes,
      operator: currentUser.id,
      timestamp: new Date().toISOString(),
    });

    if (status === 'supplement_needed' && supplementReason) {
      addTimelineEvent({
        id: `te_${Date.now() + 1}`,
        caseId: selectedItem.caseId,
        type: 'supplement',
        title: '信息补录通知',
        description: `需要补录：${supplementReason}`,
        operator: currentUser.id,
        timestamp: new Date().toISOString(),
      });
    }

    setShowDetailModal(false);
    setSelectedItem(null);
    setReviewNotes('');
    setSupplementReason('');
  };

  const tabs = [
    { id: 'medical', label: '医疗费用', icon: Stethoscope, count: pendingMedicalReviews.length },
    { id: 'foster', label: '寄养记录', icon: Home, count: pendingFosterReviews.length },
    { id: 'archive', label: '个案归档', icon: Archive, count: pendingArchiveReviews.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-800 font-serif">复核中心</h1>
        <p className="text-warm-500 mt-1">处理医疗费用、寄养记录和个案归档的复核工作</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReviewTab)}
              className={`card p-4 text-left transition-all ${
                isActive ? 'border-primary-500 ring-2 ring-primary-100' : 'card-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-primary-100' : 'bg-warm-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-warm-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-warm-800">{tab.label}复核</p>
                  <p className="text-sm text-warm-500">待处理</p>
                </div>
                <span className={`text-2xl font-bold ${
                  tab.count > 0 ? 'text-primary-600' : 'text-warm-400'
                }`}>
                  {tab.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-secondary-600" />
            <h2 className="section-title mb-0">
              待{tabs.find(t => t.id === activeTab)?.label}复核列表
            </h2>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
            <input
              type="text"
              placeholder="搜索个案名称或编号..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
        </div>

        {reviewItems.length > 0 ? (
          <div className="space-y-3">
            {reviewItems.map((item: any) => (
              <div 
                key={item.id} 
                className="p-4 bg-warm-50 rounded-xl hover:bg-warm-100 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {activeTab === 'medical' && <Stethoscope className="w-6 h-6 text-red-500" />}
                      {activeTab === 'foster' && <Home className="w-6 h-6 text-primary-500" />}
                      {activeTab === 'archive' && <Archive className="w-6 h-6 text-warm-500" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-warm-800">
                        {item.caseName}
                        <span className="text-sm text-warm-400 ml-2 font-mono">{item.caseNo}</span>
                      </h4>
                      {activeTab === 'medical' && (
                        <p className="text-sm text-warm-500">
                          {item.diagnosis} · 费用：{formatCurrency(item.cost)}
                        </p>
                      )}
                      {activeTab === 'foster' && (
                        <p className="text-sm text-warm-500">
                          寄养家庭：{item.fosterFamilyName}
                        </p>
                      )}
                      {activeTab === 'archive' && (
                        <p className="text-sm text-warm-500">
                          状态：已领养，待归档
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-warm-400">
                      {formatDateTime(item.createdAt || item.visitDate || item.updatedAt)}
                    </span>
                    <button 
                      className="btn btn-ghost text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/case/${item.caseId}`);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                    <ChevronRight className="w-5 h-5 text-warm-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-warm-500">暂无待复核项目</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`复核${tabs.find(t => t.id === activeTab)?.label}记录`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="bg-warm-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <h4 className="font-semibold text-warm-800">{selectedItem.caseName}</h4>
                <span className="text-sm text-warm-400 font-mono">{selectedItem.caseNo}</span>
              </div>
              
              {activeTab === 'medical' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-500">就诊日期</span>
                    <span className="text-warm-700">{selectedItem.visitDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">诊断</span>
                    <span className="text-warm-700">{selectedItem.diagnosis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">治疗方案</span>
                    <span className="text-warm-700">{selectedItem.treatment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">费用</span>
                    <span className="text-warm-700 font-medium">{formatCurrency(selectedItem.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">健康状态</span>
                    <StatusTag type="health" status={selectedItem.healthStatus} />
                  </div>
                  <div className="pt-2 border-t border-warm-200">
                    <p className="text-warm-500 mb-1">备注</p>
                    <p className="text-warm-700">{selectedItem.notes}</p>
                  </div>
                </div>
              )}

              {activeTab === 'foster' && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-warm-500">寄养家庭</span>
                    <span className="text-warm-700">{selectedItem.fosterFamilyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-500">寄养周期</span>
                    <span className="text-warm-700">
                      {selectedItem.startDate} - {selectedItem.endDate || '进行中'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-warm-200">
                    <p className="text-warm-500 mb-1">关键判断</p>
                    <p className="text-warm-700">{selectedItem.keyJudgment}</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="label">复核意见 <span className="text-red-500">*</span></label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="请填写复核意见..."
                className="input min-h-[80px] resize-none"
              />
            </div>

            <div>
              <label className="label">补录说明（如选择需补录）</label>
              <textarea
                value={supplementReason}
                onChange={(e) => setSupplementReason(e.target.value)}
                placeholder="如需退回补录，请说明需要补录的内容..."
                className="input min-h-[60px] resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
              <button 
                className="btn btn-outline"
                onClick={() => setShowDetailModal(false)}
              >
                取消
              </button>
              <button 
                className="btn btn-outline text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => handleReview('supplement_needed')}
                disabled={!reviewNotes}
              >
                <Edit3 className="w-4 h-4" />
                需补录
              </button>
              <button 
                className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleReview('rejected')}
                disabled={!reviewNotes}
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleReview('approved')}
                disabled={!reviewNotes}
              >
                <CheckCircle className="w-4 h-4" />
                通过
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
