import React from 'react';
import { History, Clock, AlertCircle } from 'lucide-react';
import type { HistoryRemark } from '../../types';
import { formatDate } from '../../lib/utils';

interface HistoryTimelineProps {
  remarks: HistoryRemark[];
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ remarks }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">处理历史</h3>
      </div>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        <div className="space-y-6">
          {remarks.map((remark) => (
            <div key={remark.id} className="relative pl-10">
              <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {remark.operator}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {remark.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(remark.timestamp)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    {remark.action}
                  </span>
                </div>
                
                {remark.detail && (
                  <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded border border-gray-100">
                    {remark.detail}
                  </div>
                )}
                
                {remark.attachments && remark.attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {remark.attachments.map((attachment, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200"
                      >
                        {attachment}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
