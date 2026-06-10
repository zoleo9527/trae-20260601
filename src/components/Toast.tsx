import { useAppStore } from '../stores/appStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function Toast() {
  const { showToast, toastMessage, toastType, hideToast } = useAppStore();

  if (!showToast) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[toastType]}`}>
        {icons[toastType]}
        <p className="text-sm font-medium text-forest-900">{toastMessage}</p>
        <button onClick={hideToast} className="ml-2 text-forest-400 hover:text-forest-600">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
