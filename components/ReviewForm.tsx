import { useState } from 'react';
import { StageReview } from '../types';

interface ReviewFormProps {
  review: StageReview;
  relatedNotes: string[];
  onSubmit: (reviewId: string, data: Partial<StageReview>) => void;
  onCancel: () => void;
}

export function ReviewForm({ review, relatedNotes, onSubmit, onCancel }: ReviewFormProps) {
  const [overallEvaluation, setOverallEvaluation] = useState(review.overallEvaluation);
  const [technique, setTechnique] = useState(review.skillsEvaluation.technique);
  const [expression, setExpression] = useState(review.skillsEvaluation.expression);
  const [rhythm, setRhythm] = useState(review.skillsEvaluation.rhythm);
  const [progress, setProgress] = useState(review.skillsEvaluation.progress);
  const [improvementSuggestions, setImprovementSuggestions] = useState(review.improvementSuggestions);
  const [nextStageGoals, setNextStageGoals] = useState(review.nextStageGoals);

  const handleSubmit = () => {
    onSubmit(review.id, {
      overallEvaluation,
      skillsEvaluation: { technique, expression, rhythm, progress },
      improvementSuggestions,
      nextStageGoals,
      relatedPracticeNotes: relatedNotes,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">学生姓名</label>
          <input
            type="text"
            value={review.studentName}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">乐器</label>
          <input
            type="text"
            value={review.instrument}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
          <input
            type="text"
            value={review.stage}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">周期</label>
          <input
            type="text"
            value={`${review.startDate} ~ ${review.endDate}`}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
          />
        </div>
      </div>

      {relatedNotes.length > 0 && (
        <div className="bg-primary-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-primary-700 mb-2">关联陪练备注</label>
          <div className="space-y-2">
            {relatedNotes.map((note, index) => (
              <div key={index} className="text-sm text-primary-600 bg-white px-3 py-2 rounded border border-primary-200">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">综合评价</label>
        <textarea
          value={overallEvaluation}
          onChange={(e) => setOverallEvaluation(e.target.value)}
          rows={3}
          placeholder="请输入综合评价"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">技能评分</label>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '技巧', value: technique, setter: setTechnique },
            { label: '表现力', value: expression, setter: setExpression },
            { label: '节奏感', value: rhythm, setter: setRhythm },
            { label: '进步度', value: progress, setter: setProgress },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.label}</span>
                <span className="font-medium">{item.value}分</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={item.value}
                onChange={(e) => item.setter(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">改进建议</label>
        <textarea
          value={improvementSuggestions}
          onChange={(e) => setImprovementSuggestions(e.target.value)}
          rows={3}
          placeholder="请输入改进建议"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">下一阶段目标</label>
        <textarea
          value={nextStageGoals}
          onChange={(e) => setNextStageGoals(e.target.value)}
          rows={3}
          placeholder="请输入下一阶段目标"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
        >
          提交点评
        </button>
      </div>
    </div>
  );
}
