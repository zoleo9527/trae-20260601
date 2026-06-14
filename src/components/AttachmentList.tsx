import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Image, File } from 'lucide-react';
import { Attachment } from '../types';

interface AttachmentListProps {
  attachments: Attachment[];
}

export function AttachmentList({ attachments }: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg shadow-sm p-4 mt-6"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-4">附件列表</h3>
      <div className="grid grid-cols-3 gap-4">
        {attachments.map((attachment) => (
          <motion.div
            key={attachment.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative group"
          >
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {attachment.fileName.includes('.jpg') || attachment.fileName.includes('.png') ? (
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-900 truncate">
                {attachment.fileName}
              </p>
              <p className="text-xs text-gray-500">
                {attachment.uploadedBy} · {format(attachment.uploadTime, 'yyyy-MM-dd HH:mm')}
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center"
            >
              <Image className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}