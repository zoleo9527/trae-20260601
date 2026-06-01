import React, { useState } from 'react';
import { Photo } from '../types/inventory';
import { ZoomIn, User, Clock } from 'lucide-react';
import { Modal } from './Modal';

interface PhotoGridProps {
  photos: Photo[];
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({ photos }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <p className="text-[13px]">暂无照片</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-1.5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer overflow-hidden rounded-sm"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img
              src={photo.thumbnail}
              alt={photo.description}
              className="w-full h-16 object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {photo.description && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1 py-0.5">
                <p className="text-[10px] text-white truncate">{photo.description}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="照片详情"
        size="lg"
      >
        {selectedPhoto && (
          <div className="space-y-3">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.description}
              className="w-full rounded-sm"
            />
            <div className="space-y-2">
              {selectedPhoto.description && (
                <p className="text-sm text-gray-700">{selectedPhoto.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {selectedPhoto.uploader}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedPhoto.uploadTime}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
