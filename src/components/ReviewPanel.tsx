import { useState } from 'react';
import { UserCheck, Gauge, CheckCircle2 } from 'lucide-react';
import type { ShiftRecord } from '@/types';

interface ReviewPanelProps {
  shift: ShiftRecord;
  onStationMasterReview: (opinion: string) => void;
  onMeterReview: (opinion: string) => void;
  onConfirm: () => void;
}

const quickOpinions = [
  '数据正常，确认通过',
  '差异在合理范围内',
  '已核实，由当班人员承担',
  '待进一步核实',
];

export default function ReviewPanel({
  shift,
  onStationMasterReview,
  onMeterReview,
  onConfirm,
}: ReviewPanelProps) {
  const [stationOpinion, setStationOpinion] = useState(shift.stationMasterOpinion || '');
  const [meterOpinion, setMeterOpinion] = useState(shift.meterOpinion || '');

  const allReviewed = shift.discrepancies.every(
    (d) => d.status === 'confirmed' || d.status === 'resolved' || d.status === 'reviewed'
  );
  const canConfirm = allReviewed && shift.stationMasterOpinion && shift.meterOpinion;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">复核与确认</h3>
        <p className="text-sm text-gray-500 mt-1">站长和计量员分别填写复核意见后，确认完成交接</p>
      </div>

      <div className="p-5 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-primary-100 rounded-lg">
              <UserCheck className="w-4 h-4 text-primary-700" />
            </div>
            <h4 className="font-semibold text-gray-900">站长复核</h4>
            {shift.stationMasterOpinion && (
              <span className="badge badge-confirmed ml-auto">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                已填写
              </span>
            )}
          </div>
          <textarea
            value={stationOpinion}
            onChange={(e) => setStationOpinion(e.target.value)}
            placeholder="请输入站长复核意见..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={2}
            disabled={!!shift.stationMasterOpinion}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {quickOpinions.map((opinion) => (
              <button
                key={opinion}
                onClick={() => !shift.stationMasterOpinion && setStationOpinion(opinion)}
                disabled={!!shift.stationMasterOpinion}
                className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {opinion}
              </button>
            ))}
          </div>
          {!shift.stationMasterOpinion && (
            <button
              onClick={() => stationOpinion.trim() && onStationMasterReview(stationOpinion)}
              disabled={!stationOpinion.trim()}
              className="btn-primary text-sm mt-4"
            >
              提交站长意见
            </button>
          )}
          {shift.stationMasterTime && (
            <p className="text-xs text-gray-500 mt-2">
              {shift.stationMaster} · {shift.stationMasterTime}
            </p>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Gauge className="w-4 h-4 text-amber-700" />
            </div>
            <h4 className="font-semibold text-gray-900">计量员复核</h4>
            {shift.meterOpinion && (
              <span className="badge badge-confirmed ml-auto">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                已填写
              </span>
            )}
          </div>
          <textarea
            value={meterOpinion}
            onChange={(e) => setMeterOpinion(e.target.value)}
            placeholder="请输入计量员复核意见，确认油品损耗数据..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={2}
            disabled={!!shift.meterOpinion}
          />
          {!shift.meterOpinion && (
            <button
              onClick={() => meterOpinion.trim() && onMeterReview(meterOpinion)}
              disabled={!meterOpinion.trim()}
              className="btn-warning text-sm mt-4"
            >
              提交计量员意见
            </button>
          )}
          {shift.meterTime && (
            <p className="text-xs text-gray-500 mt-2">
              {shift.meter} · {shift.meterTime}
            </p>
          )}
        </div>
      </div>

      <div className="p-5 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            {canConfirm ? (
              <span className="text-emerald-600 font-medium">所有复核已完成，可以确认交接</span>
            ) : (
              <span className="text-gray-500">请完成所有复核后再确认交接</span>
            )}
          </div>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || shift.status === 'confirmed'}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {shift.status === 'confirmed' ? '已确认交接' : '确认交接完成'}
          </button>
        </div>
      </div>
    </div>
  );
}
