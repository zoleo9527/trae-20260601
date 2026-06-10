import { Camera, ImagePlus, X } from 'lucide-react';
import { useState } from 'react';

interface PhotoGalleryProps {
  photos: {
    before?: string[];
    after?: string[];
  };
  allowUpload?: boolean;
}

export const PhotoGallery = ({ photos, allowUpload = false }: PhotoGalleryProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const beforePhotos = photos.before || [];
  const afterPhotos = photos.after || [];

  const PhotoPlaceholder = () => (
    <div className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
      <ImagePlus className="w-8 h-8 mb-1" />
      <span className="text-xs">点击上传</span>
    </div>
  );

  const PhotoItem = ({ src, alt }: { src: string; alt: string }) => (
    <div
      onClick={() => setSelectedPhoto(src)}
      className="aspect-square rounded-lg overflow-hidden bg-slate-100 cursor-pointer relative group"
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
          点击查看大图
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <h4 className="text-sm font-medium text-slate-700">处理前照片</h4>
          <span className="text-xs text-slate-400">({beforePhotos.length}张)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {beforePhotos.length > 0 ? (
            beforePhotos.map((photo, index) => (
              <PhotoItem key={`before-${index}`} src={photo} alt={`处理前-${index + 1}`} />
            ))
          ) : (
            <div className="col-span-3">
              <div className="aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-10 h-10 mb-2 text-slate-300" />
                <span className="text-sm">暂无处理前照片</span>
                {allowUpload && <span className="text-xs mt-1 text-slate-400">点击上传现场照片</span>}
              </div>
            </div>
          )}
          {allowUpload && beforePhotos.length > 0 && <PhotoPlaceholder />}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <h4 className="text-sm font-medium text-slate-700">处理后照片</h4>
          <span className="text-xs text-slate-400">({afterPhotos.length}张)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {afterPhotos.length > 0 ? (
            afterPhotos.map((photo, index) => (
              <PhotoItem key={`after-${index}`} src={photo} alt={`处理后-${index + 1}`} />
            ))
          ) : (
            <div className="col-span-3">
              <div className="aspect-video rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-10 h-10 mb-2 text-slate-300" />
                <span className="text-sm">暂无处理后照片</span>
                {allowUpload && <span className="text-xs mt-1 text-slate-400">处理完成后上传</span>}
              </div>
            </div>
          )}
          {allowUpload && afterPhotos.length > 0 && <PhotoPlaceholder />}
        </div>
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="大图预览"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
