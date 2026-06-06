import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Package,
  User,
  Phone,
  MapPin,
  FileText,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { useAppStore } from '../store/appStore';
import type { UnloadRecord, OperationLog, DiscrepancyType } from '../../shared/types';
import { DISCREPANCY_LABELS } from '../../shared/types';

export default function Discrepancy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<UnloadRecord[]>([]);
  const [allRecords, setAllRecords] = useState<UnloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<UnloadRecord | null>(null);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [targetRecordOutsideFilter, setTargetRecordOutsideFilter] = useState<UnloadRecord | null>(null);
  const recordRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const { currentUser } = useAppStore();

  const targetRecordId = searchParams.get('recordId');

  function clearTargetRecord() {
    const params = new URLSearchParams(searchParams);
    params.delete('recordId');
    setSearchParams(params, { replace: true });
    setHighlightedId(null);
    setTargetRecordOutsideFilter(null);
  }

  const [form, setForm] = useState({
    discrepancyType: 'quantity' as DiscrepancyType,
    discrepancyQuantity: '',
    actualQuantity: '',
    returnReason: '',
    remark: '',
  });

  async function loadData() {
    setLoading(true);
    try {
      const data = await api.getRecords();
      setAllRecords(data);
      setRecords(data.filter(r => r.status === 'finished' || r.status === 'discrepancy'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && targetRecordId && allRecords.length > 0 && !selectedRecord) {
      const targetInAll = allRecords.find(r => r.id === targetRecordId);
      const targetInFiltered = records.find(r => r.id === targetRecordId);

      if (targetInAll) {
        if (!targetInFiltered) {
          setTargetRecordOutsideFilter(targetInAll);
        }
        handleSelect(targetInAll);
        setTimeout(() => {
          const el = recordRefs.current.get(targetRecordId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedId(targetRecordId);
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 150);
      }
    }
  }, [loading, targetRecordId, allRecords, records, selectedRecord]);

  async function handleSelect(record: UnloadRecord) {
    setSelectedRecord(record);
    setForm({
      discrepancyType: record.discrepancyType || 'quantity',
      discrepancyQuantity: record.discrepancyQuantity?.toString() || '',
      actualQuantity: record.actualQuantity?.toString() || record.plannedQuantity.toString(),
      returnReason: record.returnReason || '',
      remark: record.remark || '',
    });
    try {
      const logData = await api.getLogs(record.id);
      setLogs(logData);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await api.registerDiscrepancy(selectedRecord.id, {
        discrepancyType: form.discrepancyType,
        discrepancyQuantity: parseInt(form.discrepancyQuantity) || 0,
        actualQuantity: parseInt(form.actualQuantity) || 0,
        returnReason: form.returnReason,
        remark: form.remark,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
      });
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleCompleteWithDiscrepancy(record: UnloadRecord) {
    if (!confirm('确认完成该差异记录吗？')) return;
    try {
      await api.updateStatus(record.id, {
        status: 'completed',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
        remark: '确认完成',
      });
      loadData();
      if (selectedRecord?.id === record.id) {
        setSelectedRecord(null);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleCompleteNoDiscrepancy() {
    if (!selectedRecord) return;
    const actualQty = prompt(
      '请输入实收数量（无差异）',
      selectedRecord.plannedQuantity.toString()
    );
    if (actualQty === null) return;
    const qty = parseInt(actualQty);
    if (isNaN(qty) || qty < 0) {
      alert('请输入有效的数量');
      return;
    }
    const remark = prompt('补充备注（可选）', '');
    if (remark === null) return;
    try {
      await api.completeNoDiscrepancy(selectedRecord.id, {
        actualQuantity: qty,
        remark: remark || undefined,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
      });
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">差异登记</h1>
        <p className="text-slate-400 text-sm mt-1">卸货完成后的差异处理和确认</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-3">
          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              待处理列表
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : records.length === 0 && !targetRecordOutsideFilter ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                暂无待处理差异
              </div>
            ) : (
              <>
                {targetRecordOutsideFilter && (
                  <div className="mb-2">
                    <div className="text-xs text-amber-400 mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      目标记录不在待处理范围内，已置顶显示
                    </div>
                    <button
                      key={targetRecordOutsideFilter.id}
                      ref={(el) => {
                        if (el) recordRefs.current.set(targetRecordOutsideFilter.id, el);
                      }}
                      onClick={() => handleSelect(targetRecordOutsideFilter)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${
                        highlightedId === targetRecordOutsideFilter.id
                          ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 bg-blue-500/10'
                          : selectedRecord?.id === targetRecordOutsideFilter.id
                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/30'
                            : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-100">{targetRecordOutsideFilter.plateNumber}</span>
                        <StatusBadge status={targetRecordOutsideFilter.status} size="sm" />
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {targetRecordOutsideFilter.cargoType} · 计划 {targetRecordOutsideFilter.plannedQuantity} 件
                        {targetRecordOutsideFilter.dockNumber && ` · ${targetRecordOutsideFilter.dockNumber}号月台`}
                      </div>
                      {targetRecordOutsideFilter.discrepancyType && (
                        <div className="mt-1 text-xs text-orange-400">
                          差异: {DISCREPANCY_LABELS[targetRecordOutsideFilter.discrepancyType]}
                          {targetRecordOutsideFilter.discrepancyQuantity ? ` ${targetRecordOutsideFilter.discrepancyQuantity}件` : ''}
                        </div>
                      )}
                    </button>
                  </div>
                )}
                {records.length > 0 && targetRecordOutsideFilter && (
                  <div className="pt-2 mt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-2">待处理列表 ({records.length})</p>
                  </div>
                )}
                {targetRecordId && !targetRecordOutsideFilter && (
                  <div className="mb-3 flex items-center justify-between px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <span className="text-xs text-blue-300">已定位到目标记录</span>
                    <button
                      onClick={clearTargetRecord}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {records
                  .filter(r => r.id !== targetRecordOutsideFilter?.id)
                  .map((record) => (
                    <button
                      key={record.id}
                      ref={(el) => {
                        if (el) recordRefs.current.set(record.id, el);
                      }}
                      onClick={() => handleSelect(record)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${
                        highlightedId === record.id
                          ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20 bg-blue-500/10'
                          : selectedRecord?.id === record.id
                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/30'
                            : 'bg-slate-800/50 border-slate-700/30 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-100">{record.plateNumber}</span>
                        <StatusBadge status={record.status} size="sm" />
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {record.cargoType} · 计划 {record.plannedQuantity} 件
                        {record.dockNumber && ` · ${record.dockNumber}号月台`}
                      </div>
                      {record.discrepancyType && (
                        <div className="mt-1 text-xs text-orange-400">
                          差异: {DISCREPANCY_LABELS[record.discrepancyType]}
                          {record.discrepancyQuantity ? ` ${record.discrepancyQuantity}件` : ''}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="col-span-3">
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{selectedRecord.plateNumber}</h3>
                      <StatusBadge status={selectedRecord.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <User className="w-4 h-4" />
                        <span>{selectedRecord.driverName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span>{selectedRecord.driverPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Package className="w-4 h-4" />
                        <span>{selectedRecord.cargoType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedRecord.dockNumber ? `${selectedRecord.dockNumber}号月台` : '未分配'}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">计划件数</p>
                    <p className="text-xl font-bold text-slate-100 mt-1">{selectedRecord.plannedQuantity}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">实收件数</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">
                      {selectedRecord.actualQuantity || '-'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">差异数量</p>
                    <p className="text-xl font-bold text-orange-400 mt-1">
                      {selectedRecord.discrepancyQuantity || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedRecord.status === 'finished' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
                  <p className="text-sm text-emerald-300 flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>卸货已完成，可选择：</strong><br />
                      ① 无差异 → 点击「无差异，直接完成」快速结案<br />
                      ② 有差异 → 填写下方差异登记表单后保存
                    </span>
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  差异登记
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">差异类型 *</label>
                    <select
                      value={form.discrepancyType}
                      onChange={(e) => setForm({ ...form, discrepancyType: e.target.value as DiscrepancyType })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="quantity">数量差异</option>
                      <option value="damage">破损</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">实收数量 *</label>
                    <input
                      type="number"
                      value={form.actualQuantity}
                      onChange={(e) => setForm({ ...form, actualQuantity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">差异数量 *</label>
                    <input
                      type="number"
                      value={form.discrepancyQuantity}
                      onChange={(e) => setForm({ ...form, discrepancyQuantity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-orange-500"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">退回原因</label>
                    <input
                      type="text"
                      value={form.returnReason}
                      onChange={(e) => setForm({ ...form, returnReason: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                      placeholder="如：发货方少装、运输破损等"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-slate-300 mb-1.5">补充备注</label>
                    <textarea
                      value={form.remark}
                      onChange={(e) => setForm({ ...form, remark: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="详细描述差异情况..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-5">
                  {selectedRecord.status === 'finished' && (
                    <button
                      type="button"
                      onClick={handleCompleteNoDiscrepancy}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      无差异，直接完成
                    </button>
                  )}
                  {selectedRecord.status === 'discrepancy' && (
                    <button
                      type="button"
                      onClick={() => handleCompleteWithDiscrepancy(selectedRecord)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      确认完成
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {selectedRecord.status === 'discrepancy' ? '更新差异' : '保存差异'}
                  </button>
                </div>
              </form>

              <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  操作日志
                </h3>
                <div className="max-h-64 overflow-y-auto pr-1">
                  <Timeline logs={logs} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-16 text-center">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">从左侧选择一条记录查看详情并登记差异</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
