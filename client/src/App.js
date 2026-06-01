import React, { useState, useEffect } from 'react';

const App = () => {
  const [currentShift, setCurrentShift] = useState('morning');
  const [currentRole, setCurrentRole] = useState('headNurse');
  const [rooms, setRooms] = useState([]);
  const [summary, setSummary] = useState({});
  const [records, setRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [shiftContext, setShiftContext] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomDetail, setRoomDetail] = useState(null);
  const [newRecord, setNewRecord] = useState({ type: 'handover', title: '', description: '', operator: '当前用户' });

  const shiftNames = { morning: '早班', evening: '晚班', night: '夜班' };
  const roleNames = { headNurse: '护士长', nurse: '责任护士', customerService: '客服' };

  const recordTypeNames = {
    admission: '新入住',
    roomTransfer: '转房',
    jaundiceDelay: '黄疸延期',
    complaint: '投诉',
    breastEngorgement: '堵奶风险',
    nursing: '护理记录',
    babyCheck: '宝宝巡视',
    aupairChange: '阿姨换房',
    handover: '交接备注'
  };

  const riskTypeNames = {
    breastEngorgement: '堵奶风险',
    hypertension: '高血压',
    diabetes: '糖尿病',
    postpartumDepression: '产后抑郁'
  };

  useEffect(() => {
    fetchData();
  }, [currentShift]);

  const fetchData = async () => {
    try {
      const [roomsRes, summaryRes, recordsRes, tasksRes, contextRes] = await Promise.all([
        fetch('/api/rooms'),
        fetch(`/api/summary?shift=${currentShift}`),
        fetch(`/api/records?shift=${currentShift}`),
        fetch(`/api/tasks?shift=${currentShift}`),
        fetch(`/api/shift-context/${currentShift}`)
      ]);

      setRooms(await roomsRes.json());
      setSummary(await summaryRes.json());
      setRecords(await recordsRes.json());
      setTasks(await tasksRes.json());
      setShiftContext(await contextRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchRoomDetail = async (roomId) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();
      setRoomDetail(data);
      setSelectedRoom(roomId);
    } catch (error) {
      console.error('Error fetching room detail:', error);
    }
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getRecordTypeClass = (type) => {
    if (type === 'complaint') return 'complaint';
    if (type === 'breastEngorgement' || type === 'jaundiceDelay') return 'warning';
    if (type === 'handover') return 'handover';
    return '';
  };

  const handleCompleteTask = async (taskId) => {
    fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' })
    }).then(() => fetchData());
  };

  const handleAddRecord = async () => {
    if (!newRecord.title || !newRecord.description) return;

    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newRecord,
        roomId: selectedRoom,
        shift: currentShift
      })
    }).then(() => {
      fetchData();
      fetchRoomDetail(selectedRoom);
      setNewRecord({ type: 'handover', title: '', description: '', operator: '当前用户' });
    });
  };

  const getFilteredRooms = () => {
    if (currentRole === 'nurse') {
      const nurseRooms = ['101', '102', '103'];
      return rooms.filter(r => nurseRooms.includes(r.id));
    }
    if (currentRole === 'customerService') {
      return rooms.filter(r => r.records?.some(rec => rec.type === 'complaint'));
    }
    return rooms;
  };

  const getComplaintRecords = () => records.filter(r => r.type === 'complaint');

  const getRiskRooms = () => {
    return rooms.filter(r => r.hasRisk || r.baby?.jaundice);
  };

  const roomsByFloor = {};
  getFilteredRooms().forEach(room => {
    const floor = room.floor;
    if (!roomsByFloor[floor]) roomsByFloor[floor] = [];
    roomsByFloor[floor].push(room);
  });

  const currentRoomData = rooms.find(r => r.id === selectedRoom);

  return (
    <div className="app">
      <div className="header">
        <div className="header-top">
          <h1>月子中心护理交接系统</h1>
          <div className="role-selector">
            {Object.entries(roleNames).map(([key, name]) => (
              <button
                key={key}
                className={`role-btn ${currentRole === key ? 'active' : ''}`}
                onClick={() => setCurrentRole(key)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="shift-selector">
          {Object.entries(shiftNames).map(([key, name]) => (
            <button
              key={key}
              className={`shift-btn ${currentShift === key ? 'active' : ''}`}
              onClick={() => setCurrentShift(key)}
            >
              {name}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', opacity: 0.9, fontSize: '14px' }}>
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="main-content">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="label">在住房间</div>
            <div className="value">{summary.occupiedRooms}/{summary.totalRooms}</div>
          </div>
          <div className="summary-card risk">
            <div className="label">高危房间</div>
            <div className="value">{summary.highRiskRooms}</div>
          </div>
          <div className="summary-card warning">
            <div className="label">待办任务</div>
            <div className="value">{summary.pendingTasks}</div>
          </div>
          <div className="summary-card">
            <div className="label">黄疸宝宝</div>
            <div className="value">{summary.jaundiceBabies}</div>
          </div>
          {currentRole === 'customerService' && (
            <div className="summary-card warning">
              <div className="label">处理中投诉</div>
              <div className="value">{summary.complaints}</div>
            </div>
          )}
          <div className="summary-card">
            <div className="label">今日新入住</div>
            <div className="value">{summary.newAdmissions}</div>
          </div>
        </div>

        {shiftContext && shiftContext.previousHandoverNotes.length > 0 && (
          <div className="panel" style={{ borderLeft: '4px solid #9b59b6' }}>
            <div className="panel-title">
              📝 {shiftNames[shiftContext.previousShift]}交接备注
              <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '8px', color: '#888' }}>
                （接班时请重点关注）
              </span>
            </div>
            <div className="records-list">
              {shiftContext.previousHandoverNotes.map(note => (
                <div key={note.id} className="record-item handover">
                  <div className="record-header">
                    <span className="record-title">
                      [{note.roomId}] {note.title}
                    </span>
                    <span className="record-time">{formatTime(note.time)}</span>
                  </div>
                  <div className="record-desc">{note.description}</div>
                  <div className="record-operator">交班人: {note.operator}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shiftContext && shiftContext.processingComplaints.length > 0 && (
          <div className="panel" style={{ borderLeft: '4px solid #e67e22' }}>
            <div className="panel-title">
              ⚠️ 处理中投诉（跨班次）
              <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '8px', color: '#888' }}>
                （{shiftContext.processingComplaints.length}件未关闭）
              </span>
            </div>
            <div className="records-list">
              {shiftContext.processingComplaints.map(record => (
                <div key={record.id} className="record-item complaint">
                  <div className="record-header">
                    <span className="record-title">
                      [{record.roomId}] {record.title}
                      <span className="badge" style={{ background: '#fff3e0', color: '#e65100' }}>
                        {shiftNames[record.shift]}
                      </span>
                    </span>
                    <span className="record-time">{formatTime(record.time)}</span>
                  </div>
                  <div className="record-desc">{record.description}</div>
                  {record.compensation && (
                    <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '4px' }}>
                      🎁 补偿方案: {record.compensation}
                    </div>
                  )}
                  <div className="record-operator">处理人: {record.operator}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {shiftContext && shiftContext.activeAlerts.length > 0 && (
          <div className="panel" style={{ borderLeft: '4px solid #e74c3c' }}>
            <div className="panel-title">
              🚨 异常提醒（跨班次持续）
              <span style={{ fontSize: '13px', fontWeight: 400, marginLeft: '8px', color: '#888' }}>
                （{shiftContext.activeAlerts.length}条活跃提醒）
              </span>
            </div>
            <div className="records-list">
              {shiftContext.activeAlerts.map(alert => (
                <div key={alert.id} className="record-item warning">
                  <div className="record-header">
                    <span className="record-title">
                      [{alert.roomId}] {alert.title}
                      {alert.riskLevel === 'high' && <span className="badge high">高</span>}
                      <span className="badge" style={{ background: '#fce4ec', color: '#c62828' }}>
                        {shiftNames[alert.shift]}
                      </span>
                    </span>
                    <span className="record-time">{formatTime(alert.time)}</span>
                  </div>
                  <div className="record-desc">{alert.description}</div>
                  <div className="record-operator">责任人: {alert.operator}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentRole === 'headNurse' && (
          <div className="panel">
            <div className="panel-title">⚠️ 整层风险一览</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {getRiskRooms().map(room => (
                <div key={room.id} style={{
                  padding: '12px 16px',
                  background: '#fef5f5',
                  borderRadius: '8px',
                  borderLeft: '3px solid #e74c3c',
                  minWidth: '200px'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                    {room.id} - {room.mother?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {room.mother?.risks?.map(r => riskTypeNames[r] || r).join(', ')}
                    {room.baby?.jaundice && ' · 宝宝黄疸'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(roomsByFloor).map(floor => (
          <div key={floor} className="floor-section">
            <div className="floor-title">{floor}楼病房</div>
            <div className="rooms-grid">
              {roomsByFloor[floor].map(room => (
                <div
                  key={room.id}
                  className={`room-card ${room.status} ${room.type === 'vip' ? 'vip' : ''} ${room.hasRisk ? 'risk' : ''} ${room.baby?.jaundiceDelayed ? 'warning' : ''}`}
                  onClick={() => fetchRoomDetail(room.id)}
                >
                  <div className="room-header">
                    <span className="room-number">
                      {room.id}
                      {room.type === 'vip' && <span className="badge new">VIP</span>}
                      {room.hasRisk && <span className="badge high">高危</span>}
                    </span>
                    <span className={`room-status ${room.status}`}>
                      {room.status === 'occupied' ? '已入住' :
                        room.status === 'cleaning' ? '清洁中' : '维护中'}
                    </span>
                  </div>
                  {room.mother && (
                    <>
                      <div className="mother-info">
                        👩 妈妈: {room.mother.name} ({room.mother.age}岁)
                      </div>
                      <div className="baby-info">
                        👶 宝宝: {room.baby?.name} ({room.baby?.gender})
                      </div>
                      {room.mother.risks?.length > 0 && (
                        <div className="risk-tags">
                          {room.mother.risks.map(r => (
                            <span key={r} className="risk-tag">
                              {riskTypeNames[r] || r}
                            </span>
                          ))}
                        </div>
                      )}
                      {room.baby?.jaundice && (
                        <div className="risk-tags">
                          <span className="risk-tag jaundice">
                            黄疸 {room.baby.jaundiceDelayed && ' (复查延期)'}
                          </span>
                        </div>
                      )}
                      {room.mother.hasAupair && (
                        <div className="aupair-info">
                          🧑‍🍼 陪护阿姨: {room.mother.aupairName}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="two-columns">
          <div className="panel">
            <div className="panel-title">📋 {shiftNames[currentShift]}交接班记录</div>
            <div className="records-list">
              {records.length > 0 ? (
                records.map(record => (
                  <div
                    key={record.id}
                    className={`record-item ${getRecordTypeClass(record.type)}`}
                  >
                    <div className="record-header">
                      <span className="record-title">
                        [{record.roomId}] {record.title}
                        {record.riskLevel === 'high' && <span className="badge high">高</span>}
                      </span>
                      <span className="record-time">{formatTime(record.time)}</span>
                    </div>
                    <div className="record-desc">{record.description}</div>
                    {record.compensation && (
                      <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '4px' }}>
                        🎁 补偿方案: {record.compensation}
                      </div>
                    )}
                    <div className="record-operator">责任人: {record.operator}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无记录</div>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">⏰ 待办任务（含跨班次遗留）</div>
            <div className="tasks-list">
              {shiftContext && shiftContext.carriedOverTasks.length > 0 ? (
                shiftContext.carriedOverTasks.map(task => (
                  <div key={task.id} className={`task-item ${task.status}`}>
                    <div className="task-info">
                      <div className="task-title">
                        {task.roomId} - {task.title}
                        {task.shift !== currentShift && (
                          <span className="badge" style={{ background: '#fff3e0', color: '#e65100', marginLeft: '6px' }}>
                            {shiftNames[task.shift]}遗留
                          </span>
                        )}
                      </div>
                      <div className="task-meta">
                        {task.time} · {task.assignee}
                      </div>
                    </div>
                    {task.status === 'pending' && (
                      <button
                        className="task-btn complete"
                        onClick={() => handleCompleteTask(task.id)}
                      >
                        完成
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无待办</div>
              )}
            </div>
          </div>
        </div>

        {currentRole === 'customerService' && getComplaintRecords().length > 0 && (
          <div className="panel">
            <div className="panel-title">💬 家属反馈与补偿</div>
            <div className="records-list">
              {getComplaintRecords().map(record => (
                <div key={record.id} className="record-item complaint">
                  <div className="record-header">
                    <span className="record-title">{record.roomId} - {record.title}</span>
                    <span className="record-time">{formatTime(record.time)}</span>
                  </div>
                  <div className="record-desc">{record.description}</div>
                  <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '4px' }}>
                    🎁 补偿方案: {record.compensation}
                  </div>
                  <div className="record-operator">处理人: {record.operator}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedRoom && roomDetail && (
          <div className="modal-overlay" onClick={() => { setSelectedRoom(null); setRoomDetail(null); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">房间 {roomDetail.id} 详情</span>
                <button className="modal-close" onClick={() => { setSelectedRoom(null); setRoomDetail(null); }}>×</button>
              </div>

              {roomDetail.mother && (
                <>
                  <div className="room-detail-section">
                    <div className="detail-label">妈妈信息</div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <div className="label">姓名</div>
                        <div className="value">{roomDetail.mother.name}</div>
                      </div>
                      <div className="detail-item">
                        <div className="label">年龄</div>
                        <div className="value">{roomDetail.mother.age}岁</div>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <div className="label">入住日期</div>
                        <div className="value">{roomDetail.mother.admissionDate}</div>
                      </div>
                      <div className="detail-item">
                        <div className="label">陪护阿姨</div>
                        <div className="value">
                          {roomDetail.mother.hasAupair ? roomDetail.mother.aupairName : '无'}
                        </div>
                      </div>
                    </div>
                    {roomDetail.mother.risks?.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div className="label">风险提示</div>
                        <div className="risk-tags">
                          {roomDetail.mother.risks.map(r => (
                            <span key={r} className="risk-tag">
                              {riskTypeNames[r] || r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {roomDetail.baby && (
                    <div className="room-detail-section">
                      <div className="detail-label">宝宝信息</div>
                      <div className="detail-row">
                        <div className="detail-item">
                          <div className="label">姓名</div>
                          <div className="value">{roomDetail.baby.name}</div>
                        </div>
                        <div className="detail-item">
                          <div className="label">性别</div>
                          <div className="value">{roomDetail.baby.gender}</div>
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-item">
                          <div className="label">出生日期</div>
                          <div className="value">{roomDetail.baby.birthDate}</div>
                        </div>
                        <div className="detail-item">
                          <div className="label">体重</div>
                          <div className="value">{roomDetail.baby.weight}g</div>
                        </div>
                      </div>
                      {roomDetail.baby.jaundice && (
                        <div style={{ marginTop: '12px' }}>
                          <div className="label">黄疸情况</div>
                          <div className="risk-tags">
                            <span className="risk-tag jaundice">
                              需复查 {roomDetail.baby.jaundiceFollowUp}
                              {roomDetail.baby.jaundiceDelayed && ' (已延期)'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {roomDetail.jaundiceFollowUpInfo && (
                    <div className="room-detail-section">
                      <div className="detail-label">📋 黄疸复查信息</div>
                      <div className="detail-row">
                        <div className="detail-item">
                          <div className="label">复查日期</div>
                          <div className="value">
                            {roomDetail.jaundiceFollowUpInfo.followUpDate}
                            {roomDetail.jaundiceFollowUpInfo.delayed && (
                              <span style={{ color: '#e74c3c', marginLeft: '6px' }}>已延期</span>
                            )}
                          </div>
                        </div>
                        <div className="detail-item">
                          <div className="label">复查责任人</div>
                          <div className="value" style={{ fontWeight: 600, color: '#1565c0' }}>
                            {roomDetail.jaundiceFollowUpInfo.responsiblePerson}
                          </div>
                        </div>
                      </div>
                      {roomDetail.jaundiceFollowUpInfo.delayReason && (
                        <div style={{ fontSize: '13px', color: '#e74c3c', marginTop: '6px' }}>
                          延期原因: {roomDetail.jaundiceFollowUpInfo.delayReason}
                        </div>
                      )}
                      {roomDetail.jaundiceFollowUpInfo.lastCheck && (
                        <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
                          上次检查: {roomDetail.jaundiceFollowUpInfo.lastCheck.description} — {roomDetail.jaundiceFollowUpInfo.lastCheck.operator} {formatTime(roomDetail.jaundiceFollowUpInfo.lastCheck.time)}
                        </div>
                      )}
                    </div>
                  )}

                  {roomDetail.tasks && roomDetail.tasks.length > 0 && (
                    <div className="room-detail-section">
                      <div className="detail-label">🏥 护理任务</div>
                      <div className="tasks-list">
                        {roomDetail.tasks.map(task => (
                          <div key={task.id} className={`task-item ${task.status}`}>
                            <div className="task-info">
                              <div className="task-title">
                                {task.title}
                                <span className="badge" style={{ background: '#e3f2fd', color: '#1565c0', marginLeft: '6px' }}>
                                  {shiftNames[task.shift]}
                                </span>
                              </div>
                              <div className="task-meta">
                                {task.time} · {task.assignee}
                                {task.status === 'completed' && ' · ✅ 已完成'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="room-detail-section">
                    <div className="detail-label">🕐 交接时间线（全部班次）</div>
                    <div className="records-list" style={{ maxHeight: '300px' }}>
                      {roomDetail.timeline && roomDetail.timeline.length > 0 ? (
                        roomDetail.timeline.map(item => (
                          <div
                            key={item.id}
                            className={`record-item ${getRecordTypeClass(item.type)} ${item.source === 'task' ? '' : ''}`}
                          >
                            <div className="record-header">
                              <span className="record-title">
                                {item.title}
                                <span className="badge" style={{
                                  background: item.shift === 'morning' ? '#e8f5e9' : item.shift === 'evening' ? '#fff3e0' : '#e8eaf6',
                                  color: item.shift === 'morning' ? '#2e7d32' : item.shift === 'evening' ? '#e65100' : '#283593',
                                  marginLeft: '6px'
                                }}>
                                  {shiftNames[item.shift]}
                                </span>
                                {item.source === 'task' && (
                                  <span className="badge" style={{ background: '#f3e5f5', color: '#7b1fa2', marginLeft: '4px' }}>
                                    任务
                                  </span>
                                )}
                              </span>
                              <span className="record-time">
                                {item.source === 'record' ? formatTime(item.time) : item.time}
                              </span>
                            </div>
                            <div className="record-desc">{item.description}</div>
                            <div className="record-operator">{item.operator}</div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">暂无记录</div>
                      )}
                    </div>
                  </div>

                  <div className="add-record-form">
                    <div className="detail-label">添加交接记录</div>
                    <select
                      value={newRecord.type}
                      onChange={e => setNewRecord({ ...newRecord, type: e.target.value })}
                    >
                      {Object.entries(recordTypeNames).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="标题"
                      value={newRecord.title}
                      onChange={e => setNewRecord({ ...newRecord, title: e.target.value })}
                    />
                    <textarea
                      placeholder="详细描述"
                      value={newRecord.description}
                      onChange={e => setNewRecord({ ...newRecord, description: e.target.value })}
                    />
                    <button className="add-record-btn" onClick={handleAddRecord}>
                      添加记录
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
