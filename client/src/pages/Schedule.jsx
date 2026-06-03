import { AlertTriangle, Calendar, Check, ChevronLeft, ChevronRight, Edit3, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { schedulesApi } from '../api';
import StatusBadge from '../components/StatusBadge';

const CHANNELS = ['综合频道', '影视频道', '生活频道', '少儿频道', '体育频道'];
const TIME_SLOTS = ['17:00', '17:30', '17:45', '18:00', '18:30', '19:00', '19:30', '20:00', '20:15', '20:30', '21:00', '21:30'];
const POSITIONS = ['A1', 'A2', 'B1', 'B2', 'normal'];

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatWeekday(date) {
  const d = new Date(date);
  return ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
}

export default function Schedule() {
  const navigate = useNavigate();
  const [calendarData, setCalendarData] = useState({});
  const [channels, setChannels] = useState(CHANNELS);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [conflictCheck, setConflictCheck] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    loadCalendar();
  }, [weekOffset]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await schedulesApi.calendar({
        start_date: weekDays[0],
        end_date: weekDays[6],
      });
      setCalendarData(data.schedules || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const conflictSchedules = Object.values(calendarData).flat().filter(s => s.status === 'conflict');

  const startEditing = (schedule) => {
    setEditingSchedule(schedule.id);
    setEditForm({
      channel: schedule.channel,
      time_slot: schedule.time_slot,
      schedule_date: schedule.schedule_date,
      position: schedule.position,
      status: schedule.status,
      conflict_note: '',
    });
    setConflictCheck(null);
  };

  const cancelEditing = () => {
    setEditingSchedule(null);
    setEditForm({});
    setConflictCheck(null);
  };

  const handleCheckConflict = async () => {
    setCheckingConflict(true);
    try {
      const result = await schedulesApi.checkConflict({
        channel: editForm.channel,
        time_slot: editForm.time_slot,
        schedule_date: editForm.schedule_date,
        exclude_id: editingSchedule,
      });
      setConflictCheck(result);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleSaveSchedule = async (scheduleId, schedule) => {
    const isConflictSchedule = schedule.status === 'conflict';
    const fieldChanged = editForm.channel !== schedule.channel
      || editForm.time_slot !== schedule.time_slot
      || editForm.schedule_date !== schedule.schedule_date
      || editForm.position !== schedule.position;
    const hasNote = editForm.conflict_note && editForm.conflict_note.trim().length > 0;

    if (isConflictSchedule) {
      if (!conflictCheck) {
        try {
          const result = await schedulesApi.checkConflict({
            channel: editForm.channel,
            time_slot: editForm.time_slot,
            schedule_date: editForm.schedule_date,
            exclude_id: scheduleId,
          });
          setConflictCheck(result);
          if (result.hasConflict && !hasNote) {
            alert('目标时段仍存在冲突，请调整时段或填写协调说明。');
            return;
          }
        } catch (e) {
          alert('冲突检测失败，请重试。');
          return;
        }
      } else if (conflictCheck.hasConflict && !hasNote) {
        alert('目标时段仍存在冲突，请调整时段或填写协调说明。');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await schedulesApi.update(scheduleId, editForm);
      if (isConflictSchedule) {
        if (res.newStatus === 'scheduled' && !fieldChanged) {
          alert('原位已无冲突，状态已自动恢复为已排期。');
        } else if (res.stillConflicting) {
          alert('目标时段仍存在冲突，冲突状态未解除。请调整时段或填写协调说明。');
        }
      }
      setEditingSchedule(null);
      setEditForm({});
      setConflictCheck(null);
      loadCalendar();
    } catch (e) {
      alert('保存失败：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBatchResolve = async (resolveData) => {
    setSaving(true);
    try {
      await schedulesApi.batchResolve(resolveData);
      setEditingSchedule(null);
      setEditForm({});
      setConflictCheck(null);
      loadCalendar();
    } catch (e) {
      alert('解决冲突失败：' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderScheduleItem = (item) => {
    const isEditing = editingSchedule === item.id;

    if (isEditing) {
      return (
        <div className="p-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-xs space-y-2">
          <p className="font-semibold text-blue-800 truncate">{item.client_name}</p>
          <p className="text-blue-600 opacity-75 truncate">{item.order_no}</p>

          <div className="space-y-1.5">
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">频道</label>
              <select
                value={editForm.channel}
                onChange={e => { setEditForm({ ...editForm, channel: e.target.value }); setConflictCheck(null); }}
                className="w-full p-1 border border-gray-300 rounded text-xs"
              >
                {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">日期</label>
              <input
                type="date"
                value={editForm.schedule_date}
                onChange={e => { setEditForm({ ...editForm, schedule_date: e.target.value }); setConflictCheck(null); }}
                className="w-full p-1 border border-gray-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">时段</label>
              <select
                value={editForm.time_slot}
                onChange={e => { setEditForm({ ...editForm, time_slot: e.target.value }); setConflictCheck(null); }}
                className="w-full p-1 border border-gray-300 rounded text-xs"
              >
                {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">版位</label>
              <select
                value={editForm.position}
                onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                className="w-full p-1 border border-gray-300 rounded text-xs"
              >
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {item.status === 'conflict' && (
            <div>
              <label className="text-xs text-gray-600 block mb-0.5">冲突解决备注</label>
              <input
                type="text"
                value={editForm.conflict_note}
                onChange={e => setEditForm({ ...editForm, conflict_note: e.target.value })}
                className="w-full p-1 border border-gray-300 rounded text-xs"
                placeholder="填写调整说明..."
              />
            </div>
          )}

          {conflictCheck && conflictCheck.hasConflict && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <p className="font-medium">⚠️ 存在冲突</p>
              {conflictCheck.conflicts.map(c => (
                <p key={c.id} className="mt-1">{c.order_no} · {c.client_name}</p>
              ))}
            </div>
          )}

          {conflictCheck && !conflictCheck.hasConflict && (
            <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
              ✅ 无冲突
            </div>
          )}

          <div className="flex gap-1 pt-1">
            <button
              onClick={handleCheckConflict}
              disabled={checkingConflict}
              className="flex-1 p-1.5 bg-amber-500 text-white rounded text-xs hover:bg-amber-600 disabled:opacity-50"
            >
              {checkingConflict ? '检测中...' : '检测冲突'}
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handleSaveSchedule(item.id, item)}
              disabled={saving || (conflictCheck && conflictCheck.hasConflict)}
              className="flex-1 p-1.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Save size={10} /> {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={cancelEditing}
              className="flex-1 p-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 flex items-center justify-center gap-1"
            >
              <X size={10} /> 取消
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        className={`p-2 rounded-lg text-xs transition-all group relative ${
          item.status === 'conflict'
            ? 'bg-red-100 border border-red-200 text-red-700'
            : item.status === 'aired'
            ? 'bg-emerald-100 border border-emerald-200 text-emerald-700'
            : 'bg-primary-50 border border-primary-200 text-primary-700'
        }`}
      >
        <div
          onClick={() => navigate(`/orders/${item.order_id}`)}
          className="cursor-pointer"
        >
          <p className="font-medium truncate">{item.client_name}</p>
          <p className="opacity-75 truncate mt-0.5">{item.order_no}</p>
          {item.status === 'conflict' && (
            <p className="flex items-center gap-1 mt-1 text-red-500">
              <AlertTriangle size={10} /> 冲突
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); startEditing(item); }}
          className="absolute top-1 right-1 p-1 bg-white/80 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          title="编辑排期"
        >
          <Edit3 size={10} className="text-gray-600" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">排期管理</h2>
          <p className="text-gray-500 mt-1">频道广告排期日历视图，点击排期可编辑</p>
        </div>
        <div className="flex items-center gap-3">
          {conflictSchedules.length > 0 && (
            <button
              onClick={() => {
                const first = conflictSchedules[0];
                if (first) startEditing(first);
              }}
              className="btn-danger text-xs px-3 py-1.5"
            >
              <AlertTriangle size={14} /> {conflictSchedules.length} 个冲突待解决
            </button>
          )}
        </div>
      </div>

      {conflictSchedules.length > 0 && (
        <div className="card p-4 border-red-200 bg-red-50/50">
          <h3 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> 排期冲突列表
          </h3>
          <div className="space-y-2">
            {conflictSchedules.map(s => (
              <ConflictItem
                key={s.id}
                schedule={s}
                onEdit={() => startEditing(s)}
                onResolve={handleBatchResolve}
                saving={saving}
              />
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setWeekOffset(0)} className="btn-secondary text-xs">
              本周
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <ChevronRight size={20} />
            </button>
            <span className="text-sm font-medium text-gray-700 ml-2">
              {formatDate(weekDays[0])} — {formatDate(weekDays[6])}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              表格视图
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              时间线
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : viewMode === 'grid' ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 sticky left-0 bg-gray-50 z-10 min-w-[100px]">
                    频道 / 时段
                  </th>
                  {weekDays.map(day => {
                    const isToday = day === new Date().toISOString().split('T')[0];
                    return (
                      <th key={day} className={`text-center px-3 py-3 text-xs font-medium min-w-[140px] ${isToday ? 'bg-primary-50 text-primary-700' : 'text-gray-500'}`}>
                        <div>{formatDate(day)}</div>
                        <div className="text-xs opacity-75">周{formatWeekday(day)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {channels.map(ch => (
                  <>
                    <tr key={`header-${ch}`} className="bg-gray-50/50">
                      <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-gray-600 sticky left-0 bg-gray-50/50 z-10">
                        {ch}
                      </td>
                    </tr>
                    {TIME_SLOTS.filter(slot => {
                      return weekDays.some(day => (calendarData[day] || []).some(s => s.channel === ch && s.time_slot === slot && s.status !== 'cancelled'));
                    }).map(slot => (
                      <tr key={`${ch}-${slot}`} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-xs text-gray-500 font-medium sticky left-0 bg-white z-10 border-r border-gray-100">
                          {slot}
                        </td>
                        {weekDays.map(day => {
                          const items = (calendarData[day] || []).filter(s => s.channel === ch && s.time_slot === slot && s.status !== 'cancelled');
                          return (
                            <td key={`${day}-${ch}-${slot}`} className="px-2 py-1.5">
                              {items.map(item => renderScheduleItem(item))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {weekDays.map(day => {
            const items = calendarData[day] || [];
            const activeItems = items.filter(s => s.status !== 'cancelled');
            if (activeItems.length === 0) return null;
            const isToday = day === new Date().toISOString().split('T')[0];

            return (
              <div key={day} className={`card p-5 ${isToday ? 'ring-2 ring-primary-200' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={16} className="text-gray-400" />
                  <h3 className={`text-sm font-semibold ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                    {formatDate(day)} 周{formatWeekday(day)} {isToday && '（今天）'}
                  </h3>
                  <span className="badge bg-gray-100 text-gray-600">{activeItems.length} 条排期</span>
                </div>
                <div className="space-y-2">
                  {activeItems.sort((a, b) => a.time_slot.localeCompare(b.time_slot)).map(item => {
                    const isEditing = editingSchedule === item.id;
                    if (isEditing) {
                      return (
                        <div key={item.id} className="p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                          <p className="text-sm font-semibold text-blue-800 mb-2">{item.client_name} — {item.file_name}</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="text-xs text-gray-600 block mb-0.5">频道</label>
                              <select value={editForm.channel} onChange={e => { setEditForm({ ...editForm, channel: e.target.value }); setConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs">
                                {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-0.5">时段</label>
                              <select value={editForm.time_slot} onChange={e => { setEditForm({ ...editForm, time_slot: e.target.value }); setConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs">
                                {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-0.5">版位</label>
                              <select value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} className="w-full p-1.5 border border-gray-300 rounded text-xs">
                                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-0.5">日期</label>
                              <input type="date" value={editForm.schedule_date} onChange={e => { setEditForm({ ...editForm, schedule_date: e.target.value }); setConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs" />
                            </div>
                          </div>

                          {item.status === 'conflict' && (
                            <div className="mt-2">
                              <label className="text-xs text-gray-600 block mb-0.5">冲突解决备注</label>
                              <input type="text" value={editForm.conflict_note} onChange={e => setEditForm({ ...editForm, conflict_note: e.target.value })} className="w-full p-1.5 border border-gray-300 rounded text-xs" placeholder="填写调整说明..." />
                            </div>
                          )}

                          {conflictCheck && conflictCheck.hasConflict && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                              <p className="font-medium">⚠️ 新时段存在冲突</p>
                              {conflictCheck.conflicts.map(c => (
                                <p key={c.id}>{c.order_no} · {c.client_name}</p>
                              ))}
                            </div>
                          )}
                          {conflictCheck && !conflictCheck.hasConflict && (
                            <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
                              ✅ 新时段无冲突
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            <button onClick={handleCheckConflict} disabled={checkingConflict} className="btn-warning text-xs px-3 py-1.5">
                              {checkingConflict ? '检测中...' : '检测冲突'}
                            </button>
                            <button onClick={() => handleSaveSchedule(item.id, item)} disabled={saving || (conflictCheck && conflictCheck.hasConflict)} className="btn-success text-xs px-3 py-1.5">
                              <Save size={12} /> {saving ? '保存中...' : '保存'}
                            </button>
                            <button onClick={cancelEditing} className="btn-secondary text-xs px-3 py-1.5">取消</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/orders/${item.order_id}`)}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow group ${
                          item.status === 'conflict' ? 'bg-red-50' :
                          item.status === 'aired' ? 'bg-emerald-50' : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-bold text-primary-600 min-w-[50px]">{item.time_slot}</span>
                        <span className="text-xs text-gray-500 min-w-[80px]">{item.channel}</span>
                        <span className="text-sm text-gray-900 flex-1">{item.client_name} — {item.file_name}</span>
                        <span className="text-xs text-gray-400">{item.position}</span>
                        <StatusBadge status={item.status} type="schedule" />
                        {item.status === 'conflict' && <span className="text-xs text-red-600">{item.conflict_note}</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(item); }}
                          className="p-1.5 bg-white border border-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-50"
                          title="编辑排期"
                        >
                          <Edit3 size={12} className="text-gray-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConflictItem({ schedule, onEdit, onResolve, saving }) {
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({
    channel: schedule.channel,
    time_slot: schedule.time_slot,
    schedule_date: schedule.schedule_date,
    position: schedule.position,
    conflict_note: '',
  });
  const [localConflictCheck, setLocalConflictCheck] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const handleCheckConflict = async () => {
    setCheckingConflict(true);
    try {
      const result = await schedulesApi.checkConflict({
        channel: form.channel,
        time_slot: form.time_slot,
        schedule_date: form.schedule_date,
        exclude_id: schedule.id,
      });
      setLocalConflictCheck(result);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleQuickResolve = async (strategy) => {
    const hasNote = form.conflict_note && form.conflict_note.trim().length > 0;

    if (strategy === 'move') {
      if (!localConflictCheck) {
        alert('请先点击「检测冲突」验证目标时段是否可用。');
        return;
      } else if (localConflictCheck.hasConflict) {
        alert('目标时段仍存在冲突，请调整时段或频道后再保存。');
        return;
      }
    } else if (strategy === '保留原位') {
      if (localConflictCheck && localConflictCheck.hasConflict && !hasNote) {
        alert('原位仍存在冲突，请填写协调说明后再确认保存。');
        return;
      }
    }

    const updates = [{ id: schedule.id, conflict_note: hasNote ? form.conflict_note.trim() : '' }];
    if (strategy === 'move') {
      updates[0] = { ...updates[0], ...form };
    }
    await onResolve({ updates });
  };

  const handleEnterKeepMode = async () => {
    setMode('keep');
    try {
      const result = await schedulesApi.checkConflict({
        channel: form.channel,
        time_slot: form.time_slot,
        schedule_date: form.schedule_date,
        exclude_id: schedule.id,
      });
      setLocalConflictCheck(result);
    } catch (e) {
      console.error(e);
    }
  };

  if (mode === 'move') {
    return (
      <div className="p-3 bg-white border-2 border-blue-300 rounded-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">
          调整排期 — {schedule.client_name} ({schedule.order_no})
        </p>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div>
            <label className="text-xs text-gray-600 block mb-0.5">频道</label>
            <select value={form.channel} onChange={e => { setForm({ ...form, channel: e.target.value }); setLocalConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs">
              {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-0.5">时段</label>
            <select value={form.time_slot} onChange={e => { setForm({ ...form, time_slot: e.target.value }); setLocalConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs">
              {TIME_SLOTS.map(ts => <option key={ts} value={ts}>{ts}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-0.5">日期</label>
            <input type="date" value={form.schedule_date} onChange={e => { setForm({ ...form, schedule_date: e.target.value }); setLocalConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs" />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-0.5">版位</label>
            <select value={form.position} onChange={e => { setForm({ ...form, position: e.target.value }); setLocalConflictCheck(null); }} className="w-full p-1.5 border border-gray-300 rounded text-xs">
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-2">
          <label className="text-xs text-gray-600 block mb-0.5">调整说明 *</label>
          <input type="text" value={form.conflict_note} onChange={e => setForm({ ...form, conflict_note: e.target.value })} className="w-full p-1.5 border border-gray-300 rounded text-xs" placeholder="请填写调整说明..." />
        </div>

        {localConflictCheck && localConflictCheck.hasConflict && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <p className="font-medium">⚠️ 新时段存在冲突</p>
            {localConflictCheck.conflicts.map(c => (
              <p key={c.id}>{c.order_no} · {c.client_name}</p>
            ))}
          </div>
        )}
        {localConflictCheck && !localConflictCheck.hasConflict && (
          <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
            ✅ 新时段无冲突
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={handleCheckConflict} disabled={checkingConflict} className="btn-warning text-xs px-3 py-1.5">
            {checkingConflict ? '检测中...' : '检测冲突'}
          </button>
          <button onClick={() => handleQuickResolve('move')} disabled={saving || (localConflictCheck && localConflictCheck.hasConflict)} className="btn-success text-xs px-3 py-1.5">
            <Save size={12} /> {saving ? '保存中...' : '保存调整'}
          </button>
          <button onClick={() => { setMode(null); setLocalConflictCheck(null); setForm({ ...form, conflict_note: '' }); }} className="btn-secondary text-xs px-3 py-1.5">取消</button>
        </div>
      </div>
    );
  }

  if (mode === 'keep') {
    const slotAlreadyClear = localConflictCheck && !localConflictCheck.hasConflict;
    const noteRequired = !slotAlreadyClear;

    return (
      <div className="p-3 bg-white border-2 border-amber-300 rounded-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">
          保留原位确认 — {schedule.client_name} ({schedule.order_no})
        </p>

        {localConflictCheck && slotAlreadyClear && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
            ✅ 原位已无冲突，可直接确认恢复为已排期，无需填写说明。
          </div>
        )}
        {localConflictCheck && !slotAlreadyClear && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            ⚠️ 原位仍存在冲突，请填写协调说明后确认保留，或改用「调整时段」。
          </div>
        )}
        {!localConflictCheck && (
          <div className="mb-3 text-xs text-gray-400">正在检测原位冲突状态...</div>
        )}

        <div className="mb-3">
          <label className="text-xs text-gray-600 block mb-0.5">
            协调说明{noteRequired ? ' *' : '（选填）'}
          </label>
          <input
            type="text"
            value={form.conflict_note}
            onChange={e => setForm({ ...form, conflict_note: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder={noteRequired ? '请填写协调说明（如：已与客户协商确认保留）' : '可补充说明（非必填）'}
            autoFocus
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickResolve('保留原位')}
            disabled={saving || (noteRequired && !form.conflict_note.trim())}
            className="btn-success text-xs px-3 py-1.5"
          >
            <Check size={12} /> {slotAlreadyClear ? '确认恢复' : '确认保留'}
          </button>
          <button onClick={() => { setMode(null); setForm({ ...form, conflict_note: '' }); setLocalConflictCheck(null); }} className="btn-secondary text-xs px-3 py-1.5">取消</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle size={16} className="text-red-500" />
        <div>
          <p className="text-sm font-medium text-gray-900">{schedule.client_name} ({schedule.order_no})</p>
          <p className="text-xs text-gray-500">{schedule.channel} · {schedule.schedule_date} {schedule.time_slot} · {schedule.position}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setMode('move')} className="btn-primary text-xs px-3 py-1.5">
          <Edit3 size={12} /> 调整时段
        </button>
        <button onClick={handleEnterKeepMode} className="btn-success text-xs px-3 py-1.5">
          <Check size={12} /> 保留原位
        </button>
      </div>
    </div>
  );
}
