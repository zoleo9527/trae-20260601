import { ImageIcon } from "lucide-react";
import type { ArtworkImage } from "~/types";

interface ArtworkGalleryProps {
  images: ArtworkImage[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
}

export function ArtworkGallery({ images, maxVisible = 4, size = "md" }: ArtworkGalleryProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  if (images.length === 0) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300`}>
        <ImageIcon size={24} className="text-gray-400" />
        <span className="text-xs text-gray-400 mt-1">暂无作品</span>
      </div>
    );
  }

  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  return (
    <div className="flex gap-2 flex-wrap">
      {visibleImages.map((image, index) => (
        <div
          key={image.id}
          className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-gray-100 relative group cursor-pointer`}
        >
          <img
            src={image.url}
            alt={`作品图片 ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {image.isPlaceholder && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">
              占位图
            </div>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className={`${sizeClasses[size]} bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 font-medium text-sm`}>
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
