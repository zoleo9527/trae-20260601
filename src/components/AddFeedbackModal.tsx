import React, { useState } from 'react';
import { X, User, Calendar, Tag, Send } from 'lucide-react';
import { PerformanceLevel } from '@/types';
import { useStudentStore } from '@/store/useStudentStore';
import { useFeedbackStore } from '@/store/useFeedbackStore';
import { logOperation } from '@/store/useOperationLogStore';
import { StatusBadge } from './StatusBadge';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';

interface AddFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string;
}

const performanceOptions: { value: PerformanceLevel; label: string }[] = [
  { value: 'excellent', label: '优秀' },
  { value: 'good', label: '良好' },
  { value: 'average', label: '一般' },
  { value: 'poor', label: '待提升' },
];

const commonTags = [
  '注意力下降',
  '进步显著',
  '基本功扎实',
  '需加强练习',
  '课堂纪律待加强',
  '情绪低落',
  '学业压力大',
  '出勤率低',
  '考级重点培养',
  '乐于助人',
  '学习态度好',
  '适应期',
];

export const AddFeedbackModal: React.FC<AddFeedbackModalProps> = ({
  isOpen,
  onClose,
  defaultStudentId,
}) => {
  const { students } = useStudentStore();
  const { addFeedback } = useFeedbackStore();

  const [studentId, setStudentId] = useState(defaultStudentId || '');
  const [className, setClassName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [performance, setPerformance] = useState<PerformanceLevel>('good');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const selectedStudent = students.find(s => s.id === studentId);

  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    const student = students.find(s => s.id === id);
    if (student) {
      setClassName(student.className);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = () => {
    if (!studentId || !content.trim()) return;

    addFeedback({
      studentId,
      date,
      className,
      teacher: teacher || '王老师',
      content: content.trim(),
      performance,
      tags: selectedTags,
    });

    logOperation(
      'feedback',
      studentId,
      '新增课堂反馈',
      '王老师',
      `课堂表现：${performanceOptions.find(p => p.value === performance)?.label}，${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
    );

    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStudentId('');
    setClassName('');
    setTeacher('');
    setDate(new Date().toISOString().split('T')[0]);
    setContent('');
    setPerformance('good');
    setSelectedTags([]);
    setCustomTag('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <h2 className="font-serif text-xl font-semibold text-ink-900">
            新增课堂反馈
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-400 hover:text-ink-600 hover:bg-cream-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                选择学员
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-cream-50 rounded-lg">
                {students.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleStudentSelect(student.id)}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg text-left transition-all',
                      studentId === student.id
                        ? 'bg-wine-50 border-2 border-wine-300'
                        : 'bg-white border border-cream-200 hover:border-cream-300'
                    )}
                  >
                    <Avatar name={student.name} size="sm" gender={student.gender} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">
                        {student.name}
                      </p>
                      <p className="text-xs text-ink-500 truncate">
                        {student.className}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedStudent && (
              <div className="p-3 bg-gold-50 rounded-lg border border-gold-100">
                <p className="text-sm text-gold-700">
                  <span className="font-medium">已选学员：</span>
                  {selectedStudent.name} · {selectedStudent.className} · {selectedStudent.level}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  反馈日期
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  授课老师
                </label>
                <input
                  type="text"
                  value={teacher}
                  onChange={e => setTeacher(e.target.value)}
                  placeholder="请输入老师姓名"
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                课堂表现
              </label>
              <div className="flex gap-2">
                {performanceOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPerformance(option.value)}
                    className={cn(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                      performance === option.value
                        ? 'bg-wine-50 text-wine-700 border-wine-300'
                        : 'bg-white text-ink-600 border-cream-200 hover:border-cream-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                关键标签
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-all border',
                      selectedTags.includes(tag)
                        ? 'bg-gold-100 text-gold-700 border-gold-300'
                        : 'bg-white text-ink-600 border-cream-200 hover:border-cream-300'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  placeholder="自定义标签"
                  className="input-base flex-1 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddCustomTag()}
                />
                <button
                  onClick={handleAddCustomTag}
                  className="btn-secondary text-sm"
                >
                  添加
                </button>
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs text-ink-500">已选：</span>
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="hover:text-gold-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                反馈内容
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="请详细描述学员本节课的表现、进步点、待提升项以及给家长的建议..."
                className="input-base min-h-[120px] resize-none"
              />
              <p className="text-xs text-ink-400 mt-1 text-right">
                {content.length} / 500
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cream-200 bg-cream-50/50">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!studentId || !content.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            提交反馈
          </button>
        </div>
      </div>
    </div>
  );
};
