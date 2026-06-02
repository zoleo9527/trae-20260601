import { cn } from '@/lib/utils';
import type { DailyRecord, RecordType } from '@/types';
import TimelineItem from './TimelineItem';
import Empty from '../Empty';

interface TimelineProps {
  records: DailyRecord[];
  filter?: RecordType | 'all';
  className?: string;
}

export default function Timeline({ records, filter = 'all', className }: TimelineProps) {
  const filteredRecords = records
    .filter((r) => (filter === 'all' ? true : r.type === filter))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  if (filteredRecords.length === 0) {
    return (
      <div className={cn('h-64', className)}>
        <Empty />
      </div>
    );
  }

  return (
    <div className={cn('py-2', className)}>
      {filteredRecords.map((record, index) => (
        <TimelineItem
          key={record.id}
          record={record}
          isLast={index === filteredRecords.length - 1}
        />
      ))}
    </div>
  );
}
