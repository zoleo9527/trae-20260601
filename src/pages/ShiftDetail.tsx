import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ShiftHeader from '@/components/ShiftHeader';
import DiscrepancyTabs from '@/components/DiscrepancyTabs';
import DiscrepancyCard from '@/components/DiscrepancyCard';
import OilDataPanel from '@/components/OilDataPanel';
import NozzleDataPanel from '@/components/NozzleDataPanel';
import OilLossRecordPanel from '@/components/OilLossRecordPanel';
import ReviewPanel from '@/components/ReviewPanel';
import { useShiftStore } from '@/store/shiftStore';
import type { DiscrepancyType, OilLossRecordForm } from '@/types';

export default function ShiftDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    shifts,
    updateDiscrepancyStatus,
    updateStationMasterOpinion,
    updateMeterOpinion,
    confirmShift,
    recordOilLoss,
  } = useShiftStore();

  const [activeType, setActiveType] = useState<DiscrepancyType | 'all'>('all');

  const shift = shifts.find((s) => s.id === id);

  if (!shift) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900">班结记录不存在</h2>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">
          返回工作台
        </button>
      </div>
    );
  }

  const filteredDiscrepancies =
    activeType === 'all'
      ? shift.discrepancies
      : shift.discrepancies.filter((d) => d.type === activeType);

  const handleReview = (discrepancyId: string, opinion: string) => {
    updateDiscrepancyStatus(shift.id, discrepancyId, 'reviewed', opinion, '王站长');
  };

  const handleStationMasterReview = (opinion: string) => {
    updateStationMasterOpinion(shift.id, opinion, '王站长');
  };

  const handleMeterReview = (opinion: string) => {
    updateMeterOpinion(shift.id, opinion, '刘计量员');
  };

  const handleConfirm = () => {
    confirmShift(shift.id);
  };

  const handleRecordOilLoss = (formData: OilLossRecordForm[]) => {
    recordOilLoss(shift.id, formData);
  };

  return (
    <div className="space-y-6">
      <ShiftHeader shift={shift} />

      <DiscrepancyTabs
        discrepancies={shift.discrepancies}
        activeType={activeType}
        onTypeChange={setActiveType}
      />

      <NozzleDataPanel nozzleData={shift.nozzleData} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredDiscrepancies.map((discrepancy) => (
            <DiscrepancyCard
              key={discrepancy.id}
              discrepancy={discrepancy}
              onReview={handleReview}
              disabled={shift.status === 'confirmed'}
            />
          ))}
        </div>

        <div className="space-y-6">
          <OilLossRecordPanel
            oilData={shift.oilData}
            isRecorded={shift.oilLossRecorded}
            onRecord={handleRecordOilLoss}
          />
          <OilDataPanel oilData={shift.oilData} />
          <ReviewPanel
            shift={shift}
            onStationMasterReview={handleStationMasterReview}
            onMeterReview={handleMeterReview}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
}
