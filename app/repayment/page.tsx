"use client";

import { useState, useMemo } from 'react';
import { Role, PracticeRecord, StageReview, PracticeStatus, ReviewStatus } from '../../types';
import { mockPracticeRecords, mockStageReviews, mockDashboardStats } from '../../data/mockData';
import { Layout } from '../../components/Layout';
import { RoleSelector } from '../../components/RoleSelector';
import { StatsCards } from '../../components/StatsCards';
import { FilterBar } from '../../components/FilterBar';
import { PracticeList } from '../../components/PracticeList';
import { ReviewList } from '../../components/ReviewList';
import { Modal } from '../../components/Modal';
import { PracticeHandleForm } from '../../components/PracticeHandleForm';
import { ReviewForm } from '../../components/ReviewForm';
import { PracticeDetailView } from '../../components/PracticeDetailView';
import { ReviewDetailView } from '../../components/ReviewDetailView';

type ModalType = 'practice-detail' | 'practice-handle' | 'review-detail' | 'review-edit' | 'review-confirm';

export default function Home() {
  const [currentRole, setCurrentRole] = useState<Role>('教务老师');
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>(mockPracticeRecords);
  const [stageReviews, setStageReviews] = useState<StageReview[]>(mockStageReviews);
  const [filters, setFilters] = useState<{
    studentName?: string;
    instrument?: string;
    status?: PracticeStatus | ReviewStatus;
  }>({});
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('practice-detail');
  const [selectedPractice, setSelectedPractice] = useState<PracticeRecord | null>(null);
  const [selectedReview, setSelectedReview] = useState<StageReview | null>(null);

  const filteredPracticeRecords = useMemo(() => {
    return practiceRecords.filter((record) => {
      if (filters.studentName && !record.studentName.includes(filters.studentName)) return false;
      if (filters.instrument && record.instrument !== filters.instrument) return false;
      if (filters.status && record.status !== filters.status) return false;
      return true;
    });
  }, [practiceRecords, filters]);

  const filteredStageReviews = useMemo(() => {
    return stageReviews.filter((review) => {
      if (filters.studentName && !review.studentName.includes(filters.studentName)) return false;
      if (filters.instrument && review.instrument !== filters.instrument) return false;
      if (filters.status && review.status !== filters.status) return false;
      return true;
    });
  }, [stageReviews, filters]);

  const stats = mockDashboardStats[currentRole];

  const handleViewPracticeDetail = (record: PracticeRecord) => {
    setSelectedPractice(record);
    setModalType('practice-detail');
    setModalOpen(true);
  };

  const handleHandlePractice = (record: PracticeRecord) => {
    setSelectedPractice(record);
    setModalType('practice-handle');
    setModalOpen(true);
  };

  const handleSubmitPractice = (recordId: string, note: string, status: PracticeStatus) => {
    setPracticeRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              note,
              status,
              updatedAt: new Date().toLocaleString('zh-CN'),
              handledBy: currentRole,
            }
          : record
      )
    );
    setModalOpen(false);
  };

  const handleViewReviewDetail = (review: StageReview) => {
    setSelectedReview(review);
    setModalType('review-detail');
    setModalOpen(true);
  };

  const handleReview = (review: StageReview) => {
    setSelectedReview(review);
    setModalType('review-edit');
    setModalOpen(true);
  };

  const handleSubmitReview = (reviewId: string, data: Partial<StageReview>) => {
    setStageReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              ...data,
              status: '待确认',
              updatedAt: new Date().toLocaleString('zh-CN'),
              reviewedBy: currentRole,
            }
          : review
      )
    );
    setModalOpen(false);
  };

  const handleConfirmReview = (review: StageReview) => {
    setStageReviews((prev) =>
      prev.map((r) =>
        r.id === review.id
          ? {
              ...r,
              status: '已完成',
              updatedAt: new Date().toLocaleString('zh-CN'),
              confirmedBy: currentRole,
            }
          : r
      )
    );
    setModalOpen(false);
  };

  const getRelatedPracticeNotes = (review: StageReview): string[] => {
    return practiceRecords
      .filter((record) => record.studentId === review.studentId && record.status === '已确认' && record.note)
      .map((record) => record.note);
  };

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">工作台</h2>
          <RoleSelector currentRole={currentRole} onRoleChange={setCurrentRole} />
        </div>
        
        <StatsCards stats={stats} />
      </div>

      <FilterBar role={currentRole} onFilterChange={setFilters} />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <PracticeList
          records={filteredPracticeRecords}
          onViewDetail={handleViewPracticeDetail}
          onHandle={handleHandlePractice}
        />
        <ReviewList
          reviews={filteredStageReviews}
          onViewDetail={handleViewReviewDetail}
          onReview={handleReview}
          onConfirm={handleConfirmReview}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'practice-detail'
            ? '陪练打卡详情'
            : modalType === 'practice-handle'
            ? '处理陪练打卡'
            : modalType === 'review-detail'
            ? '阶段点评详情'
            : modalType === 'review-edit'
            ? '编辑阶段点评'
            : '确认阶段点评'
        }
      >
        {modalType === 'practice-detail' && selectedPractice && (
          <PracticeDetailView record={selectedPractice} />
        )}
        {modalType === 'practice-handle' && selectedPractice && (
          <PracticeHandleForm
            record={selectedPractice}
            onSubmit={handleSubmitPractice}
            onCancel={() => setModalOpen(false)}
          />
        )}
        {modalType === 'review-detail' && selectedReview && (
          <ReviewDetailView review={selectedReview} />
        )}
        {modalType === 'review-edit' && selectedReview && (
          <ReviewForm
            review={selectedReview}
            relatedNotes={getRelatedPracticeNotes(selectedReview)}
            onSubmit={handleSubmitReview}
            onCancel={() => setModalOpen(false)}
          />
        )}
        {modalType === 'review-confirm' && selectedReview && (
          <div className="space-y-4">
            <ReviewDetailView review={selectedReview} />
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleConfirmReview(selectedReview)}
                className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
              >
                确认点评
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
