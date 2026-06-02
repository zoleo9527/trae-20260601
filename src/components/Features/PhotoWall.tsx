import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Photo } from '@/types';
import Empty from '../Empty';

interface PhotoWallProps {
  photos: Photo[];
  onAddPhoto?: () => void;
  className?: string;
}

export default function PhotoWall({ photos, onAddPhoto, className }: PhotoWallProps) {
  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (sortedPhotos.length === 0) {
    return (
      <div className={cn('h-64', className)}>
        <Empty />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddPhoto}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all duration-200"
        >
          <Plus className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500">添加照片</span>
        </motion.div>

        {sortedPhotos.map((photo) => (
          <motion.div
            key={photo.id}
            whileHover={{ scale: 1.05, zIndex: 10 }}
            className="relative aspect-square rounded-xl overflow-hidden shadow-sm cursor-pointer group"
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
