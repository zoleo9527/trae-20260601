import { StageReview, ReviewStatus, Role } from '../types';

interface ReviewListProps {
  reviews: StageReview[];
  onViewDetail: (review: StageReview) => void;
  onReview: (review: StageReview) => void;
  onConfirm: (review: StageReview) => void;
  currentRole?: Role;
}

const statusConfig: Record<ReviewStatus, { label: string; className: string }> = {
  '待点评': { label: '待点评', className: 'bg-purple-100 text-purple-700' },
  '已点评': { label: '已点评', className: 'bg-blue-100 text-blue-700' },
  '待确认': { label: '待确认', className: 'bg-orange-100 text-orange-700' },
  '已完成': { label: '已完成', className: 'bg-green-100 text-green-700' },
};

export function ReviewList({ reviews, onViewDetail, onReview, onConfirm, currentRole }: ReviewListProps) {
  const canReview = (review: StageReview): boolean => {
    return currentRole === '任课老师' && review.status === '待点评';
  };

  const canConfirm = (review: StageReview): boolean => {
    return currentRole === '家长顾问' && review.status === '待确认';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-800">阶段点评记录</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {reviews.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">暂无记录</div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-medium text-gray-800">{review.studentName}</span>
                    <span className="text-sm text-gray-500">{review.instrument}</span>
                    <span className="text-sm text-gray-400">{review.stage}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[review.status].className}`}>
                      {statusConfig[review.status].label}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="mr-4">📅 {review.startDate} ~ {review.endDate}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    <span className="font-medium">综合评价：</span>{review.overallEvaluation}
                  </div>
                  {review.relatedPracticeNotes.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {review.relatedPracticeNotes.map((note, index) => (
                        <span key={index} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded">
                          陪练备注: {note}
                        </span>
                      ))}
                    </div>
                  )}
                  {(review.reviewedBy || review.confirmedBy) && (
                    <div className="mt-1 text-xs text-gray-400">
                      {review.reviewedBy && `点评人: ${review.reviewedBy}`}
                      {review.confirmedBy && ` · 确认人: ${review.confirmedBy}`}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => onViewDetail(review)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    查看
                  </button>
                  {canReview(review) && (
                    <button
                      onClick={() => onReview(review)}
                      className="px-3 py-1.5 text-sm bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
                    >
                      点评
                    </button>
                  )}
                  {canConfirm(review) && (
                    <button
                      onClick={() => onConfirm(review)}
                      className="px-3 py-1.5 text-sm bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors"
                    >
                      确认
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}