import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { yardApi } from '../api';
import './YardWorkstation.css';

interface Slot {
  id: number;
  slot_code: string;
  block: string;
  bay: string;
  row: string;
  tier: string;
  status: string;
  container_no: string | null;
  container_id: number | null;
  allowed_type: string;
  allowed_cargo: string;
}

interface MisplacedContainer {
  id: number;
  container_no: string;
  type: string;
  cargo_type: string;
  status: string;
  slot_code: string;
  allowed_type: string;
  allowed_cargo: string;
  block: string;
  allocation_id: number;
}

interface AllocationRecord {
  id: number;
  container_no: string;
  container_id: number;
  slot_id: number;
  slot_code: string;
  allocated_by: string;
  allocated_at: string;
  status: string;
  previous_slot_id: number | null;
  reason: string;
}

export default function YardWorkstation() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [misplaced, setMisplaced] = useState<MisplacedContainer[]>([]);
  const [allocationHistory, setAllocationHistory] = useState<AllocationRecord[]>([]);
  const [historyContainerNo, setHistoryContainerNo] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [fixModal, setFixModal] = useState<MisplacedContainer | null>(null);
  const [fixNewSlotId, setFixNewSlotId] = useState('');
  const [reallocateId, setReallocateId] = useState('');
  const [reallocateNewSlotId, setReallocateNewSlotId] = useState('');
  const [reallocateReason, setReallocateReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState('A');

  const loadSlots = useCallback(async () => {
    try {
      const res: any = await yardApi.getSlots({ block: selectedBlock });
      const data = res?.data || res;
      setSlots(Array.isArray(data) ? data : []);
    } catch {}
  }, [selectedBlock]);

  const loadMisplaced = useCallback(async () => {
    try {
      const res: any = await yardApi.getMisplaced();
      const data = res?.data || res;
      setMisplaced(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    loadSlots();
    loadMisplaced();
  }, [loadSlots, loadMisplaced]);

  const handleSearchHistory = async () => {
    if (!historyContainerNo.trim()) return;
    try {
      const res: any = await yardApi.getAllocationHistory(historyContainerNo.trim());
      const data = res?.data || res;
      setAllocationHistory(Array.isArray(data) ? data : []);
    } catch {
      setAllocationHistory([]);
    }
  };

  const handleReallocate = async () => {
    if (!reallocateId.trim() || !reallocateNewSlotId.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await yardApi.reallocateContainer(Number(reallocateId), {
        newSlotId: Number(reallocateNewSlotId),
        reason: reallocateReason.trim(),
        allocatedBy: '调度员',
      });
      setMessage({ type: 'success', text: '重新分配成功' });
      setReallocateId('');
      setReallocateNewSlotId('');
      setReallocateReason('');
      loadSlots();
      loadMisplaced();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '重新分配失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleFixMisplaced = async () => {
    if (!fixModal || !fixNewSlotId.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await yardApi.fixMisplaced(fixModal.allocation_id, {
        newSlotId: Number(fixNewSlotId),
        allocatedBy: '调度员',
      });
      setMessage({ type: 'success', text: '错放纠正成功' });
      setFixModal(null);
      setFixNewSlotId('');
      loadSlots();
      loadMisplaced();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '纠正失败' });
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatusClass = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'OCCUPIED') return 'yard__slot-cell--occupied';
    if (s === 'MISPLACED') return 'yard__slot-cell--misplaced';
    if (s === 'RESERVED') return 'yard__slot-cell--reserved';
    if (s === 'LOCKED') return 'yard__slot-cell--locked';
    return 'yard__slot-cell--empty';
  };

  const blocks = ['A', 'B', 'C'];

  const getBays = (blockSlots: Slot[]) =>
    [...new Set(blockSlots.map((s) => s.bay))].sort();

  const getRows = (baySlots: Slot[]) =>
    [...new Set(baySlots.map((s) => s.row))].sort();

  const currentBlockSlots = slots.filter((s) => s.block === selectedBlock);

  return (
    <div className="yard">
      {message && (
        <div className={message.type === 'success' ? 'yard__success-msg' : 'yard__error-msg'}>
          {message.text}
        </div>
      )}

      <div className="yard__top-row">
        <div className="yard__slot-map">
          <div className="yard__map-title">堆位图</div>
          <div className="yard__map-legend">
            <div className="yard__legend-item"><div className="yard__legend-dot yard__legend-dot--empty" /> 空闲</div>
            <div className="yard__legend-item"><div className="yard__legend-dot yard__legend-dot--occupied" /> 占用</div>
            <div className="yard__legend-item"><div className="yard__legend-dot yard__legend-dot--misplaced" /> 错放</div>
            <div className="yard__legend-item"><div className="yard__legend-dot yard__legend-dot--reserved" /> 预留</div>
            <div className="yard__legend-item"><div className="yard__legend-dot yard__legend-dot--locked" /> 锁定</div>
          </div>
          <div className="yard__block-tabs">
            {blocks.map((b) => (
              <button key={b} className={`yard__block-tab ${selectedBlock === b ? 'yard__block-tab--active' : ''}`}
                onClick={() => setSelectedBlock(b)}>
                {b} 区
              </button>
            ))}
          </div>

          {(() => {
            const bays = getBays(currentBlockSlots);
            if (bays.length === 0) {
              return <div style={{ color: '#5a7a9a', fontSize: 12, padding: '8px 0' }}>暂无数据</div>;
            }
            return bays.map((bay) => {
              const baySlots = currentBlockSlots.filter((s) => s.bay === bay);
              const rows = getRows(baySlots);
              return (
                <div key={bay}>
                  <div className="yard__bay-label">Bay {bay}</div>
                  <div className="yard__bay-grid">
                    {rows.map((row) => {
                      const rowSlots = baySlots.filter((s) => s.row === row).sort((a, b) => a.tier.localeCompare(b.tier));
                      return rowSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`yard__slot-cell ${getSlotStatusClass(slot.status)}`}
                          onClick={() => setSelectedSlot(slot)}
                          title={`${slot.slot_code} - ${slot.status}${slot.container_no ? ` - ${slot.container_no}` : ''}`}
                        >
                          <span className="yard__slot-code">{slot.slot_code.split('-').slice(2).join('-')}</span>
                          {slot.container_no && (
                            <span className="yard__slot-container">{slot.container_no.slice(-7)}</span>
                          )}
                        </div>
                      ));
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div className="yard__side-panel">
          <div className="yard__panel">
            <div className="yard__panel-title">错放集装箱 ({misplaced.length})</div>
            {misplaced.length === 0 ? (
              <div style={{ color: '#5a7a9a', fontSize: 13 }}>暂无错放记录</div>
            ) : (
              misplaced.map((item) => (
                <div key={item.id} className="yard__misplaced-item">
                  <div className="yard__misplaced-info">
                    <span className="yard__misplaced-container">{item.container_no}</span>
                    <span className="yard__misplaced-slot">
                      当前: {item.slot_code} (允许: {item.allowed_type || '无限制'})
                    </span>
                    <span className="yard__misplaced-slot" style={{ color: '#ef5350' }}>
                      箱型: {item.type} / 货类: {item.cargo_type}
                    </span>
                  </div>
                  <button className="yard__btn yard__btn--danger yard__btn--small"
                    onClick={() => { setFixModal(item); setFixNewSlotId(''); }}>
                    纠正
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="yard__bottom-row">
        <div className="yard__panel">
          <div className="yard__panel-title">分配历史回看</div>
          <div className="yard__history-input-row">
            <input className="yard__text-input" placeholder="输入箱号查询分配历史"
              value={historyContainerNo} onChange={(e) => setHistoryContainerNo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchHistory()} />
            <button className="yard__btn yard__btn--primary yard__btn--small" onClick={handleSearchHistory}>查询</button>
          </div>
          {allocationHistory.length > 0 && (
            <table className="yard__table">
              <thead>
                <tr><th>箱号</th><th>堆位</th><th>状态</th><th>操作人</th><th>时间</th><th>原因</th></tr>
              </thead>
              <tbody>
                {allocationHistory.map((record) => (
                  <tr key={record.id}>
                    <td>{record.container_no}</td>
                    <td>{record.slot_code}</td>
                    <td>{record.status}</td>
                    <td>{record.allocated_by}</td>
                    <td>{dayjs(record.allocated_at).format('MM-DD HH:mm')}</td>
                    <td>{record.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="yard__panel">
          <div className="yard__panel-title">手动重新分配</div>
          <div className="yard__form-group">
            <label className="yard__form-label">集装箱ID</label>
            <input className="yard__form-input" value={reallocateId}
              onChange={(e) => setReallocateId(e.target.value)} placeholder="输入集装箱ID" />
          </div>
          <div className="yard__form-group">
            <label className="yard__form-label">新堆位ID</label>
            <input className="yard__form-input" value={reallocateNewSlotId}
              onChange={(e) => setReallocateNewSlotId(e.target.value)} placeholder="输入目标堆位ID" />
          </div>
          <div className="yard__form-group">
            <label className="yard__form-label">原因</label>
            <textarea className="yard__form-textarea" value={reallocateReason}
              onChange={(e) => setReallocateReason(e.target.value)} placeholder="填写重新分配原因" />
          </div>
          <button className="yard__btn yard__btn--warning" onClick={handleReallocate} disabled={loading}>
            {loading ? '处理中...' : '提交重新分配'}
          </button>
        </div>
      </div>

      {selectedSlot && (
        <div className="yard__overlay" onClick={() => setSelectedSlot(null)}>
          <div className="yard__modal" onClick={(e) => e.stopPropagation()}>
            <div className="yard__modal-title">堆位详情 - {selectedSlot.slot_code}</div>
            <div className="yard__slot-detail-grid">
              <div className="yard__slot-detail-item">
                <span className="yard__slot-detail-label">堆位编码</span>
                <span className="yard__slot-detail-value">{selectedSlot.slot_code}</span>
              </div>
              <div className="yard__slot-detail-item">
                <span className="yard__slot-detail-label">区/贝/行/层</span>
                <span className="yard__slot-detail-value">{selectedSlot.block}-{selectedSlot.bay}-{selectedSlot.row}-{selectedSlot.tier}</span>
              </div>
              <div className="yard__slot-detail-item">
                <span className="yard__slot-detail-label">状态</span>
                <span className="yard__slot-detail-value">{selectedSlot.status}</span>
              </div>
              <div className="yard__slot-detail-item">
                <span className="yard__slot-detail-label">集装箱号</span>
                <span className="yard__slot-detail-value">{selectedSlot.container_no || '无'}</span>
              </div>
              <div className="yard__slot-detail-item">
                <span className="yard__slot-detail-label">允许箱型</span>
                <span className="yard__slot-detail-value">{selectedSlot.allowed_type || '无限制'}</span>
              </div>
              <div className="yard__slot-detail-item">
                <span className="yard__slot-detail-label">允许货类</span>
                <span className="yard__slot-detail-value">{selectedSlot.allowed_cargo || '无限制'}</span>
              </div>
            </div>
            <div className="yard__modal-actions">
              <button className="yard__btn yard__btn--secondary" onClick={() => setSelectedSlot(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {fixModal && (
        <div className="yard__overlay" onClick={() => setFixModal(null)}>
          <div className="yard__modal" onClick={(e) => e.stopPropagation()}>
            <div className="yard__modal-title">纠正错放 - {fixModal.container_no}</div>
            <div style={{ fontSize: 13, color: '#8ba4bc', marginBottom: 12 }}>
              当前堆位: {fixModal.slot_code} (允许: {fixModal.allowed_type || '无限制'})
              <br />箱型: {fixModal.type} / 货类: {fixModal.cargo_type}
            </div>
            <div className="yard__form-group">
              <label className="yard__form-label">目标堆位ID</label>
              <input className="yard__form-input" value={fixNewSlotId}
                onChange={(e) => setFixNewSlotId(e.target.value)} placeholder="输入新堆位ID" />
            </div>
            <div className="yard__modal-actions">
              <button className="yard__btn yard__btn--danger" onClick={handleFixMisplaced} disabled={loading}>
                {loading ? '处理中...' : '确认纠正'}
              </button>
              <button className="yard__btn yard__btn--secondary" onClick={() => setFixModal(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
