import React, { useState, useEffect } from 'react';
import { X, User, AlertTriangle, Tag, Send } from 'lucide-react';
import { ExceptionType, ExceptionPriority } from '@/types';
import { useStudentStore } from '@/store/useStudentStore';
import { useExceptionStore } from '@/store/useExceptionStore';
import { logOperation } from '@/store/useOperationLogStore';
import { Avatar } from './Avatar';
import { cn } from '@/lib/utils';

interface AddExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string;
  onSuccess?: (newExceptionId: string) => void;
}

const typeOptions: { value: ExceptionType; label: string }[] = [
  { value: 'exam', label: '考级相关' },
  { value: 'costume', label: '服装相关' },
  { value: 'schedule', label: '调课考勤' },
  { value: 'other', label: '其他异常' },
];

const priorityOptions: { value: ExceptionPriority; label: string; color: string }[] = [
  { value: 'high', label: '高优先级', color: 'wine' },
  { value: 'medium', label: '中优先级', color: 'amber' },
  { value: 'low', label: '低优先级', color: 'emerald' },
];

export const AddExceptionModal: React.FC<AddExceptionModalProps> = ({
  isOpen,
  onClose,
  defaultStudentId,
  onSuccess,
}) => {
  const { students } = useStudentStore();
  const { addException } = useExceptionStore();

  const [type, setType] = useState<ExceptionType>('exam');
  const [priority, setPriority] = useState<ExceptionPriority>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentId, setStudentId] = useState('');
  const [className, setClassName] = useState('');
  const [reportedBy, setReportedBy] = useState('前台教务-小王');

  useEffect(() => {
    if (isOpen && defaultStudentId) {
      setStudentId(defaultStudentId);
      const student = students.find(s => s.id === defaultStudentId);
      if (student) {
        setClassName(student.className);
      }
    }
  }, [isOpen, defaultStudentId, students]);

  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    const student = students.find(s => s.id === id);
    if (student) {
      setClassName(student.className);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return;

    const newExceptionId = addException({
      type,
      title: title.trim(),
      description: description.trim(),
      studentId: studentId || undefined,
      className: className || undefined,
      priority,
      reportedBy,
      reportedAt: new Date().toISOString(),
    });

    logOperation(
      'exception',
      newExceptionId,
      title.trim(),
      '登记异常',
      reportedBy,
      `登记[${typeOptions.find(t => t.value === type)?.label}]异常：${title.trim()}`
    );

    onClose();
    resetForm();
    onSuccess?.(newExceptionId);
  };

  const resetForm = () => {
    setType('exam');
    setPriority('medium');
    setTitle('');
    setDescription('');
    if (defaultStudentId) {
      setStudentId(defaultStudentId);
      const student = students.find(s => s.id === defaultStudentId);
      setClassName(student?.className || '');
    } else {
      setStudentId('');
      setClassName('');
    }
    setReportedBy('前台教务-小王');
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
            登记异常
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
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                异常类型
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {typeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setType(option.value)}
                    className={cn(
                      'py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                      type === option.value
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
                优先级
              </label>
              <div className="grid grid-cols-3 gap-2">
                {priorityOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setPriority(option.value)}
                    className={cn(
                      'py-2 px-3 rounded-lg text-sm font-medium transition-all border',
                      priority === option.value
                        ? option.color === 'wine'
                          ? 'bg-wine-50 text-wine-700 border-wine-300'
                          : option.color === 'amber'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-300'
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
                异常标题 *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="请简要描述异常问题，如：考级报名漏人"
                className="input-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                详细描述 *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="请详细描述异常情况、涉及人员、处理建议..."
                className="input-base min-h-[100px] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                关联学员（可选）
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-cream-50 rounded-lg">
                <button
                  onClick={() => setStudentId('')}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg text-left transition-all',
                    studentId === ''
                      ? 'bg-wine-50 border-2 border-wine-300'
                      : 'bg-white border border-cream-200 hover:border-cream-300'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center text-xs text-ink-500">
                    无
                  </div>
                  <span className="text-sm text-ink-700">不关联学员</span>
                </button>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  涉及班级（可选）
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="如：中国舞六级班"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  上报人
                </label>
                <input
                  type="text"
                  value={reportedBy}
                  onChange={e => setReportedBy(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cream-200 bg-cream-50/50">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            提交登记
          </button>
        </div>
      </div>
    </div>
  );
};
