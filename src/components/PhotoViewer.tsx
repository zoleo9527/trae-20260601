import { useState } from 'react';
import type { PhotoItem } from '../types';
import '../styles/PhotoViewer.css';

interface Props {
  photos: PhotoItem[];
  currentPhoto: PhotoItem;
  onClose: () => void;
  onPhotoChange: (photo: PhotoItem) => void;
}

export default function PhotoViewer({ photos, currentPhoto, onClose, onPhotoChange }: Props) {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const currentIndex = photos.findIndex(p => p.id === currentPhoto.id);

  const handlePrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
    onPhotoChange(photos[newIndex]);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    const newIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
    onPhotoChange(photos[newIndex]);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <>
      <div className="viewer-overlay" onClick={onClose} />
      <div className="photo-viewer" onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="viewer-header">
          <div className="viewer-title">
            <span className="photo-label">{currentPhoto.label}</span>
            <span className="photo-count">{currentIndex + 1} / {photos.length}</span>
          </div>
          <div className="viewer-actions">
            <button className="viewer-btn" onClick={handleZoomOut} title="缩小">
              <span>−</span>
            </button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button className="viewer-btn" onClick={handleZoomIn} title="放大">
              <span>+</span>
            </button>
            <button className="viewer-btn" onClick={handleReset} title="重置">
              <span>↺</span>
            </button>
            <button className="viewer-btn close" onClick={onClose} title="关闭">
              <span>×</span>
            </button>
          </div>
        </div>

        <div className="viewer-main">
          {currentIndex > 0 && (
            <button className="nav-btn prev" onClick={handlePrev}>
              <span>‹</span>
            </button>
          )}

          <div 
            className="image-container"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.label}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease'
              }}
              draggable={false}
            />
          </div>

          {currentIndex < photos.length - 1 && (
            <button className="nav-btn next" onClick={handleNext}>
              <span>›</span>
            </button>
          )}
        </div>

        <div className="viewer-footer">
          <div className="photo-details">
            <div className="detail-item">
              <span className="label">标签：</span>
              <span className="value">{currentPhoto.label}</span>
            </div>
            <div className="detail-item">
              <span className="label">上传时间：</span>
              <span className="value">{currentPhoto.uploadTime}</span>
            </div>
            <div className="detail-item">
              <span className="label">上传人：</span>
              <span className="value">{currentPhoto.uploadBy}</span>
            </div>
            {currentPhoto.remark && (
              <div className="detail-item">
                <span className="label">备注：</span>
                <span className="value">{currentPhoto.remark}</span>
              </div>
            )}
          </div>

          <div className="thumbnail-list">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`thumbnail ${photo.id === currentPhoto.id ? 'active' : ''}`}
                onClick={() => {
                  onPhotoChange(photo);
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
              >
                <img src={photo.url} alt={photo.label} />
                {index === currentIndex && <div className="thumbnail-indicator" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
