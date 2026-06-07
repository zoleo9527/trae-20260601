import { clsx } from 'clsx';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useState } from 'react';
import type { PhotoItem } from '../types';

interface PhotoUploadProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
  placeholderMode?: boolean;
}

export function PhotoUpload({
  photos,
  onChange,
  maxPhotos = 6,
  placeholderMode = false,
}: PhotoUploadProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleUpload = () => {
    const placeholderUrls = [
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=400&h=300&fit=crop',
    ];
    const newPhoto: PhotoItem = {
      id: `photo-${Date.now()}`,
      url: placeholderUrls[photos.length % placeholderUrls.length],
      description: '',
      uploadedAt: new Date().toISOString(),
    };
    onChange([...photos, newPhoto]);
  };

  const handleRemove = (id: string) => {
    onChange(photos.filter((p) => p.id !== id));
  };

  const handleDescriptionChange = (id: string, description: string) => {
    onChange(
      photos.map((p) => (p.id === id ? { ...p, description } : p))
    );
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="aspect-[4/3] relative">
              <img
                src={photo.url}
                alt={photo.description || '复检照片'}
                className="w-full h-full object-cover"
              />
              {!placeholderMode && hoveredIndex === index && (
                <button
                  onClick={() => handleRemove(photo.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {placeholderMode && (
              <div className="p-2 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="添加照片说明..."
                  value={photo.description}
                  onChange={(e) => handleDescriptionChange(photo.id, e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            {!placeholderMode && photo.description && (
              <div className="p-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">{photo.description}</p>
              </div>
            )}
          </div>
        ))}

        {photos.length < maxPhotos && (
          <button
            onClick={handleUpload}
            className={clsx(
              'aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200',
              'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600',
              'animate-pulse-subtle'
            )}
          >
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">上传照片</span>
            <span className="text-xs mt-1 text-slate-400">{photos.length}/{maxPhotos}</span>
          </button>
        )}

        {Array.from({ length: Math.max(0, 3 - photos.length - 1) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-[4/3] rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center"
          >
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
