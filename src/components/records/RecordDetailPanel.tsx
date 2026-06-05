import { useState } from 'react';
import { 
  X, Check, Clock, User, MapPin, Calendar, 
  MessageSquare, History, AlertTriangle, ArrowRight,
  ChevronDown, ChevronUp, Settings
} from 'lucide-react';
import { useStore } from '@/store';
import { StatusBadge } from './StatusBadge';
import { 
  roleNames, rejectReasonNames, responsibilityNames,
  type RejectReason, type ResponsibilityFlag
} from '@/types';
import { formatDateTime } from '@/utils/formatters';

export function RecordDetailPanel() {
  const { 
    activeRecordId, records, showDetailPanel, setShowDetailPanel,
    currentRole, confirmRecord, rejectRecord, addReceptionRemark,
    escalateToManager, resolveDispute, resubmitRecord, setActiveRecord,
    getFilteredRecords, adjustSchedule, coaches, venues
  } = useStore();
  
  const [rejectReason, setRejectReason] = useState<RejectReason>('other');
  const [rejectRemark, setRejectRemark] = useState('');
  const [remark, setRemark] = useState('');
  const [responsibility, setResponsibility] = useState<ResponsibilityFlag>('none');
  const [showHistory, setShowHistory] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showScheduleEdit, setShowScheduleEdit] = useState(false);
  const [editCoachId, setEditCoachId] = useState('');
  const [editVenueId, setEditVenueId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  const record = records.find((r) => r.id === activeRecordId);
  const filteredRecords = getFilteredRecords();
  const currentIndex = filteredRecords.findIndex((r) => r.id === activeRecordId);
  const hasNext = currentIndex < filteredRecords.length - 1;
  
  if (!showDetailPanel || !record) return null;
  
  const handleConfirm = () => {
    confirmRecord(record.id, remark || undefined);
    handleNext();
  };
  
  const handleReject = () => {
    if (!rejectRemark.trim()) return;
    rejectRecord(record.id, rejectReason, rejectRemark);
    setShowRejectForm(false);
    setRejectRemark('');
    handleNext();
  };
  
  const handleAddRemark = () => {
    if (!remark.trim()) return;
    addReceptionRemark(record.id, remark);
    setRemark('');
  };
  
  const handleEscalate = () => {
    escalateToManager(record.id, remark || '');
    setRemark('');
    handleNext();
  };
  
  const handleResolve = () => {
    resolveDispute(record.id, responsibility, remark || '');
    setRemark('');
    handleNext();
  };
  
  const handleResubmit = () => {
    resubmitRecord(record.id);
    handleNext();
  };
  
  const handleNext = () => {
    if (hasNext) {
      setActiveRecord(filteredRecords[currentIndex + 1].id);
    } else {
      setShowDetailPanel(false);
      setActiveRecord(null);
    }
  };
  
  const handleAdjustSchedule = () => {
    if (!record) return;
    const updates: any = {};
    if (editCoachId) {
      const coach = coaches.find(c => c.id === editCoachId);
      updates.coachId = editCoachId;
      updates.coachName = coach?.name || record.coachName;
    }
    if (editVenueId) {
      const venue = venues.find(v => v.id === editVenueId);
      updates.venueId = editVenueId;
      updates.venueName = venue?.name || record.venueName;
    }
    if (editDate) updates.scheduledDate = editDate;
    if (editStartTime) updates.startTime = editStartTime;
    if (editEndTime) updates.endTime = editEndTime;
    
    adjustSchedule(record.id, updates);
    setShowScheduleEdit(false);
    handleNext();
  };
  
  const handleOpenScheduleEdit = () => {
    if (!record) return;
    setEditCoachId(record.coachId);
    setEditVenueId(record.venueId);
    setEditDate(record.scheduledDate);
    setEditStartTime(record.startTime);
    setEditEndTime(record.endTime);
    setShowScheduleEdit(true);
  };
  
  const handleClose = () => {
    setShowDetailPanel(false);
    setActiveRecord(null);
    setShowRejectForm(false);
    setShowScheduleEdit(false);
    setRemark('');
    setRejectRemark('');
  };
  
  const canConfirm = currentRole === 'coach' && record.status === 'pending_coach_confirm';
  const canReject = currentRole === 'coach' && record.status === 'pending_coach_confirm';
  const canAddRemark = currentRole === 'reception' && record.status === 'pending_reception_handle';
  const canResubmit = currentRole === 'reception' && record.status === 'pending_reception_handle';
  const canEscalate = currentRole === 'reception' && record.status === 'pending_reception_handle';
  const canResolve = currentRole === 'manager' && (record.status === 'pending_manager_audit' || record.status === 'disputed');
  
  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col z-50 animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100">记录详情</h3>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={record.status} />
            {record.hasResponsibilityRisk && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <AlertTriangle className="w-3 h-3" />
                责任待澄清
              </span>
            )}
            {record.isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                <Clock className="w-3 h-3" />
                处理超时
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="text-xs text-slate-500">学员</div>
              <div className="text-slate-200 font-medium">{record.studentName}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500">课程类型</div>
              <div className="text-slate-200">{record.courseType}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" />教练
              </div>
              <div className="text-slate-200">{record.coachName}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />场地
              </div>
              <div className="text-slate-200">{record.venueName}</div>
            </div>
            <div className="space-y-1 col-span-2">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />时间
              </div>
              <div className="text-slate-200">
                {record.scheduledDate} {record.startTime} - {record.endTime}
                <span className="text-slate-500 ml-2">({record.duration}分钟)</span>
              </div>
            </div>
          </div>
          
          {!showScheduleEdit && currentRole === 'reception' && record.status === 'pending_reception_handle' && (
            <button
              onClick={handleOpenScheduleEdit}
              className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm rounded transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              调整排班并重提（教练/时间/场地）
            </button>
          )}
          
          {showScheduleEdit && (
            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 space-y-3">
              <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                调整排班
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">教练</label>
                  <select
                    value={editCoachId}
                    onChange={(e) => setEditCoachId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">场地</label>
                  <select
                    value={editVenueId}
                    onChange={(e) => setEditVenueId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">日期</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">开始时间</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-1">结束时间</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdjustSchedule}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
                >
                  确认调整并重提
                </button>
                <button
                  onClick={() => setShowScheduleEdit(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
          
          {record.rejectReason && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-medium text-sm">
                <X className="w-4 h-4" />
                退回信息
              </div>
              <div className="text-sm space-y-1">
                <div className="text-slate-400">
                  原因：<span className="text-slate-200">{rejectReasonNames[record.rejectReason]}</span>
                </div>
                {record.rejectRemark && (
                  <div className="text-slate-400">
                    备注：<span className="text-slate-200">{record.rejectRemark}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {record.receptionRemark && (
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
              <div className="text-xs text-blue-400 font-medium">前台备注</div>
              <p className="text-sm text-slate-300">{record.receptionRemark}</p>
            </div>
          )}
          
          {record.coachRemark && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="text-xs text-amber-400 font-medium">教练备注</div>
              <p className="text-sm text-slate-300">{record.coachRemark}</p>
            </div>
          )}
          
          {record.responsibility !== 'none' && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-1">
              <div className="text-xs text-purple-400 font-medium">责任认定</div>
              <div className="text-sm text-slate-200">{responsibilityNames[record.responsibility]}</div>
              {record.responsibilityRemark && (
                <p className="text-sm text-slate-400">{record.responsibilityRemark}</p>
              )}
            </div>
          )}
          
          {showRejectForm && canReject && (
            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 space-y-3">
              <div className="text-sm font-medium text-slate-200">退回记录</div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">退回原因</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as RejectReason)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                >
                  {Object.entries(rejectReasonNames).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">详细说明</label>
                <textarea
                  value={rejectRemark}
                  onChange={(e) => setRejectRemark(e.target.value)}
                  placeholder="请输入详细说明..."
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500 resize-none h-20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={!rejectRemark.trim()}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
                >
                  确认退回
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}
          
          {(canAddRemark || canResolve || canEscalate || (canConfirm && !showRejectForm)) && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {canResolve ? '仲裁说明' : canAddRemark ? '补充备注' : '备注（可选）'}
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="输入备注..."
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 resize-none h-20"
                />
              </div>
              
              {canResolve && (
                <div>
                  <label className="text-xs text-slate-500 block mb-1">责任认定</label>
                  <select
                    value={responsibility}
                    onChange={(e) => setResponsibility(e.target.value as ResponsibilityFlag)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(responsibilityNames).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          
          <div
            className="border-t border-slate-700 pt-3"
          >
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors w-full"
            >
              <History className="w-4 h-4" />
              <span>操作历史 ({record.history.length})</span>
              {showHistory ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
            
            {showHistory && (
              <div className="mt-3 space-y-3">
                {record.history.map((item, index) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-slate-600'}`} />
                      {index < record.history.length - 1 && (
                        <div className="w-px flex-1 bg-slate-700 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-200 font-medium">{item.action}</span>
                        <span className="text-xs text-slate-500">
                          {roleNames[item.operator]} · {item.operatorName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatDateTime(item.timestamp)}
                      </div>
                      {item.remark && (
                        <p className="text-sm text-slate-400 mt-1">{item.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-700 space-y-2">
        <div className="flex gap-2">
          {canConfirm && !showRejectForm && (
            <>
              <button
                onClick={handleConfirm}
                className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认完成
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                退回
              </button>
            </>
          )}
          
          {canAddRemark && (
            <>
              <button
                onClick={handleAddRemark}
                disabled={!remark.trim()}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors"
              >
                保存备注
              </button>
              <button
                onClick={handleResubmit}
                className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium rounded transition-colors"
              >
                重提确认
              </button>
              <button
                onClick={handleEscalate}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium rounded transition-colors"
              >
                转仲裁
              </button>
            </>
          )}
          
          {canResolve && (
            <button
              onClick={handleResolve}
              className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded transition-colors"
            >
              完成仲裁
            </button>
          )}
          
          {!canConfirm && !canAddRemark && !canResolve && (
            <div className="text-sm text-slate-500 text-center py-2">
              当前角色无操作权限
            </div>
          )}
        </div>
        
        {hasNext && (
          <button
            onClick={handleNext}
            className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded transition-colors flex items-center justify-center gap-2"
          >
            处理下一条
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
