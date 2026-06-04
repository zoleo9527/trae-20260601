import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { BED_STATUS_COLORS, BED_STATUS_LABELS, NURSING_LEVEL_COLORS, NURSING_LEVEL_LABELS, ROLE_LABELS, type Bed, type BedStatus, type NursingLevelType } from '@/types';
import { AlertTriangle, ArrowRight, FileText, Keyboard, RotateCcw, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function BedsPage() {
  const { beds, residents, nursingLevels, currentRole, selectBed, selectedBedId, notePanelOpen, setNotePanelOpen, addNoteToBed, transferNoteToNursingLevel, admitResident, dischargeResident } = useAppStore();
  const [urlParams, setUrlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<BedStatus | null>(null);
  const [admitModalBedId, setAdmitModalBedId] = useState<string | null>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(0);
  const [pendingFocusBedId, setPendingFocusBedId] = useState<string | null>(null);
  const [autoExpandDone, setAutoExpandDone] = useState(false);

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (floorFilter !== null && b.floor !== floorFilter) return false;
      if (statusFilter !== null && b.status !== statusFilter) return false;
      if (searchQuery) {
        const res = b.residentId ? residents.find((r) => r.id === b.residentId) : null;
        const q = searchQuery.toLowerCase();
        if (
          !b.roomNumber.toLowerCase().includes(q) &&
          !b.bedNumber.toLowerCase().includes(q) &&
          !(res && res.name.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [beds, floorFilter, statusFilter, searchQuery, residents]);

  function getResident(bed: Bed) {
    return bed.residentId ? residents.find((r) => r.id === bed.residentId) : null;
  }

  function getNursingLevelForBed(bed: Bed) {
    if (!bed.residentId) return null;
    return nursingLevels.find((nl) => nl.residentId === bed.residentId);
  }

  function handleReturnProcess(bedId: string, nursingLevelId: string, status: string) {
    const params = new URLSearchParams();
    params.set('focus', nursingLevelId);
    params.set('status', status);
    window.location.href = `/nursing-levels?${params.toString()}`;
  }

  const selectedBed = beds.find((b) => b.id === selectedBedId);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    if (e.key === 'ArrowDown' && filteredBeds.length > 0) {
      e.preventDefault();
      setFocusedRowIndex((prev) => Math.min(prev + 1, filteredBeds.length - 1));
    } else if (e.key === 'ArrowUp' && filteredBeds.length > 0) {
      e.preventDefault();
      setFocusedRowIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredBeds[focusedRowIndex]) {
      e.preventDefault();
      selectBed(filteredBeds[focusedRowIndex].id);
    } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const firstAvailable = filteredBeds.find((b) => b.status === 'available');
      if (firstAvailable) {
        setAdmitModalBedId(firstAvailable.id);
      }
    } else if (e.key === 'Escape') {
      selectBed(null);
      setAdmitModalBedId(null);
    }
  }, [filteredBeds, focusedRowIndex, selectBed]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (focusedRowIndex >= filteredBeds.length) {
      setFocusedRowIndex(Math.max(0, filteredBeds.length - 1));
    }
  }, [filteredBeds.length, focusedRowIndex]);

  useEffect(() => {
    if (autoExpandDone || beds.length === 0) return;
    const focusBedId = urlParams.get('focus');
    const statusParam = urlParams.get('status') as BedStatus | null;

    if (statusParam && ['available', 'occupied', 'pending_adjustment', 'maintenance'].includes(statusParam)) {
      setStatusFilter(statusParam);
    }

    if (focusBedId) {
      setPendingFocusBedId(focusBedId);
    }

    setAutoExpandDone(true);
    urlParams.delete('focus');
    urlParams.delete('status');
    setUrlParams(urlParams, { replace: true });
  }, [autoExpandDone, beds.length, urlParams, setUrlParams]);

  useEffect(() => {
    if (!pendingFocusBedId || filteredBeds.length === 0) return;

    const targetBed = filteredBeds.find((b) => b.id === pendingFocusBedId);
    if (targetBed) {
      selectBed(pendingFocusBedId);
      const idx = filteredBeds.findIndex((b) => b.id === pendingFocusBedId);
      if (idx >= 0) setFocusedRowIndex(idx);
      setTimeout(() => {
        const row = document.querySelector(`[data-bed-id="${pendingFocusBedId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      setPendingFocusBedId(null);
    }
  }, [pendingFocusBedId, filteredBeds, selectBed]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">床位安排</h2>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                <Keyboard size={10} />
                <span>↑↓ 选择 · Enter 详情 · Ctrl+N 快速入住</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>共 {beds.length} 床</span>
              <span>·</span>
              <span className="text-emerald-600">{beds.filter((b) => b.status === 'available').length} 空闲</span>
              <span>·</span>
              <span className="text-amber-600">{beds.filter((b) => b.status === 'pending_adjustment').length} 待调整</span>
            </div>
          </div>
          {(() => {
            const returnedCount = nursingLevels.filter((nl) => nl.status === 'returned').length;
            const anomalyCount = nursingLevels.filter((nl) => nl.status === 'anomaly').length;
            if (returnedCount === 0 && anomalyCount === 0) return null;
            return (
              <div className={cn(
                'p-3 rounded-md border flex items-center justify-between',
                returnedCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
              )}>
                <div className="flex items-center gap-2">
                  {returnedCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-amber-500" />
                      <span className="text-xs font-medium text-amber-700">
                        {returnedCount} 张床位护理等级已退回，需重新安排
                      </span>
                    </div>
                  )}
                  {returnedCount > 0 && anomalyCount > 0 && <span className="text-amber-300">|</span>}
                  {anomalyCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle size={14} className="text-red-500" />
                      <span className="text-xs font-medium text-red-700">
                        {anomalyCount} 个异常待处理
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {returnedCount > 0 && (
                    <button
                      onClick={() => setStatusFilter('pending_adjustment' as BedStatus)}
                      className="px-2.5 py-1 text-[10px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
                    >
                      筛选待调整
                    </button>
                  )}
                  {anomalyCount > 0 && (
                    <button
                      onClick={() => {
                        const firstAnomaly = nursingLevels.find((nl) => nl.status === 'anomaly');
                        const params = new URLSearchParams();
                        params.set('status', 'anomaly');
                        if (firstAnomaly) params.set('focus', firstAnomaly.id);
                        window.location.href = `/nursing-levels?${params.toString()}`;
                      }}
                      className="px-2.5 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      查看异常
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索房间号、床号或姓名"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="flex items-center gap-1">
              {[null, 1, 2, 3].map((f) => (
                <button
                  key={f ?? 'all'}
                  onClick={() => setFloorFilter(f)}
                  className={cn(
                    'px-2.5 py-1.5 text-[11px] rounded-md border transition-colors',
                    floorFilter === f ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {f === null ? '全部楼层' : `${f}楼`}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {([null, 'available', 'occupied', 'pending_adjustment', 'maintenance'] as (BedStatus | null)[]).map((s) => (
                <button
                  key={s ?? 'all'}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'px-2 py-1.5 text-[11px] rounded-md border transition-colors',
                    statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                >
                  {s === null ? '全部状态' : BED_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-5 pb-4">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">楼层</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-20">房间</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-14">床号</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-12">状态</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">姓名</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">护理等级</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-20">退回状态</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600">备注预览</th>
                  <th className="text-left px-3 py-2 font-semibold text-slate-600 w-16">备注流转</th>
                  <th className="text-right px-3 py-2 font-semibold text-slate-600 w-36">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeds.map((bed, index) => {
                  const res = getResident(bed);
                  const nl = getNursingLevelForBed(bed);
                  const untransferred = bed.notes.filter((n) => !n.transferredToNursingLevel);
                  const latestNote = bed.notes.length > 0 ? bed.notes[bed.notes.length - 1] : null;
                  const isFocused = focusedRowIndex === index;

                  return (
                    <tr
                      key={bed.id}
                      data-bed-id={bed.id}
                      className={cn(
                        'border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors',
                        selectedBedId === bed.id && 'bg-sky-50/50',
                        isFocused && !selectedBedId && 'bg-slate-100/60 ring-1 ring-inset ring-slate-300',
                        bed.status === 'pending_adjustment' && 'bg-amber-50/30',
                        nl?.status === 'anomaly' && 'bg-red-50/30',
                        nl?.status === 'returned' && 'bg-orange-50/30'
                      )}
                      onClick={() => { selectBed(bed.id); setFocusedRowIndex(index); }}
                      onMouseEnter={() => setFocusedRowIndex(index)}
                    >
                      <td className="px-3 py-2 text-slate-500 font-mono">{bed.floor}F</td>
                      <td className="px-3 py-2 text-slate-700 font-mono">{bed.roomNumber}</td>
                      <td className="px-3 py-2 text-slate-700 font-mono">{bed.bedNumber}</td>
                      <td className="px-3 py-2">
                        <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', BED_STATUS_COLORS[bed.status])} />
                          {BED_STATUS_LABELS[bed.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-800 font-medium">{res?.name || '—'}</td>
                      <td className="px-3 py-2">
                        {res ? (
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', NURSING_LEVEL_COLORS[res.nursingLevel])}>
                            {NURSING_LEVEL_LABELS[res.nursingLevel]}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {nl?.status === 'returned' ? (
                          <div className="flex items-center gap-1">
                            <RotateCcw size={10} className="text-amber-500" />
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                              已退回
                            </span>
                          </div>
                        ) : nl?.status === 'anomaly' ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle size={10} className="text-red-500" />
                            <span className="text-[10px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-medium">
                              异常
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-500 truncate max-w-[180px]">
                        {latestNote ? (
                          <span className="truncate">{latestNote.content}</span>
                        ) : (
                          <span className="text-slate-300">无备注</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {untransferred.length > 0 ? (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            {untransferred.length}条待流转
                          </span>
                        ) : bed.notes.length > 0 ? (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✓ 已自动流转</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {nl?.status === 'returned' && (
                            <button
                              onClick={() => handleReturnProcess(bed.id, nl.id, 'returned')}
                              className="px-2 py-1 text-[10px] bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors flex items-center gap-0.5"
                            >
                              <RotateCcw size={10} />
                              处理退回
                            </button>
                          )}
                          {nl?.status === 'anomaly' && (
                            <button
                              onClick={() => handleReturnProcess(bed.id, nl.id, 'anomaly')}
                              className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-0.5"
                            >
                              <AlertTriangle size={10} />
                              处理异常
                            </button>
                          )}
                          {currentRole === 'nursing_supervisor' && bed.status === 'available' && (
                            <button
                              onClick={() => setAdmitModalBedId(bed.id)}
                              className="px-2 py-1 text-[10px] bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                            >
                              入住
                            </button>
                          )}
                          {currentRole === 'nursing_supervisor' && bed.residentId && (
                            <button
                              onClick={() => dischargeResident(bed.id)}
                              className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                            >
                              退床
                            </button>
                          )}
                          {currentRole === 'care_worker' && nl?.status === 'confirmed' && (
                            <button
                              onClick={() => window.location.href = '/nursing-levels'}
                              className="px-2 py-1 text-[10px] bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                            >
                              记录护理
                            </button>
                          )}
                          {currentRole === 'social_worker' && (
                            <button
                              onClick={() => { addNoteToBed(bed.id, `[家属沟通] ${prompt('请输入沟通内容：') || ''}`); }}
                              className="px-2 py-1 text-[10px] bg-violet-500 text-white rounded hover:bg-violet-600 transition-colors"
                            >
                              家属沟通
                            </button>
                          )}
                          <button
                            onClick={() => selectBed(bed.id)}
                            className="px-2 py-1 text-[10px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors flex items-center gap-0.5"
                          >
                            <FileText size={10} />
                            备注
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBed && (
        <NotePanel
          bed={selectedBed}
          onClose={() => { selectBed(null); setNotePanelOpen(false); }}
          onAddNote={(content) => addNoteToBed(selectedBed.id, content)}
          onTransfer={(noteId) => transferNoteToNursingLevel(noteId, selectedBed.id)}
        />
      )}

      {admitModalBedId && (
        <AdmitModal
          bedId={admitModalBedId}
          onClose={() => setAdmitModalBedId(null)}
          onAdmit={(data, note) => { admitResident(admitModalBedId, data, note); setAdmitModalBedId(null); }}
        />
      )}
    </div>
  );
}

function NotePanel({ bed, onClose, onAddNote, onTransfer }: {
  bed: Bed;
  onClose: () => void;
  onAddNote: (content: string) => void;
  onTransfer: (noteId: string) => void;
}) {
  const [noteText, setNoteText] = useState('');

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {bed.roomNumber}房{bed.bedNumber}床 备注
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
          <X size={14} className="text-slate-400" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {bed.notes.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">暂无备注</p>
        )}
        {bed.notes.map((note) => (
          <div key={note.id} className={cn(
            'rounded-md border px-3 py-2',
            note.transferredToNursingLevel ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                'text-[9px] px-1.5 py-0.5 rounded font-medium',
                note.source === 'bed_arrangement' ? 'bg-sky-100 text-sky-700' :
                note.source === 'nursing_level' ? 'bg-emerald-100 text-emerald-700' :
                'bg-amber-100 text-amber-700'
              )}>
                {note.source === 'bed_arrangement' ? '床位安排' : note.source === 'nursing_level' ? '护理等级' : '异常退回'}
              </span>
              {note.transferredToNursingLevel ? (
                <span className="text-[9px] text-emerald-600">✓ 已自动流转至护理等级</span>
              ) : (
                <button
                  onClick={() => onTransfer(note.id)}
                  className="text-[9px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                >
                  ○ 流转 <ArrowRight size={8} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">{note.content}</p>
            <p className="text-[9px] text-slate-400 mt-1">
              {new Date(note.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {ROLE_LABELS[note.createdBy]}
            </p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-1 mb-1">
          <FileText size={10} className="text-emerald-500" />
          <span className="text-[10px] text-emerald-600 font-medium">备注将自动流转至护理等级</span>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="输入备注内容..."
          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none h-16 focus:outline-none focus:ring-1 focus:ring-slate-400"
        />
        <button
          onClick={() => { if (noteText.trim()) { onAddNote(noteText.trim()); setNoteText(''); } }}
          disabled={!noteText.trim()}
          className="w-full mt-1.5 px-3 py-1.5 text-xs bg-slate-800 text-white rounded-md hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          添加备注
        </button>
      </div>
    </div>
  );
}

function AdmitModal({ bedId, onClose, onAdmit }: {
  bedId: string;
  onClose: () => void;
  onAdmit: (data: Omit<import('@/types').Resident, 'id' | 'notes'>, note?: string) => void;
}) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [level, setLevel] = useState<NursingLevelType>(2);
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-[400px] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">入住登记</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={16} className="text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">姓名</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">年龄</label>
              <input value={age} onChange={(e) => setAge(e.target.value)} type="number" className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">性别</label>
              <div className="flex gap-2">
                <button onClick={() => setGender('male')} className={cn('flex-1 py-1.5 text-xs rounded-md border', gender === 'male' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600')}>男</button>
                <button onClick={() => setGender('female')} className={cn('flex-1 py-1.5 text-xs rounded-md border', gender === 'female' ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600')}>女</button>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">护理等级</label>
              <div className="flex gap-1">
                {([1, 2, 3, 4, 5] as NursingLevelType[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={cn('flex-1 py-1 text-[10px] rounded border font-medium', level === l ? NURSING_LEVEL_COLORS[l] + ' border-current' : 'border-slate-200 text-slate-500')}
                  >
                    {NURSING_LEVEL_LABELS[l]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">入住备注 <span className="text-amber-500">（将流转至护理等级）</span></label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="输入备注，如：家属反映老人需协助如厕..."
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md resize-none h-16 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md">取消</button>
          <button
            onClick={() => {
              if (!name.trim() || !age) return;
              onAdmit({
                name: name.trim(),
                age: Number(age),
                gender,
                admissionDate: new Date().toISOString().split('T')[0],
                nursingLevel: level,
                bedId,
                status: 'active',
              }, note.trim() || undefined);
            }}
            disabled={!name.trim() || !age}
            className="px-4 py-1.5 text-xs bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            确认入住
          </button>
        </div>
      </div>
    </div>
  );
}
