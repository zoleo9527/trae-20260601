import { clsx } from 'clsx';
import { AlertCircle, CheckCircle2, Clock, Package, User } from 'lucide-react';

export interface TimelineItem {
  id: string;
  title: string;
  description: string;
  time: string;
  user?: string;
  status: 'done' | 'current' | 'pending';
  type?: 'register' | 'inspect' | 'production' | 'stock' | 'recall' | 'close';
}

interface TimelineProps {
  items: TimelineItem[];
}

const typeIcons = {
  register: Package,
  inspect: AlertCircle,
  production: User,
  stock: Package,
  recall: AlertCircle,
  close: CheckCircle2,
};

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200" />
      <ul className="space-y-6">
        {items.map((item, index) => {
          const IconComponent = item.type ? typeIcons[item.type] : Clock;
          return (
            <li key={item.id} className="relative pl-10">
              <div
                className={clsx(
                  'absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  item.status === 'done' && 'bg-green-500 border-green-500 text-white',
                  item.status === 'current' && 'bg-blue-500 border-blue-500 text-white animate-pulse',
                  item.status === 'pending' && 'bg-white border-slate-300 text-slate-400'
                )}
              >
                {item.status === 'done' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <IconComponent className="w-4 h-4" />
                )}
              </div>
              <div
                className={clsx(
                  'bg-white rounded-lg p-4 border transition-all duration-300',
                  item.status === 'current'
                    ? 'border-blue-200 shadow-md shadow-blue-50'
                    : 'border-slate-200 shadow-sm',
                  item.status === 'pending' && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-slate-800">{item.title}</h4>
                  <span className="text-xs text-slate-500 font-mono">{item.time}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                {item.user && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                    <User className="w-3.5 h-3.5" />
                    <span>{item.user}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
