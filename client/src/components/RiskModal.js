import React, { useState, useEffect } from 'react';
import { riskAPI, logAPI, scheduleAPI, reservationAPI, maintenanceAPI } from '../api';

const statusLabels = {
  open: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
};

const severityLabels = {
  high: '高危',
  medium: '中危',
  low: '低危'
};

const typeLabels = {
  member_mismatch: '会员级别不匹配',
  equipment: '装备问题',
  conversion: '转化问题',
  safety: '安全隐患',
  understaffed: '人员不足',
  other: '其他'
};

const roleLabels = {
  frontdesk: '前台',
  belayer: '保护员',
  routesetter: '线路管理员',
  manager: '经理'
};

const suggestionMap = {
  member_mismatch: '1. 立即上前劝阻会员离开高难度线路区域\n2. 引导至体验专线或热身线\n3. 了解其攀岩目标，推荐合适课程',
  equipment: '1. 与值班保护员确认最后使用地点\n2. 检查相关线路是否有遗留\n3. 查看监控确认是否有私自带走',
  conversion: '1. 查看体验课学员回访记录\n2. 与保护员沟通带教问题\n3. 分析定价或权益竞争力',
  understaffed: '1. 尽快审核待确认排班\n2. 若审核不通过，联系备勤人员\n3. 确认其他班次是否可调班',
  safety: '1. 立即完成线路维护工作\n2. 完成后标记维护完成\n3. 确认无风险后重新开放'
};

const ownerRoleMap = {
  member_mismatch: 'belayer',
  equipment: 'frontdesk',
  conversion: 'manager',
  understaffed: 'manager',
  safety: 'routesetter'
};

