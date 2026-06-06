import { useEffect, useState } from 'react';
import { MapPin, Truck, User, Phone, Check, X, Square } from 'lucide-react';
import { api } from '../api/client';
import type { Dock, UnloadRecord } from '../../shared/types';
import { DOCK_STATUS_LABELS } from '../../shared/types';
import { StatusBadge } from '../components/StatusBadge';
import { useAppStore } from '../store/appStore';

export default function DockBoard() {
  const [docks, setDocks] = useState<Dock[]>([]);
  const [records, setRecords] = useState<UnloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningRecordId, setAssigningRecordId] = useState<string | null>(null);
  const { currentUser } = useAppStore();

  async function loadData() {
    setLoading(true);
    try {
      const [docksData, recordsData] = await Promise.all([
        api.getDocks(),
        api.getRecords(),
      ]);
      setDocks(docksData);
      setRecords(recordsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const dockStatusColors: Record<string, string> = {
    idle: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10',
    occupied: 'border-amber-500/30 bg-amber-500/5',
    exception: 'border-red-500/30 bg-red-500/5',
  };

  const dockDotColors: Record<string, string> = {
    idle: 'bg-emerald-500',
    occupied: 'bg-amber-500',
    exception: 'bg-red-500',
  };

  const getRecordForDock = (dock: Dock) => {
    return records.find(r => r.id === dock.currentRecordId);
  };

  const pendingRecords = records.filter(r => !r.dockId && r.status !== 'completed');
  const idleDocks = docks.filter(d => d.status === 'idle');

  async function handleAssignDock(dockId: string, recordId: string) {
    try {
      await api.assignDock(dockId, {
        recordId,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
      });
      setAssigningRecordId(null);
      loadData();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">月台看板</h1>
        <p className="text-slate-400 text-sm mt-1">实时查看月台使用状态和车辆分配</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-800/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              月台状态 (共 {docks.length} 个月台，空闲 {idleDocks.length} 个)
            </h2>
            <div className="grid grid-cols-5 gap-4">
              {docks.map((dock) => {
                const record = getRecordForDock(dock);
                return (
                  <div
                    key={dock.id}
                    className={`rounded-xl border p-4 transition-colors ${dockStatusColors[dock.status]} ${
                      assigningRecordId && dock.status === 'idle' ? 'cursor-pointer ring-2 ring-blue-500/50' : ''
                    }`}
                    onClick={() => {
                      if (assigningRecordId && dock.status === 'idle') {
                        handleAssignDock(dock.id, assigningRecordId);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dockDotColors[dock.status]}`} />
                        <span className="font-semibold text-lg text-slate-100">
                          {dock.number} 号月台
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        dock.status === 'idle' ? 'bg-emerald-500/20 text-emerald-400' :
                        dock.status === 'occupied' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {DOCK_STATUS_LABELS[dock.status]}
                      </span>
                    </div>

                    {record ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-100">{record.plateNumber}</span>
                          <StatusBadge status={record.status} size="sm" />
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.driverName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {record.driverPhone}
                          </div>
                          <div>{record.cargoType} · {record.plannedQuantity}件</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm">
                        {assigningRecordId ? (
                          <div className="text-blue-400 font-medium">
                            <Check className="w-8 h-8 mx-auto mb-2" />
                            点击分配此月台
                          </div>
                        ) : (
                          <div className="text-slate-500">
                            <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            空闲中
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                待分配月台车辆 ({pendingRecords.length})
              </h2>
              {assigningRecordId && (
                <button
                  onClick={() => setAssigningRecordId(null)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100 bg-slate-700/50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  取消分配
                </button>
              )}
            </div>
            {pendingRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                所有车辆已分配月台
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {pendingRecords.map((record) => (
                  <div
                    key={record.id}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      assigningRecordId === record.id
                        ? 'bg-blue-500/10 border-blue-500/50 ring-2 ring-blue-500/30'
                        : 'bg-slate-800/50 border-slate-700/30 hover:border-slate-600'
                    }`}
                    onClick={() => setAssigningRecordId(
                      assigningRecordId === record.id ? null : record.id
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-100">{record.plateNumber}</span>
                      <StatusBadge status={record.status} size="sm" />
                    </div>
                    <div className="text-xs text-slate-400">
                      <p>{record.driverName} · {record.cargoType}</p>
                      <p className="mt-1">{record.plannedQuantity} 件</p>
                    </div>
                    {assigningRecordId === record.id && (
                      <p className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                        <Square className="w-3 h-3" />
                        请点击上方月台分配
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
