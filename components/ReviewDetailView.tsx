import { StageReview, ReviewStatus } from '../types';

interface ReviewDetailViewProps {
  review: StageReview;
}

const statusConfig: Record<ReviewStatus, { label: string; className: string }> = {
  '待点评': { label: '待点评', className: 'bg-purple-100 text-purple-700' },
  '已点评': { label: '已点评', className: 'bg-blue-100 text-blue-700' },
  '待确认': { label: '待确认', className: 'bg-orange-100 text-orange-700' },
  '已完成': { label: '已完成', className: 'bg-green-100 text-green-700' },
};

export function ReviewDetailView({ review }: ReviewDetailViewProps) {
  const avgScore = Math.round(
    (review.skillsEvaluation.technique +
      review.skillsEvaluation.expression +
      review.skillsEvaluation.rhythm +
      review.skillsEvaluation.progress) / 4
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">学生姓名</label>
          <span className="text-lg font-medium text-gray-800">{review.studentName}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">状态</label>
          <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusConfig[review.status].className}`}>
            {statusConfig[review.status].label}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">乐器</label>
          <span className="text-gray-800">{review.instrument}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">阶段</label>
          <span className="text-gray-800">{review.stage}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">周期</label>
          <span className="text-gray-800">{review.startDate} ~ {review.endDate}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">点评人</label>
          <span className="text-gray-800">{review.reviewedBy || '-'}</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600">{avgScore}</div>
            <div className="text-sm text-gray-500">综合评分</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {[
            { label: '技巧', value: review.skillsEvaluation.technique },
            { label: '表现力', value: review.skillsEvaluation.expression },
            { label: '节奏感', value: review.skillsEvaluation.rhythm },
            { label: '进步度', value: review.skillsEvaluation.progress },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-xl font-semibold text-gray-800">{item.value}</div>
              <div className="text-xs text-gray-500">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">综合评价</label>
        <div className="bg-gray-50 rounded-lg p-3 text-gray-800">{review.overallEvaluation}</div>
      </div>

      {review.relatedPracticeNotes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">关联陪练备注</label>
          <div className="space-y-2">
            {review.relatedPracticeNotes.map((note, index) => (
              <div key={index} className="bg-primary-50 rounded-lg p-3 text-primary-800">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">改进建议</label>
        <div className="bg-warning-50 rounded-lg p-3 text-warning-800">{review.improvementSuggestions}</div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">下一阶段目标</label>
        <div className="bg-success-50 rounded-lg p-3 text-success-800">{review.nextStageGoals}</div>
      </div>

      <div className="flex justify-between text-sm text-gray-400 pt-4 border-t border-gray-200">
        <span>创建时间: {review.createdAt}</span>
        <span>更新时间: {review.updatedAt}</span>
      </div>
    </div>
  );
}
