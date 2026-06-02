import { useState } from 'react';
import { X, Camera, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import {
  RECORD_TYPE_LABELS,
  RECORD_TYPE_ICONS,
  RECORD_TYPE_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  QUICK_TAGS,
} from '@/types';
import type {
  RecordType,
  Severity,
  Child,
  QuickRecordForm,
} from '@/types';

interface QuickRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
  defaultChildId?: string;
}

const recordTypes: RecordType[] = ['arrival', 'meal', 'nap', 'mood', 'health', 'other'];
const severityLevels: Severity[] = ['normal', 'warning', 'danger'];

export default function QuickRecordModal({
  isOpen,
  onClose,
  children,
  defaultChildId,
}: QuickRecordModalProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const addRecord = useAppStore((state) => state.addRecord);

  const [selectedChildId, setSelectedChildId] = useState<string>(
    defaultChildId || children[0]?.id || ''
  );
  const [selectedType, setSelectedType] = useState<RecordType>('arrival');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<Severity>('normal');
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!selectedChildId || !currentUser) return;

    const formData: QuickRecordForm = {
      childId: selectedChildId,
      type: selectedType,
      content: content.trim(),
      tags: selectedTags,
      severity,
      photoIds: [],
    };

    addRecord(formData);

    setSelectedTags([]);
    setContent('');
    setSeverity('normal');
    onClose();
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    setShowChildDropdown(false);
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[90vh] overflow-hidden animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">快速记录</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择孩子
            </label>
            <button
              onClick={() => setShowChildDropdown(!showChildDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl text-left hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {selectedChild && (
                  <>
                    <img
                      src={selectedChild.avatar}
                      alt={selectedChild.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-800">
                      {selectedChild.name}
                    </span>
                  </>
                )}
              </div>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-400 transition-transform',
                  showChildDropdown && 'rotate-180'
                )}
              />
            </button>

            {showChildDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-soft-lg border border-gray-100 overflow-hidden z-10 max-h-48 overflow-y-auto">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildSelect(child.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors',
                      child.id === selectedChildId && 'bg-info-50'
                    )}
                  >
                    <img
                      src={child.avatar}
                      alt={child.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="font-medium text-gray-800">
                      {child.name}
                    </span>
                    {child.id === selectedChildId && (
                      <Check className="w-5 h-5 text-info-500 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              记录类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {recordTypes.map((type) => {
                const isSelected = selectedType === type;
                const colorClass = RECORD_TYPE_COLORS[type];

                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setSelectedTags([]);
                    }}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2',
                      isSelected
                        ? cn(colorClass, 'border-transparent')
                        : 'bg-gray-50 border-transparent hover:border-gray-200'
                    )}
                  >
                    <span className="text-2xl">{RECORD_TYPE_ICONS[type]}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isSelected ? 'inherit' : 'text-gray-600'
                      )}
                    >
                      {RECORD_TYPE_LABELS[type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              快捷标签
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS[selectedType].map((tag) => {
                const isSelected = selectedTags.includes(tag);

                return (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-all border',
                      isSelected
                        ? 'bg-info-500 text-white border-info-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-info-300'
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入记录详情..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-info-300 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              严重程度
            </label>
            <div className="flex gap-3">
              {severityLevels.map((level) => {
                const isSelected = severity === level;
                const colorClass = SEVERITY_COLORS[level];

                return (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    className={cn(
                      'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border-2',
                      isSelected
                        ? cn(colorClass, 'border-transparent')
                        : 'bg-gray-50 text-gray-600 border-transparent hover:border-gray-200'
                    )}
                  >
                    {SEVERITY_LABELS[level]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              添加照片
            </label>
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-gray-50 rounded-xl text-gray-400 text-sm border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>点击上传照片（开发中）</span>
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!selectedChildId || !currentUser}
            className={cn(
              'w-full py-3.5 rounded-xl font-medium transition-all',
              selectedChildId && currentUser
                ? 'bg-info-500 hover:bg-info-600 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            保存记录
          </button>
        </div>
      </div>
    </div>
  );
}
