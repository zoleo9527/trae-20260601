import { Ruler, FileText } from 'lucide-react';
import type { Measurement } from '@/types';

interface MeasurementSheetProps {
  measurement: Measurement;
}

export function MeasurementSheet({ measurement }: MeasurementSheetProps) {
  const measurementItems = [
    { label: '肩宽', value: measurement.shoulderWidth, unit: 'cm' },
    { label: '胸围', value: measurement.chest, unit: 'cm' },
    { label: '腰围', value: measurement.waist, unit: 'cm' },
    { label: '臀围', value: measurement.hip, unit: 'cm' },
    { label: '袖长', value: measurement.sleeveLength, unit: 'cm' },
    { label: '裤长', value: measurement.pantsLength > 0 ? measurement.pantsLength : '-', unit: measurement.pantsLength > 0 ? 'cm' : '' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="bg-navy-50 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-navy-600" />
          <h3 className="font-semibold text-navy-900">量体单</h3>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {measurementItems.map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-lg font-semibold text-navy-900">
                {item.value}
                {item.unit && <span className="text-sm font-normal text-gray-500 ml-1">{item.unit}</span>}
              </p>
            </div>
          ))}
        </div>
        {measurement.note && (
          <div className="mt-4 flex items-start gap-2">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <p className="text-sm text-gray-600">{measurement.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}
