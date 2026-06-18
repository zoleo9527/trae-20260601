import React from 'react';
import { MaterialList as MaterialListType } from '@/types';
import { Card, StatusTag } from '../common';
import { Package, MapPin, Clock, User } from 'lucide-react';
import dayjs from 'dayjs';

interface MaterialCardProps {
  material: MaterialListType;
  onClick?: () => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onClick,
}) => {
  const preparedCount = material.materials.filter(m => m.status === 'PREPARED').length;
  const totalCount = material.materials.length;

  return (
    <Card hover onClick={onClick} className="p-0 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">物料清单</h3>
              <p className="text-sm text-gray-500">ID: {material.id}</p>
            </div>
          </div>
          <StatusTag status={material.status} type="material" />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>
              {dayjs(material.scheduleSnapshot.scheduledAt).format('YYYY-MM-DD HH:mm')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{material.scheduleSnapshot.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{material.scheduleSnapshot.lecturerName}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">准备进度</span>
            <span className="text-sm font-medium text-gray-900">
              {preparedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(preparedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {material.preparedByName && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>准备人: {material.preparedByName}</span>
            {material.startedAt && (
              <span>开始: {dayjs(material.startedAt).fromNow()}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
