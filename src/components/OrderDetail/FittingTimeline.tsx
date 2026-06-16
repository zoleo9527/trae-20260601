import { Calendar, User, CheckCircle, AlertTriangle } from 'lucide-react';
import type { FittingRecord } from '@/types';

interface FittingTimelineProps {
  records: FittingRecord[];
}

export function FittingTimeline({ records }: FittingTimelineProps) {
  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-navy-50 px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-navy-900">试衣记录</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-gray-500">暂无试衣记录</p>
        </div>
      </div>
    );
  }

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.fittingDate).getTime() - new Date(a.fittingDate).getTime()
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="bg-navy-50 px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-navy-900">试衣记录</h3>
      </div>
      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {sortedRecords.map((record, index) => (
            <div key={record.id} className="relative pl-10 pb-6 last:pb-0">
              <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                record.result === 'passed' 
                  ? 'bg-mint-100 text-mint-600' 
                  : 'bg-coral-100 text-coral-600'
              }`}>
                {record.result === 'passed' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
              </div>
              
              <div className={`p-3 rounded-lg ${
                record.result === 'passed' 
                  ? 'bg-mint-50 border border-mint-100' 
                  : 'bg-coral-50 border border-coral-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-navy-900">
                      {record.fittingDate}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    record.result === 'passed'
                      ? 'bg-mint-200 text-mint-700'
                      : 'bg-coral-200 text-coral-700'
                  }`}>
                    {record.result === 'passed' ? '通过' : '需调整'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{record.issues}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>量体师: {record.measurerName}</span>
                </div>
              </div>
              
              {index < sortedRecords.length - 1 && (
                <div className="absolute left-4 top-5 w-0.5 h-full bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
