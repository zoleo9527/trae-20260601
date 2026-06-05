import React, { useState, useEffect } from 'react';
import { scheduleAPI, userAPI, logAPI } from '../api';

const statusLabels = {
  draft: '草稿',
  pending_review: '待审核',
  scheduled: '已排班',
  checked_in: '已签到',
  completed: '已完成',
  rejected: '已退回',
  cancelled: '已取消'
};

const shiftLabels = {
  morning: '早班 (09:00-15:00)',
  afternoon: '午班 (14:00-20:00)',
  evening: '晚班 (18:00-22:00)'
};

function ScheduleModal({ scheduleId, currentRole, currentUser, onClose, onUpdated }) {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadSchedule();
  }, [scheduleId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const data = await scheduleAPI.getAll();
      const item = data.find(s => s.id === scheduleId);
      setSchedule(item);
      setReviewNotes(item?.review_notes || '');
    } catch (e) {
      console.error('加载排班失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus, notes = '') => {
    if (!schedule) return;
    try {
      const updateData = { status: newStatus };
      if (currentRole === 'manager' || currentRole === 'frontdesk') {
        updateData.reviewed_by = currentUser?.id;
        if (notes !== undefined) updateData.review_notes = notes;
      }
      if (newStatus === 'checked_in') {
        updateData.check_in_time = new Date().toISOString();
      }
      if (newStatus === 'completed') {
        updateData.check_out_time = new Date().toISOString();
      }
      await scheduleAPI.updateStatus(scheduleId, updateData);
      await logAPI.create({
        user_id: currentUser?.id,
        action: `排班状态变更: ${statusLabels[schedule.status]} → ${statusLabels[newStatus]}`,
        entity_type: 'schedule',
        entity_id: scheduleId,
        details: notes
      });
      onUpdated?.();
      onClose();
    } catch (e) {
      console.error('更新失败', e);
    }
  };

  if (loading || !schedule) return null;

  const canReview = currentRole === 'manager' || currentRole === 'frontdesk';
  const canCheckIn = currentRole === 'belayer' || currentRole === 'manager';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>排班详情</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>保护员</span>
              <span>{schedule.staff_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>日期</span>
              <span>{schedule.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>班次</span>
              <span>{shiftLabels[schedule.shift] || schedule.shift}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>状态</span>
              <span className={`task-status status-${schedule.status}`}>
                {statusLabels[schedule.status]}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>排班人</span>
              <span>{schedule.assigned_by_name || '-'}</span>
            </div>
            {schedule.reviewed_by_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>审核人</span>
                <span>{schedule.reviewed_by_name}</span>
              </div>
            )}
            {schedule.review_notes && (
              <div style={{ marginTop: 12, padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>审核备注</div>
                <div style={{ fontSize: 14 }}>{schedule.review_notes}</div>
              </div>
            )}
          </div>

          {schedule.status === 'pending_review' && canReview && (
            <div className="form-group">
              <label>审核意见</label>
              <textarea 
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="填写审核意见（退回时必填）"
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
          
          {schedule.status === 'draft' && canReview && (
            <button className="btn btn-primary" onClick={() => handleStatusChange('pending_review')}>
              提交审核
            </button>
          )}
          
          {schedule.status === 'pending_review' && canReview && (
            <>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (!reviewNotes.trim()) {
                    alert('请填写退回原因');
                    return;
                  }
                  handleStatusChange('rejected', reviewNotes);
                }}
              >
                退回
              </button>
              <button className="btn btn-success" onClick={() => handleStatusChange('scheduled', reviewNotes)}>
                审核通过
              </button>
            </>
          )}

          {schedule.status === 'scheduled' && canCheckIn && (
            <button className="btn btn-success" onClick={() => handleStatusChange('checked_in')}>
              签到上岗
            </button>
          )}

          {schedule.status === 'checked_in' && canCheckIn && (
            <button className="btn btn-primary" onClick={() => handleStatusChange('completed')}>
              签退完成
            </button>
          )}

          {schedule.status === 'rejected' && canReview && (
            <button className="btn btn-primary" onClick={() => handleStatusChange('pending_review')}>
              重新提交
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScheduleModal;
