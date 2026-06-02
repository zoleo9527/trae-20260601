import { cn } from '@/lib/utils';
import {
  RECORD_TYPE_LABELS,
  RECORD_TYPE_ICONS,
  RECORD_TYPE_COLORS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
} from '@/types';
import type { DailyRecord, Photo } from '@/types';
import { useAppStore } from '@/store';

interface TimelineItemProps {
  record: DailyRecord;
  isLast?: boolean;
}

export default function TimelineItem({ record, isLast }: TimelineItemProps) {
  const getPhotosByChild = useAppStore((state) => state.getPhotosByChild);
  const photos = getPhotosByChild(record.childId);
  const recordPhotos = photos.filter((p) => record.photoIds.includes(p.id));

  const formatTime = (timeStr: string): string => {
    const date = new Date(timeStr);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm',
            RECORD_TYPE_COLORS[record.type]
          )}
        >
          {RECORD_TYPE_ICONS[record.type]}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
      </div>

      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {RECORD_TYPE_LABELS[record.type]}
            </span>
            <span className="text-xs text-gray-500">{formatTime(record.time)}</span>
            {record.severity !== 'normal' && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full border',
                  SEVERITY_COLORS[record.severity]
                )}
              >
                {SEVERITY_LABELS[record.severity]}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-2 leading-relaxed">{record.content}</p>

        {record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {record.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {recordPhotos.length > 0 && (
          <div className="flex gap-2 mt-2">
            {recordPhotos.slice(0, 4).map((photo: Photo) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer"
                />
                {recordPhotos.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      +{recordPhotos.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400 mt-2 block">
          记录人：{record.createdBy}
        </span>
      </div>
    </div>
  );
}
