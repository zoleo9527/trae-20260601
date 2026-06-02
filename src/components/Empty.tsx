import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyProps {
  message?: string;
  className?: string;
}

export default function Empty({ message = '暂无数据', className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center h-full py-12', className)}>
      <div className="w-16 h-16 bg-cream-200 rounded-2xl flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-cream-400" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
