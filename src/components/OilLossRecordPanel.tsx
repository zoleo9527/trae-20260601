import { useState } from 'react';
import { Gauge, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { OilData, OilLossRecordForm } from '@/types';

interface OilLossRecordPanelProps {
  oilData?: OilData[];
  isRecorded?: boolean;
  onRecord: (formData: OilLossRecordForm[]) => void;
}

export default function OilLossRecordPanel({
  oilData,
  isRecorded,
  onRecord,
}: OilLossRecordPanelProps) {
  const [formData, setFormData] = useState<Record<string, { endStock: string; actualLoss: string; remark: string }>>(() => {
    const initial: Record<string, { endStock: string; actualLoss: string; remark: string }> = {};
    oilData?.forEach((oil) => {
      initial[oil.tankNo] = {
        endStock: oil.endStock > 0 ? oil.endStock.toString() : '',
        actualLoss: oil.actualLoss > 0 ? oil.actualLoss.toString() : '',
        remark: '',
      };
    });
    return initial;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!oilData || oilData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Gauge className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">油品损耗补录</h3>
        </div>
        <p className="text-gray-500 text-sm">暂无油罐数据</p>
      </div>
    );
  }

  const handleInputChange = (tankNo: string, field: 'endStock' | 'actualLoss' | 'remark', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [tankNo]: { ...prev[tankNo], [field]: value },
    }));
  };

  const handleSubmit = () => {
    const data: OilLossRecordForm[] = oilData.map((oil) => ({
      tankNo: oil.tankNo,
      oilType: oil.oilType,
      endStock: parseFloat(formData[oil.tankNo]?.endStock || '0'),
      actualLoss: parseFloat(formData[oil.tankNo]?.actualLoss || '0'),
      remark: formData[oil.tankNo]?.remark,
    }));

    setIsSubmitting(true);
    setTimeout(() => {
      onRecord(data);
      setIsSubmitting(false);
    }, 500);
  };

  const allFilled = oilData.every(
    (oil) => formData[oil.tankNo]?.endStock && parseFloat(formData[oil.tankNo].endStock) > 0
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Gauge className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">油品损耗补录</h3>
              <p className="text-sm text-gray-500">计量员录入油罐盘点数据</p>
            </div>
          </div>
          {isRecorded ? (
            <span className="badge bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              已补录
            </span>
          ) : (
            <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              待补录
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {oilData.map((oil) => {
          const calculatedLoss = oil.startStock - parseFloat(formData[oil.tankNo]?.endStock || '0') - oil.salesVolume;
          const isValidEndStock = parseFloat(formData[oil.tankNo]?.endStock || '0') > 0;
          const lossAbnormal = calculatedLoss > oil.standardLoss * 2;

          return (
            <div key={oil.tankNo} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{oil.tankNo}</span>
                  <span className="px-2 py-0.5 bg-white rounded text-xs text-gray-600 border border-gray-200">
                    {oil.oilType}
                  </span>
                </div>
                {oil.isRecorded && (
                  <span className="text-xs text-green-600 font-medium">已录入</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">期初库存 (L)</label>
                  <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-500">
                    {oil.startStock.toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">系统销量 (L)</label>
                  <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-500">
                    {oil.salesVolume.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">标准损耗 (L)</label>
                  <div className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-500">
                    {oil.standardLoss.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    期末库存 (L) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData[oil.tankNo]?.endStock || ''}
                    onChange={(e) => handleInputChange(oil.tankNo, 'endStock', e.target.value)}
                    placeholder="请输入盘点库存"
                    disabled={isRecorded}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {isValidEndStock && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">计算实际损耗：期初 - 期末 - 销量</span>
                    <span className={`text-sm font-semibold ${lossAbnormal ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {calculatedLoss.toFixed(2)} L
                      {lossAbnormal && <span className="ml-2 text-xs">(异常偏高)</span>}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isRecorded && (
        <div className="p-5 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!allFilled || isSubmitting}
            className="btn-warning w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? '提交中...' : '保存油品损耗数据'}
          </button>
          {!allFilled && (
            <p className="text-xs text-gray-500 text-center mt-2">
              请填写所有油罐的期末库存后再提交
            </p>
          )}
        </div>
      )}
    </div>
  );
}
