"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Role, PracticeRecord, StageReview, PracticeStatus, ReviewStatus } from '../../types';
import {
  getPracticeRecords,
  getStageReviews,
  getTodayPendingRecords,
  getOverdueRecords,
  getReturnedRecords,
  getPendingReviews,
  getWaitingConfirmReviews,
  handlePracticeRecord,
  submitStageReview,
  confirmStageReview,
  getDashboardStats,
} from '../../actions/dataActions';
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

interface DashboardStatsExtended {
  todayPending: number;
  overdueCount: number;
  returnedCount: number;
  pendingReviews: number;
  waitingConfirm: number;
}

function WorkbenchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = searchParams.get('role');
  
  const [currentRole, setCurrentRole] = useState<Role>(
    (roleParam as Role) || '教务老师'
  );
  const [practiceRecords, setPracticeRecords] = useState<PracticeRecord[]>([]);
  const [stageReviews, setStageReviews] = useState<StageReview[]>([]);
  const [stats, setStats] = useState<DashboardStatsExtended>({
    todayPending: 0,
    overdueCount: 0,
    returnedCount: 0,
    pendingReviews: 0,
    waitingConfirm: 0,
  });
  const [todayPending, setTodayPending] = useState<PracticeRecord[]>([]);
  const [overdueRecords, setOverdueRecords] = useState<PracticeRecord[]>([]);
  const [returnedRecords, setReturnedRecords] = useState<PracticeRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<StageReview[]>([]);
  const [waitingConfirm, setWaitingConfirm] = useState<StageReview[]>([]);
  
  const [filters, setFilters] = useState<{
    studentName?: string;
    instrument?: string;
    practiceStatus?: PracticeStatus;
    reviewStatus?: ReviewStatus;
  }>({});
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('practice-detail');
  const [selectedPractice, setSelectedPractice] = useState<PracticeRecord | null>(null);
  const [selectedReview, setSelectedReview] = useState<StageReview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [practiceData, reviewData, statsData, today, overdue, returned, pending, waiting] = await Promise.all([
        getPracticeRecords(),
        getStageReviews(),
        getDashboardStats(currentRole),
        getTodayPendingRecords(),
        getOverdueRecords(),
        getReturnedRecords(),
        getPendingReviews(),
        getWaitingConfirmReviews(),
      ]);
      
      setPracticeRecords(practiceData);
      setStageReviews(reviewData);
      setStats(statsData);
      setTodayPending(today);
      setOverdueRecords(overdue);
      setReturnedRecords(returned);
      setPendingReviews(pending);
      setWaitingConfirm(waiting);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
    setLoading(false);
  }, [currentRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (roleParam && roleParam !== currentRole) {
      setCurrentRole(roleParam as Role);
    }
  }, [roleParam]);

  const handleRoleChange = (role: Role) => {
    setCurrentRole(role);
    router.push(`/repayment?role=${encodeURIComponent(role)}`);
  };

  const filteredPracticeRecords = useMemo(() => {
    let records = [...practiceRecords];
    
    if (currentRole === '教务老师') {
      records = records.filter(r => r.status === '待处理' || r.status === '已退回' || r.status === '超时');
    } else if (currentRole === '任课老师') {
      records = records.filter(r => r.status === '已确认' || r.status === '已完成');
    } else {
      records = records.filter(r => r.status === '已完成');
    }
    
    if (filters.studentName) {
      records = records.filter(r => r.studentName.includes(filters.studentName!));
    }
    if (filters.instrument) {
      records = records.filter(r => r.instrument === filters.instrument);
    }
    if (filters.practiceStatus) {
      records = records.filter(r => r.status === filters.practiceStatus);
    }
    
    return records;
  }, [practiceRecords, filters, currentRole]);

  const filteredStageReviews = useMemo(() => {
    let reviews = [...stageReviews];
    
    if (currentRole === '教务老师') {
      reviews = reviews.filter(r => r.status === '已完成');
    } else if (currentRole === '任课老师') {
      reviews = reviews.filter(r => {
        if (r.status === '待点评') {
          const hasConfirmedPractice = practiceRecords.some(
            p => p.reviewId === r.id && p.status === '已确认'
          );
          return hasConfirmedPractice;
        }
        return r.status === '已点评';
      });
    } else {
      reviews = reviews.filter(r => r.status === '待确认' || r.status === '已完成');
    }
    
    if (filters.studentName) {
      reviews = reviews.filter(r => r.studentName.includes(filters.studentName!));
    }
    if (filters.instrument) {
      reviews = reviews.filter(r => r.instrument === filters.instrument);
    }
    if (filters.reviewStatus) {
      reviews = reviews.filter(r => r.status === filters.reviewStatus);
    }
    
    return reviews;
  }, [stageReviews, practiceRecords, filters, currentRole]);

  const handleViewPracticeDetail = (record: PracticeRecord) => {
    setSelectedPractice(record);
    setModalType('practice-detail');
    setModalOpen(true);
  };

  const handleHandlePractice = (record: PracticeRecord) => {
    if (currentRole !== '教务老师') return;
    setSelectedPractice(record);
    setModalType('practice-handle');
    setModalOpen(true);
  };

  const handleSubmitPractice = async (recordId: string, note: string, status: PracticeStatus) => {
    const result = await handlePracticeRecord(recordId, note, status, currentRole);
    if (result.success) {
      await loadData();
      setModalOpen(false);
    }
  };

  const handleViewReviewDetail = (review: StageReview) => {
    setSelectedReview(review);
    setModalType('review-detail');
    setModalOpen(true);
  };

  const handleReview = (review: StageReview) => {
    if (currentRole !== '任课老师') return;
    setSelectedReview(review);
    setModalType('review-edit');
    setModalOpen(true);
  };

  const handleSubmitReview = async (reviewId: string, data: Partial<StageReview>) => {
    const result = await submitStageReview(reviewId, data, currentRole);
    if (result.success) {
      await loadData();
      setModalOpen(false);
    }
  };

  const handleConfirmReview = async (review: StageReview) => {
    if (currentRole !== '家长顾问') return;
    const result = await confirmStageReview(review.id, currentRole);
    if (result.success) {
      await loadData();
      setModalOpen(false);
    }
  };

  const getRelatedPracticeNotes = (review: StageReview): string[] => {
    return practiceRecords
      .filter((record) => record.reviewId === review.id && record.status === '已确认' && record.note)
      .map((record) => record.note);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-800">{currentRole}工作台</h2>
            <a href="/" className="text-sm text-primary-600 hover:text-primary-700">
              返回首页
            </a>
          </div>
          <RoleSelector currentRole={currentRole} onRoleChange={handleRoleChange} />
        </div>
        
        <StatsCards stats={{
          todayPending: stats.todayPending,
          overdueCount: stats.overdueCount,
          returnedCount: stats.returnedCount,
          totalStudents: practiceRecords.length + stageReviews.length,
        }} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">首屏待办区</h3>
        <div className="grid grid-cols-3 gap-6">
          {currentRole === '教务老师' && (
            <>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                  今日待处理 ({todayPending.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {todayPending.map(record => (
                    <div
                      key={record.id}
                      className="bg-primary-50 rounded-lg p-3 cursor-pointer hover:bg-primary-100 transition-colors"
                      onClick={() => handleHandlePractice(record)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{record.studentName}</div>
                        <button className="text-xs bg-primary-500 text-white px-2 py-1 rounded">处理</button>
                      </div>
                      <div className="text-sm text-gray-500">{record.instrument} · {record.duration}分钟</div>
                    </div>
                  ))}
                  {todayPending.length === 0 && (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无待处理记录</div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-danger-500 rounded-full animate-pulse"></span>
                  超时未处理 ({overdueRecords.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {overdueRecords.map(record => (
                    <div
                      key={record.id}
                      className="bg-danger-50 rounded-lg p-3 cursor-pointer hover:bg-danger-100 transition-colors border border-danger-200"
                      onClick={() => handleHandlePractice(record)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{record.studentName}</div>
                        <button className="text-xs bg-danger-500 text-white px-2 py-1 rounded">紧急处理</button>
                      </div>
                      <div className="text-sm text-danger-600">{record.practiceDate} · {record.instrument}</div>
                    </div>
                  ))}
                  {overdueRecords.length === 0 && (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无超时记录</div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></span>
                  刚退回 ({returnedRecords.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {returnedRecords.map(record => (
                    <div
                      key={record.id}
                      className="bg-warning-50 rounded-lg p-3 cursor-pointer hover:bg-warning-100 transition-colors border border-warning-200"
                      onClick={() => handleViewPracticeDetail(record)}
                    >
                      <div className="font-medium text-gray-800">{record.studentName}</div>
                      <div className="text-sm text-warning-600">{record.instrument}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">退回原因: {record.note}</div>
                    </div>
                  ))}
                  {returnedRecords.length === 0 && (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无退回记录</div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {currentRole === '任课老师' && (
            <>
              <div className="col-span-2">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                  待点评 ({pendingReviews.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {pendingReviews.map(review => (
                    <div
                      key={review.id}
                      className="bg-purple-50 rounded-lg p-3 cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200"
                      onClick={() => handleReview(review)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800">{review.studentName}</div>
                          <div className="text-sm text-gray-500">{review.instrument} · {review.stage}</div>
                        </div>
                        <button className="text-xs bg-purple-500 text-white px-3 py-1 rounded">撰写点评</button>
                      </div>
                      <div className="text-xs text-purple-600 mt-1">{review.startDate} ~ {review.endDate}</div>
                    </div>
                  ))}
                  {pendingReviews.length === 0 && (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无待点评记录</div>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></span>
                  需跟进 ({returnedRecords.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {returnedRecords.map(record => (
                    <div
                      key={record.id}
                      className="bg-warning-50 rounded-lg p-3 cursor-pointer hover:bg-warning-100 transition-colors"
                      onClick={() => handleViewPracticeDetail(record)}
                    >
                      <div className="font-medium text-gray-800">{record.studentName}</div>
                      <div className="text-sm text-warning-600">{record.instrument}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate">备注: {record.note}</div>
                    </div>
                  ))}
                  {returnedRecords.length === 0 && (
                    <div className="text-sm text-gray-400 py-4 text-center">暂无需跟进记录</div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {currentRole === '家长顾问' && (
            <>
              <div className="col-span-3">
                <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  待确认点评 ({waitingConfirm.length})
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {waitingConfirm.map(review => (
                    <div
                      key={review.id}
                      className="bg-orange-50 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors border border-orange-200"
                      onClick={() => {
                        setSelectedReview(review);
                        setModalType('review-confirm');
                        setModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-800">{review.studentName}</div>
                          <div className="text-sm text-gray-500">{review.instrument} · {review.stage}</div>
                        </div>
                        <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded">确认</button>
                      </div>
                      <div className="text-xs text-gray-500">{review.startDate} ~ {review.endDate}</div>
                      <div className="text-sm text-gray-600 mt-2 line-clamp-2">{review.overallEvaluation}</div>
                      {review.relatedPracticeNotes.length > 0 && (
                        <div className="mt-2 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          含{review.relatedPracticeNotes.length}条陪练备注
                        </div>
                      )}
                    </div>
                  ))}
                  {waitingConfirm.length === 0 && (
                    <div className="col-span-2 text-sm text-gray-400 py-8 text-center">暂无待确认点评</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <FilterBar role={currentRole} onFilterChange={setFilters} />

      <div className="grid grid-cols-2 gap-6 mt-6">
        {(currentRole === '教务老师' || currentRole === '任课老师') && (
          <PracticeList
            records={filteredPracticeRecords}
            onViewDetail={handleViewPracticeDetail}
            onHandle={handleHandlePractice}
            currentRole={currentRole}
          />
        )}
        
        {(currentRole === '任课老师' || currentRole === '家长顾问') && (
          <ReviewList
            reviews={filteredStageReviews}
            onViewDetail={handleViewReviewDetail}
            onReview={handleReview}
            onConfirm={handleConfirmReview}
            currentRole={currentRole}
            getPracticeNotes={(reviewId) => practiceRecords
              .filter(p => p.reviewId === reviewId && p.status === '已确认' && p.note)
              .map(p => p.note)}
          />
        )}
        
        {currentRole === '教务老师' && (
          <ReviewList
            reviews={filteredStageReviews}
            onViewDetail={handleViewReviewDetail}
            onReview={() => {}}
            onConfirm={() => {}}
            currentRole={currentRole}
            getPracticeNotes={(reviewId) => practiceRecords
              .filter(p => p.reviewId === reviewId && p.status === '已确认' && p.note)
              .map(p => p.note)}
          />
        )}
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
          <ReviewDetailView
            review={selectedReview}
            getPracticeNotes={(reviewId) => practiceRecords
              .filter(p => p.reviewId === reviewId && p.status === '已确认' && p.note)
              .map(p => p.note)}
          />
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

export default function WorkbenchPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    }>
      <WorkbenchContent />
    </Suspense>
  );
}