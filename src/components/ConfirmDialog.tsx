import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = '确定要离开吗？',
  description = '您有未保存的内容，离开后将丢失所有未保存的改动。',
  confirmText = '确定离开',
  cancelText = '继续编辑',
  confirmButtonClass = 'bg-red-500 hover:bg-red-600 text-white',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn"
        onClick={onCancel}
      />
      <div className="relative w-[400px] bg-white rounded-xl shadow-elevated overflow-hidden animate-slideInUp border border-slate-200">
        <div className="flex items-start gap-3 p-5 pb-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <button
                onClick={onCancel}
                className="p-0.5 rounded hover:bg-slate-100 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors',
              confirmButtonClass
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
