import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { gateApi, yardApi } from '../api';
import './GateWorkstation.css';

const EMPTY_FORM = {
  container_no: '',
  type: '20GP',
  owner: '',
  cargo_type: 'GENERAL',
  weight_kg: '',
  truck_no: '',
  driver_name: '',
  driver_phone: '',
  entry_type: 'IMPORT',
  operator_name: '',
};

interface Entry {
  id: number;
  container_id: number;
  container_no: string;
  type: string;
  cargo_type: string;
  weight_kg: number;
  truck_no: string;
  driver_name: string;
  driver_phone: string;
  entry_type: string;
  gate_status: string;
  status: string;
  entry_time: string;
  modified_at: string;
  modified_by: string;
  modification_reason: string;
  inspection_status: string;
}

export default function GateWorkstation() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'modify'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [showModify, setShowModify] = useState(false);
  const [modifyForm, setModifyForm] = useState<Record<string, any>>({});
  const [recentModifications, setRecentModifications] = useState<any[]>([]);

  const loadEntries = useCallback(async () => {
    try {
      const res: any = await gateApi.listEntries(search ? { container_no: search } : undefined);
      const data = res?.data || res;
      setEntries(Array.isArray(data) ? data : []);
    } catch {}
  }, [search]);

  const loadRecentModifications = useCallback(async () => {
    try {
      const res: any = await yardApi.getAllocationHistory('');
    } catch {}
    try {
      const res: any = await gateApi.listEntries({ limit: 5 });
      const data = res?.data || res;
      const items = Array.isArray(data) ? data : [];
      setRecentModifications(items.filter((e: any) => e.modified_at && e.modified_at.length > 0));
    } catch {}
  }, []);

  useEffect(() => {
    loadEntries();
    loadRecentModifications();
  }, [loadEntries, loadRecentModifications]);

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res: any = await gateApi.registerEntry({ ...form, weight_kg: Number(form.weight_kg) || 0 });
      const data = res?.data || res;
      setMessage({ type: 'success', text: `进场登记成功！集装箱ID: ${data.id}，闸口记录ID: ${data.gate_record_id}` });
      setForm(EMPTY_FORM);
      loadEntries();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '登记失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEntry = async (entry: Entry) => {
    try {
      const res: any = await gateApi.getEntry(entry.id);
      setSelectedEntry(res?.data || res || entry);
    } catch {
      setSelectedEntry(entry);
    }
  };

  const handleOpenModify = (entry: Entry) => {
    setModifyForm({
      type: entry.type,
      cargo_type: entry.cargo_type,
      weight_kg: entry.weight_kg,
      truck_no: entry.truck_no,
      driver_name: entry.driver_name,
      driver_phone: entry.driver_phone,
    });
    setShowModify(true);
  };

  const handleModifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;
    setLoading(true);
    try {
      await gateApi.modifyEntry(selectedEntry.container_id, {
        ...modifyForm,
        weight_kg: Number(modifyForm.weight_kg) || 0,
        modification_reason: modifyForm.modification_reason || '闸口员修改',
        modified_by: modifyForm.operator_name || '闸口员',
      });
      setMessage({ type: 'modify', text: '进场记录已修改，堆位分配将自动检查是否需要重新分配' });
      setShowModify(false);
      loadEntries();
      loadRecentModifications();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '修改失败' });
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeBadge = (type: string) => {
    if (type === 'EXPORT') return 'gate__badge--export';
    return 'gate__badge--import';
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ENTERING: '进场中', IN_YARD: '在场', ALLOCATED: '已分配',
      MISPLACED: '错放', DEPARTING: '离场中', DEPARTED: '已离场',
      REGISTERED: '已登记', INSPECTING: '检查中', APPROVED: '已通过', REJECTED: '已拒绝',
    };
    return map[status] || status;
  };

  return (
    <div className="gate">
      {message && (
        <div className={
          message.type === 'success' ? 'gate__success-msg' :
          message.type === 'modify' ? 'gate__modify-info' : 'gate__error-msg'
        }>
          {message.text}
        </div>
      )}

      <div className="gate__grid">
        <div className="gate__form-panel">
          <div className="gate__panel-title">集装箱进场登记</div>
          <form onSubmit={handleSubmit}>
            <div className="gate__form-group">
              <label className="gate__form-label">箱号 *</label>
              <input className="gate__form-input" value={form.container_no}
                onChange={(e) => handleFormChange('container_no', e.target.value)} required />
            </div>
            <div className="gate__form-row">
              <div className="gate__form-group">
                <label className="gate__form-label">箱型</label>
                <select className="gate__form-select" value={form.type}
                  onChange={(e) => handleFormChange('type', e.target.value)}>
                  <option value="20GP">20GP</option>
                  <option value="40GP">40GP</option>
                  <option value="40HC">40HC</option>
                  <option value="45HC">45HC</option>
                </select>
              </div>
              <div className="gate__form-group">
                <label className="gate__form-label">货类</label>
                <select className="gate__form-select" value={form.cargo_type}
                  onChange={(e) => handleFormChange('cargo_type', e.target.value)}>
                  <option value="GENERAL">普通</option>
                  <option value="DANGEROUS">危险品</option>
                  <option value="REFRIGERATED">冷藏</option>
                  <option value="OVERSIZE">超大</option>
                </select>
              </div>
            </div>
            <div className="gate__form-row">
              <div className="gate__form-group">
                <label className="gate__form-label">持有人</label>
                <input className="gate__form-input" value={form.owner}
                  onChange={(e) => handleFormChange('owner', e.target.value)} />
              </div>
              <div className="gate__form-group">
                <label className="gate__form-label">重量 (kg)</label>
                <input className="gate__form-input" type="number" value={form.weight_kg}
                  onChange={(e) => handleFormChange('weight_kg', e.target.value)} />
              </div>
            </div>
            <div className="gate__form-row">
              <div className="gate__form-group">
                <label className="gate__form-label">进场类型</label>
                <select className="gate__form-select" value={form.entry_type}
                  onChange={(e) => handleFormChange('entry_type', e.target.value)}>
                  <option value="IMPORT">进口</option>
                  <option value="EXPORT">出口</option>
                  <option value="TRANSSHIPMENT">中转</option>
                </select>
              </div>
              <div className="gate__form-group">
                <label className="gate__form-label">操作员</label>
                <input className="gate__form-input" value={form.operator_name}
                  onChange={(e) => handleFormChange('operator_name', e.target.value)} />
              </div>
            </div>
            <div className="gate__form-group">
              <label className="gate__form-label">车牌号</label>
              <input className="gate__form-input" value={form.truck_no}
                onChange={(e) => handleFormChange('truck_no', e.target.value)} />
            </div>
            <div className="gate__form-row">
              <div className="gate__form-group">
                <label className="gate__form-label">司机姓名</label>
                <input className="gate__form-input" value={form.driver_name}
                  onChange={(e) => handleFormChange('driver_name', e.target.value)} />
              </div>
              <div className="gate__form-group">
                <label className="gate__form-label">司机电话</label>
                <input className="gate__form-input" value={form.driver_phone}
                  onChange={(e) => handleFormChange('driver_phone', e.target.value)} />
              </div>
            </div>
            <div className="gate__form-actions">
              <button type="submit" className="gate__btn gate__btn--primary" disabled={loading}>
                {loading ? '提交中...' : '登记进场'}
              </button>
              <button type="button" className="gate__btn gate__btn--secondary"
                onClick={() => setForm(EMPTY_FORM)}>清空</button>
            </div>
          </form>
        </div>

        <div className="gate__list-panel">
          <div className="gate__panel-title">进场记录</div>
          <div className="gate__search-bar">
            <input className="gate__search-input" placeholder="搜索箱号..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="gate__btn gate__btn--primary gate__btn--small"
              onClick={loadEntries}>查询</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="gate__table">
              <thead>
                <tr>
                  <th>箱号</th><th>箱型</th><th>进场类型</th><th>车牌号</th><th>状态</th><th>进场时间</th><th>操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#5a7a9a' }}>暂无记录</td></tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ fontWeight: 600 }}>{entry.container_no}</td>
                      <td>{entry.type}</td>
                      <td>
                        <span className={`gate__badge ${getEntryTypeBadge(entry.entry_type)}`}>
                          {entry.entry_type === 'IMPORT' ? '进口' : entry.entry_type === 'EXPORT' ? '出口' : '中转'}
                        </span>
                      </td>
                      <td>{entry.truck_no}</td>
                      <td>{getStatusLabel(entry.gate_status || entry.status)}</td>
                      <td>{dayjs(entry.entry_time).format('MM-DD HH:mm')}</td>
                      <td>
                        <button className="gate__btn gate__btn--secondary gate__btn--small"
                          onClick={() => handleSelectEntry(entry)}>详情</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {recentModifications.length > 0 && (
        <div className="gate__modifications">
          <div className="gate__panel-title">最近修改记录</div>
          <table className="gate__table">
            <thead>
              <tr><th>箱号</th><th>修改人</th><th>修改原因</th><th>修改时间</th></tr>
            </thead>
            <tbody>
              {recentModifications.map((mod: any, idx: number) => (
                <tr key={idx}>
                  <td>{mod.container_no}</td>
                  <td>{mod.modified_by || '-'}</td>
                  <td>{mod.modification_reason || '-'}</td>
                  <td>{dayjs(mod.modified_at).format('YYYY-MM-DD HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedEntry && !showModify && (
        <div className="gate__detail-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="gate__detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gate__detail-header">
              <h3 style={{ color: '#4fc3f7', fontSize: 16 }}>进场详情 - {selectedEntry.container_no}</h3>
              <button className="gate__detail-close" onClick={() => setSelectedEntry(null)}>✕</button>
            </div>
            <div className="gate__detail-grid">
              <div className="gate__detail-item"><span className="gate__detail-label">箱号</span><span className="gate__detail-value">{selectedEntry.container_no}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">箱型</span><span className="gate__detail-value">{selectedEntry.type}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">货类</span><span className="gate__detail-value">{selectedEntry.cargo_type}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">重量</span><span className="gate__detail-value">{selectedEntry.weight_kg} kg</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">车牌号</span><span className="gate__detail-value">{selectedEntry.truck_no}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">司机</span><span className="gate__detail-value">{selectedEntry.driver_name} {selectedEntry.driver_phone}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">进场类型</span><span className="gate__detail-value">{selectedEntry.entry_type}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">闸口状态</span><span className="gate__detail-value">{getStatusLabel(selectedEntry.gate_status)}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">箱体状态</span><span className="gate__detail-value">{getStatusLabel(selectedEntry.status)}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">查验状态</span><span className="gate__detail-value">{selectedEntry.inspection_status}</span></div>
              <div className="gate__detail-item"><span className="gate__detail-label">登记时间</span><span className="gate__detail-value">{dayjs(selectedEntry.entry_time).format('YYYY-MM-DD HH:mm:ss')}</span></div>
              {selectedEntry.modified_at && (
                <div className="gate__detail-item"><span className="gate__detail-label">最后修改</span><span className="gate__detail-value" style={{ color: '#ffa726' }}>{selectedEntry.modified_at} by {selectedEntry.modified_by}</span></div>
              )}
            </div>
            <div className="gate__form-actions" style={{ marginTop: 20 }}>
              <button className="gate__btn gate__btn--warning" onClick={() => handleOpenModify(selectedEntry)}>修改进场记录</button>
              <button className="gate__btn gate__btn--secondary" onClick={() => setSelectedEntry(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showModify && selectedEntry && (
        <div className="gate__detail-overlay" onClick={() => setShowModify(false)}>
          <div className="gate__detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gate__detail-header">
              <h3 style={{ color: '#ffa726', fontSize: 16 }}>修改进场记录 - {selectedEntry.container_no}</h3>
              <button className="gate__detail-close" onClick={() => setShowModify(false)}>✕</button>
            </div>
            <form onSubmit={handleModifySubmit}>
              <div className="gate__detail-grid">
                <div className="gate__form-group">
                  <label className="gate__form-label">箱型</label>
                  <select className="gate__form-select" value={modifyForm.type || ''}
                    onChange={(e) => setModifyForm({ ...modifyForm, type: e.target.value })}>
                    <option value="20GP">20GP</option><option value="40GP">40GP</option>
                    <option value="40HC">40HC</option><option value="45HC">45HC</option>
                  </select>
                </div>
                <div className="gate__form-group">
                  <label className="gate__form-label">货类</label>
                  <select className="gate__form-select" value={modifyForm.cargo_type || ''}
                    onChange={(e) => setModifyForm({ ...modifyForm, cargo_type: e.target.value })}>
                    <option value="GENERAL">普通</option><option value="DANGEROUS">危险品</option>
                    <option value="REFRIGERATED">冷藏</option><option value="OVERSIZE">超大</option>
                  </select>
                </div>
                <div className="gate__form-group">
                  <label className="gate__form-label">重量 (kg)</label>
                  <input className="gate__form-input" type="number" value={modifyForm.weight_kg || ''}
                    onChange={(e) => setModifyForm({ ...modifyForm, weight_kg: e.target.value })} />
                </div>
                <div className="gate__form-group">
                  <label className="gate__form-label">车牌号</label>
                  <input className="gate__form-input" value={modifyForm.truck_no || ''}
                    onChange={(e) => setModifyForm({ ...modifyForm, truck_no: e.target.value })} />
                </div>
                <div className="gate__form-group">
                  <label className="gate__form-label">司机姓名</label>
                  <input className="gate__form-input" value={modifyForm.driver_name || ''}
                    onChange={(e) => setModifyForm({ ...modifyForm, driver_name: e.target.value })} />
                </div>
                <div className="gate__form-group">
                  <label className="gate__form-label">司机电话</label>
                  <input className="gate__form-input" value={modifyForm.driver_phone || ''}
                    onChange={(e) => setModifyForm({ ...modifyForm, driver_phone: e.target.value })} />
                </div>
              </div>
              <div className="gate__form-group" style={{ marginTop: 12 }}>
                <label className="gate__form-label">修改原因 *</label>
                <input className="gate__form-input" value={modifyForm.modification_reason || ''}
                  onChange={(e) => setModifyForm({ ...modifyForm, modification_reason: e.target.value })}
                  placeholder="如：船公司确认箱型变更" required />
              </div>
              <div className="gate__form-actions" style={{ marginTop: 20 }}>
                <button type="submit" className="gate__btn gate__btn--warning" disabled={loading}>
                  {loading ? '提交中...' : '确认修改'}
                </button>
                <button type="button" className="gate__btn gate__btn--secondary" onClick={() => setShowModify(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
