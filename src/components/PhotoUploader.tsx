import React, { useState } from 'react';
import { Button, Image, App as AntdApp, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../api';
import { Photo } from '@shared/types';

interface Props {
  photoIds: number[];
  photos: Photo[];
  type: 'dispatch' | 'return' | 'damage';
  relatedId?: number;
  onChange: (ids: number[], photos: Photo[]) => void;
  maxCount?: number;
}

const PhotoUploader: React.FC<Props> = ({ photoIds, photos, type, relatedId, onChange, maxCount = 20 }) => {
  const { message: msg } = AntdApp.useApp();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('');

  const handleUpload = async () => {
    const filePath = await api.selectFile();
    if (!filePath) return;
    try {
      const result = await api.uploadPhoto(filePath, type, relatedId);
      const newPhoto: Photo = {
        id: result.id as number,
        filePath: result.filePath,
        fileName: result.fileName,
        fileSize: 0,
        uploadTime: new Date().toISOString(),
        type,
        relatedId,
      };
      onChange([...photoIds, result.id as number], [...photos, newPhoto]);
      msg.success('上传成功');
    } catch (e) {
      msg.error('上传失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletePhoto(id);
      onChange(photoIds.filter((p) => p !== id), photos.filter((p) => p.id !== id));
      msg.success('已删除');
    } catch (e) {
      msg.error('删除失败');
    }
  };

  const handlePreview = async (p: Photo) => {
    const fullPath = p.filePath.startsWith('file://') ? p.filePath : `file://${p.filePath}`;
    setPreviewSrc(fullPath);
    setPreviewOpen(true);
  };

  const imgSrc = (p: Photo) => (p.filePath.startsWith('file://') ? p.filePath : `file://${p.filePath}`);

  return (
    <div>
      <div className="photo-grid">
        {photos.map((p) => (
          <div key={p.id} className="photo-item">
            <img
              src={imgSrc(p)}
              alt={p.fileName}
              onClick={() => handlePreview(p)}
              style={{ cursor: 'pointer' }}
            />
            <div className="photo-actions">
              <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(p)} />
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(p.id)} />
            </div>
          </div>
        ))}
        {photoIds.length < maxCount && (
          <div className="photo-upload-btn" onClick={handleUpload}>
            <PlusOutlined style={{ fontSize: 24 }} />
            <div style={{ marginTop: 6, fontSize: 12 }}>上传照片</div>
            <div style={{ fontSize: 11, color: '#bbb' }}>{photoIds.length}/{maxCount}</div>
          </div>
        )}
      </div>
      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        centered
      >
        <img src={previewSrc} alt="preview" style={{ width: '100%', display: 'block' }} />
      </Modal>
    </div>
  );
};

export default PhotoUploader;
