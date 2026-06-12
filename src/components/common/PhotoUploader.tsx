import { useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  maxPhotos?: number;
  onChange?: (photos: string[]) => void;
  readOnly?: boolean;
}

const COLOR_PRESETS = [
  'from-navy-200 to-navy-400',
  'from-amber-200 to-amber-400',
  'from-sage-200 to-sage-400',
  'from-coral-200 to-coral-400',
];

export default function PhotoUploader({
  photos,
  maxPhotos = 3,
  onChange,
  readOnly = false,
}: PhotoUploaderProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAddPhoto = () => {
    if (readOnly || !onChange || photos.length >= maxPhotos) return;
    const fakeId = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setLoading(fakeId);
    setTimeout(() => {
      onChange([...photos, fakeId]);
      setLoading(null);
    }, 400);
  };

  const handleRemove = (index: number) => {
    if (readOnly || !onChange) return;
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((photo, index) => {
        const colorIdx = index % COLOR_PRESETS.length;
        return (
          <div
            key={photo}
            className={`relative w-20 h-20 rounded bg-gradient-to-br ${COLOR_PRESETS[colorIdx]} overflow-hidden animate-fade-in group`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="w-7 h-7 text-white/80" strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/30">
              <p className="text-[10px] text-white font-medium truncate">
                验收照片 {index + 1}
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleRemove(index)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-coral-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      {loading && (
        <div className="w-20 h-20 rounded border-2 border-dashed border-navy-200 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-navy-300 border-t-navy-600 animate-spin"></div>
        </div>
      )}

      {!readOnly && photos.length < maxPhotos && (
        <button
          onClick={handleAddPhoto}
          disabled={loading !== null}
          className="w-20 h-20 rounded border-2 border-dashed border-navy-200 flex flex-col items-center justify-center gap-1 text-navy-400 hover:border-navy-400 hover:text-navy-600 transition-colors"
        >
          <Camera className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[10px]">上传照片</span>
        </button>
      )}
    </div>
  );
}