function RiskModal({ riskId, currentRole, currentUser, onClose, onUpdated }) {
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState('');
  const [sourceData, setSourceData] = useState(null);

  useEffect(() => {
    loadRisk();
  }, [riskId]);

  const loadRisk = async () => {
    try {
      setLoading(true);
      const data = await riskAPI.getAll();
      const item = data.find(r => r.id === riskId);
      setRisk(item);
      
      if (item) {
        if (item.source_schedule_id) {
          const scheds = await scheduleAPI.getAll();
          setSourceData({ type: 'schedule', data: scheds.find(s => s.id === item.source_schedule_id) });
        } else if (item.source_reservation_id) {
          const resvs = await reservationAPI.getAll();
          setSourceData({ type: 'reservation', data: resvs.find(r => r.id === item.source_reservation_id) });
        } else if (item.source_maintenance_id) {
          const maints = await maintenanceAPI.getAll();
          setSourceData({ type: 'maintenance', data: maints.find(m => m.id === item.source_maintenance_id) });
        }
      }
    } catch (e) {
      console.error('加载风险失败', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!risk) return;
    try {
      const updateData = { 
        status: newStatus,
        handled_by: currentUser?.id
      };
      if (newStatus === 'processing' && !risk.current_owner) {
        updateData.current_owner = currentUser?.id;
        updateData.owner_role = currentRole;
      }
      if (resolution.trim()) {
        updateData.resolution = resolution;
      }
      await riskAPI.updateStatus(riskId, updateData);
      await logAPI.create({
        user_id: currentUser?.id,
        action: `风险状态变更: ${statusLabels[risk.status]} → ${statusLabels[newStatus]}`,
        entity_type: 'risk',
        entity_id: riskId,
        details: resolution
      });
      onUpdated?.();
      onClose();
    } catch (e) {
      console.error('更新失败', e);
    }
  };

  const canProcess = currentRole === 'manager' || 
    (currentRole === 'belayer' && risk?.type === 'member_mismatch') ||
    (currentRole === 'frontdesk' && risk?.type === 'equipment') ||
    (currentRole === 'routesetter' && risk?.type === 'safety') ||
    (currentRole === risk?.owner_role);

  const displayOwner = risk?.owner_name || (risk?.current_owner ? '待查询' : '待分配');
  const suggestion = risk?.suggestion || suggestionMap[risk?.type] || '请根据实际情况处理';

  if (loading || !risk) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>风险详情</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>标题</span>
              <span>{risk.title}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>类型</span>
              <span>{typeLabels[risk.type] || risk.type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>严重程度</span>
              <span className={`badge badge-${risk.severity === 'high' ? 'red' : risk.severity === 'medium' ? 'yellow' : 'blue'}`}>
                {severityLabels[risk.severity]}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>状态</span>
              <span className={`task-status status-${risk.status}`}>
                {statusLabels[risk.status]}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>当前责任人</span>
              <span>
                <span className="badge badge-blue">{displayOwner}</span>
                <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>
                  ({risk.owner_role ? roleLabels[risk.owner_role] : '待分配角色'})
                </span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>上报人</span>
              <span>{risk.reporter_name || '系统'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 500 }}>上报时间</span>
              <span>{new Date(risk.created_at).toLocaleString('zh-CN')}</span>
            </div>
            {risk.handler_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>处理人</span>
                <span>{risk.handler_name}</span>
              </div>
            )}

            <div style={{ marginTop: 12, padding: 12, background: '#f8f9fa', borderRadius: 6 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>详细描述</div>
              <div style={{ fontSize: 14 }}>{risk.description || '无'}</div>
            </div>

            {sourceData && sourceData.data && (
              <div style={{ marginTop: 12, padding: 12, background: '#e8f4fd', borderRadius: 6 }}>
                <div style={{ fontWeight: 500, marginBottom: 8, color: '#0c5460' }}>
                  📎 来源记录：{sourceData.type === 'schedule' ? '关联排班' : sourceData.type === 'reservation' ? '关联预约' : '关联维护'}
                </div>
                {sourceData.type === 'schedule' && (
                  <div style={{ fontSize: 14 }}>
                    <div>保护员：{sourceData.data.staff_name}</div>
                    <div>日期：{sourceData.data.date}</div>
                    <div>班次：{sourceData.data.shift === 'morning' ? '早班' : sourceData.data.shift === 'afternoon' ? '午班' : '晚班'}</div>
                    <div>状态：<span className={`task-status status-${sourceData.data.status}`}>{sourceData.data.status}</span></div>
                  </div>
                )}
                {sourceData.type === 'reservation' && (
                  <div style={{ fontSize: 14 }}>
                    <div>会员：{sourceData.data.member_name}</div>
                    <div>日期：{sourceData.data.date}</div>
                    <div>时段：{sourceData.data.time_slot}</div>
                    <div>类型：{sourceData.data.type === 'trial' ? '体验课' : sourceData.data.type === 'course' ? '课程' : '自由攀'}</div>
                  </div>
                )}
                {sourceData.type === 'maintenance' && (
                  <div style={{ fontSize: 14 }}>
                    <div>线路：{sourceData.data.route_name} ({sourceData.data.grade})</div>
                    <div>类型：{sourceData.data.type === 'rebolt' ? '换点' : sourceData.data.type === 'check' ? '检查' : '维护'}</div>
                    <div>计划日期：{sourceData.data.scheduled_date}</div>
                    <div>维护人：{sourceData.data.maintainer_name || '待分配'}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 12, padding: 12, background: '#fff3cd', borderRadius: 6 }}>
              <div style={{ fontWeight: 500, marginBottom: 4, color: '#856404' }}>💡 处理建议</div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-line' }}>{suggestion}</div>
            </div>

            <div style={{ marginTop: 12, padding: 12, background: '#f0f7ff', borderRadius: 6 }}>
              <div style={{ fontWeight: 500, marginBottom: 8, color: '#004085' }}>🔗 责任链流转</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 13 }}>
                <span className="badge badge-yellow">上报人: {risk.reporter_name || '系统'}</span>
                <span>→</span>
                <span className="badge badge-blue">责任人: {displayOwner}</span>
                <span>→</span>
                <span className={risk.handler_name ? 'badge badge-green' : 'badge'} style={risk.handler_name ? {} : { background: '#e2e3e5', color: '#383d41' }}>
                  {risk.handler_name ? `已处理: ${risk.handler_name}` : '待处理'}
                </span>
              </div>
            </div>

            {risk.resolution && (
              <div style={{ marginTop: 12, padding: 12, background: '#d4edda', borderRadius: 6 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>处理结果</div>
                <div style={{ fontSize: 14 }}>{risk.resolution}</div>
              </div>
            )}
          </div>

          {(risk.status === 'open' || risk.status === 'processing') && canProcess && (
            <div className="form-group">
              <label>处理备注</label>
              <textarea 
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="填写处理措施和结果"
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>关闭</button>
          
          {canProcess && risk.status === 'open' && (
            <button className="btn btn-primary" onClick={() => handleStatusChange('processing')}>
              接手处理
            </button>
          )}

          {canProcess && risk.status === 'processing' && (
            <button 
              className="btn btn-success" 
              onClick={() => {
                if (!resolution.trim()) {
                  alert('请填写处理结果');
                  return;
                }
                handleStatusChange('resolved');
              }}
            >
              标记已解决
            </button>
          )}

          {risk.status === 'resolved' && (
            <button className="btn btn-secondary" onClick={() => handleStatusChange('closed')}>
              关闭
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RiskModal;
