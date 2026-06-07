import { ArrowLeft, ClipboardCheck, Factory, Save, ThermometerSnowflake, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PhotoUpload } from '../components/PhotoUpload';
import { StatusTag } from '../components/StatusTag';
import { useAppStore } from '../store/appStore';
import type { ConclusionType, PhotoItem } from '../types';

export function Reinspection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cases, reinspections, updateReinspection, updateCase } = useAppStore();

  const currentCase = cases.find((c) => c.id === id);
  const existingReinspect = reinspections[id || ''];

  const [conclusion, setConclusion] = useState<ConclusionType>(
    existingReinspect?.conclusion || 'false_alarm'
  );
  const [remark, setRemark] = useState(existingReinspect?.remark || '');
  const [photos, setPhotos] = useState<PhotoItem[]>(existingReinspect?.photos || []);
  const [productionContent, setProductionContent] = useState(
    existingReinspect?.productionSupplement?.content || ''
  );
  const [stockRemark, setStockRemark] = useState(
    existingReinspect?.stockConfirmation?.remark || ''
  );
  const [remainingStock, setRemainingStock] = useState(
    existingReinspect?.stockConfirmation?.remainingStock || 0
  );

  const handleSave = () => {
    if (!id) return;
    updateReinspection(id, {
      inspector: '张质检',
      inspectTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      photos,
      conclusion,
      remark,
      productionSupplement: {
        teamLeader: currentCase?.batchNo === 'B2026052803' ? '王建国' : '李明华',
        supplementTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        content: productionContent,
      },
      stockConfirmation: {
        warehouseKeeper: '陈库管',
        confirmTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        remainingStock,
        remark: stockRemark,
      },
    });
    updateCase(id, {
      conclusion,
      conclusionRemark: remark,
      status: conclusion === 'quality_issue' ? 'recalling' : 'processing',
    });
    navigate(`/return/${id}`);
  };

  if (!currentCase) {
    return <div>案件不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">复检处理</h2>
          <p className="text-slate-500 mt-1">
            案件编号：<span className="font-mono">{currentCase.caseNo}</span>
          </p>
        </div>
        <StatusTag type="case" status={currentCase.status} />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-4 gap-6 text-sm">
          <InfoItem label="客户名称" value={currentCase.customerName} />
          <InfoItem label="产品名称" value={currentCase.productName} />
          <InfoItem label="产品批号" value={currentCase.batchNo} mono />
          <InfoItem
            label="退货数量"
            value={`${currentCase.returnQuantity} ${currentCase.unit}`}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border-l-4 border-blue-500 border-y border-r border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">质检复检区</h3>
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            质检员填写
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              复检照片
            </label>
            <PhotoUpload photos={photos} onChange={setPhotos} maxPhotos={6} placeholderMode />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              复检结论
            </label>
            <div className="flex gap-4">
              {[
                { value: 'false_alarm', label: '误报', desc: '产品正常，客户误解', color: 'green' },
                { value: 'quality_issue', label: '确认质量问题', desc: '存在质量问题，需召回', color: 'red' },
                { value: 'price_adjustment', label: '补差价', desc: '轻微偏差，差价补偿', color: 'amber' },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    conclusion === item.value
                      ? item.color === 'green'
                        ? 'border-green-500 bg-green-50'
                        : item.color === 'red'
                        ? 'border-red-500 bg-red-50'
                        : 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="conclusion"
                    value={item.value}
                    checked={conclusion === item.value}
                    onChange={(e) => setConclusion(e.target.value as ConclusionType)}
                    className="sr-only"
                  />
                  <div className="font-medium text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              复检说明
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请详细描述复检结果和判断依据..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border-l-4 border-green-500 border-y border-r border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-green-100 text-green-600 rounded-lg">
            <Factory className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">生产情况补充</h3>
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-md">
            生产班长填写
          </span>
          {existingReinspect?.productionSupplement && (
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {existingReinspect.productionSupplement.teamLeader}
            </span>
          )}
        </div>
        <textarea
          value={productionContent}
          onChange={(e) => setProductionContent(e.target.value)}
          placeholder="请补充当时的生产加工情况说明..."
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow resize-none"
        />
      </div>

      <div className="bg-white rounded-lg border-l-4 border-amber-500 border-y border-r border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">库存确认</h3>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
            冷库管理员确认
          </span>
          {existingReinspect?.stockConfirmation && (
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {existingReinspect.stockConfirmation.warehouseKeeper}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              同批次剩余库存 (kg)
            </label>
            <input
              type="number"
              value={remainingStock}
              onChange={(e) => setRemainingStock(Number(e.target.value))}
              min="0"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              库存备注
            </label>
            <input
              type="text"
              value={stockRemark}
              onChange={(e) => setStockRemark(e.target.value)}
              placeholder="库存状态说明..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-2">
        <Link
          to={`/return/${id}`}
          className="px-6 py-2.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition-colors font-medium"
        >
          取消
        </Link>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A5F] text-white rounded-md hover:bg-[#2a4d7a] transition-colors shadow-sm font-medium"
        >
          <Save className="w-5 h-5" />
          保存复检结果
        </button>
      </div>
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-slate-800 font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
