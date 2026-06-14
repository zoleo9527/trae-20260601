import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

export default function Modal({ open, title, onClose, children, width = 'max-w-md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className={`relative ${width} w-full mx-4 bg-white rounded-sm shadow-xl animate-fade-in`}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-serif text-base font-semibold text-navy-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-sm hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
