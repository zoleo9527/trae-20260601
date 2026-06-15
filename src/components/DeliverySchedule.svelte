<script>
  import { deliverySchedules, orders, installationFeedbacks, updateDeliverySchedule } from '$lib/store';
  import { currentUser } from '$lib/store';
  
  let scheduleList = [];
  let orderList = [];
  let feedbackList = [];
  let user = {};
  
  deliverySchedules.subscribe(s => scheduleList = s);
  orders.subscribe(o => orderList = o);
  installationFeedbacks.subscribe(f => feedbackList = f);
  currentUser.subscribe(u => user = u);
  
  const statusLabels = {
    pending: '待确认',
    scheduled: '已排期',
    completed: '已完成'
  };
  
  const statusColors = {
    pending: '#9E9E9E',
    scheduled: '#2196F3',
    completed: '#4CAF50'
  };
  
  const getOrderInfo = (orderId) => {
    return orderList.find(o => o.id === orderId);
  };
  
  let editingSchedule = null;
  let editForm = {
    scheduledDate: '',
    scheduledTime: '',
    warehouseStaff: '',
    driver: '',
    vehicle: '',
    remarks: '',
    changeReason: ''
  };
  
  let originalScheduledDate = '';
  
  const handleEdit = (schedule) => {
    editingSchedule = schedule.id;
    originalScheduledDate = schedule.scheduledDate;
    editForm = {
      scheduledDate: schedule.scheduledDate,
      scheduledTime: schedule.scheduledTime,
      warehouseStaff: schedule.warehouseStaff,
      driver: schedule.driver,
      vehicle: schedule.vehicle,
      remarks: schedule.remarks,
      changeReason: ''
    };
  };
  
  const handleSave = () => {
    const dateChanged = editForm.scheduledDate !== originalScheduledDate;
    const changeReason = dateChanged ? editForm.changeReason : '';
    updateDeliverySchedule(editingSchedule, editForm, dateChanged, feedbackList, changeReason);
    editingSchedule = null;
  };
  
  const handleCancel = () => {
    editingSchedule = null;
  };
  
  const handleConfirm = (scheduleId) => {
    updateDeliverySchedule(scheduleId, { status: 'scheduled' }, false, feedbackList);
  };
  
  const handleComplete = (scheduleId) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    updateDeliverySchedule(scheduleId, { 
      status: 'completed',
      actualDate: date,
      actualTime: time
    }, false, feedbackList);
  };
</script>

<section id="delivery" class="section">
  <div class="section-header">
    <h2>送货排期管理</h2>
    <div class="filter-bar">
      <select class="filter-select">
        <option value="all">全部状态</option>
        <option value="pending">待确认</option>
        <option value="scheduled">已排期</option>
        <option value="completed">已完成</option>
      </select>
    </div>
  </div>
  
  <div class="schedule-container">
    {#each scheduleList as schedule}
      <div class="schedule-card" class={schedule.status}>
        <div class="schedule-header">
          <div class="schedule-info">
            <span class="schedule-id">{schedule.id}</span>
            <span class="order-ref">关联订单: {schedule.orderId}</span>
          </div>
          <span class="status-badge" style="background-color: {statusColors[schedule.status]}">
            {statusLabels[schedule.status]}
          </span>
        </div>
        
        {#if getOrderInfo(schedule.orderId)}
          <div class="customer-info">
            <span class="customer-name">{getOrderInfo(schedule.orderId).customerName}</span>
            <span class="customer-address">{getOrderInfo(schedule.orderId).address}</span>
          </div>
        {/if}
        
        {#if editingSchedule === schedule.id}
          <div class="edit-form">
            <div class="form-row">
              <label>排期日期</label>
              <input type="date" bind:value={editForm.scheduledDate} />
            </div>
            <div class="form-row">
              <label>排期时间</label>
              <input type="time" bind:value={editForm.scheduledTime} />
            </div>
            {#if editForm.scheduledDate !== originalScheduledDate}
              <div class="form-row warning-row">
                <label>改期原因</label>
                <textarea bind:value={editForm.changeReason} rows="2" placeholder="请说明改期原因，将通知施工师傅"></textarea>
              </div>
            {/if}
            <div class="form-row">
              <label>仓库员</label>
              <input type="text" bind:value={editForm.warehouseStaff} />
            </div>
            <div class="form-row">
              <label>司机</label>
              <input type="text" bind:value={editForm.driver} />
            </div>
            <div class="form-row">
              <label>车辆</label>
              <input type="text" bind:value={editForm.vehicle} />
            </div>
            <div class="form-row">
              <label>备注</label>
              <textarea bind:value={editForm.remarks} rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={handleCancel}>取消</button>
              <button class="btn btn-primary" on:click={handleSave}>保存</button>
            </div>
          </div>
        {:else}
          <div class="schedule-details">
            <div class="detail-row">
              <span class="detail-label">排期日期</span>
              <span class="detail-value">{schedule.scheduledDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">排期时间</span>
              <span class="detail-value">{schedule.scheduledTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">仓库员</span>
              <span class="detail-value">{schedule.warehouseStaff}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">司机</span>
              <span class="detail-value">{schedule.driver}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">车辆</span>
              <span class="detail-value">{schedule.vehicle}</span>
            </div>
            {#if schedule.actualDate}
              <div class="detail-row highlight">
                <span class="detail-label">实际送达</span>
                <span class="detail-value">{schedule.actualDate} {schedule.actualTime}</span>
              </div>
            {/if}
            {#if schedule.remarks}
              <div class="detail-row">
                <span class="detail-label">备注</span>
                <span class="detail-value">{schedule.remarks}</span>
              </div>
            {/if}
          </div>
            
          <div class="schedule-timeline">
            <h4>处理记录</h4>
            {#each schedule.timeline as item}
              <div class="timeline-mini-item">
                <span class="timeline-time">{item.time}</span>
                <span class="timeline-desc">{item.action} - {item.operator}</span>
                {#if item.remark}
                  <span class="timeline-note">{item.remark}</span>
                {/if}
              </div>
            {/each}
          </div>
            
          <div class="schedule-actions">
            {#if schedule.status === 'pending'}
              <button class="btn btn-primary" on:click={() => handleConfirm(schedule.id)}>确认排期</button>
            {/if}
            {#if schedule.status === 'scheduled'}
              <button class="btn btn-primary" on:click={() => handleEdit(schedule)}>修改排期</button>
              <button class="btn btn-success" on:click={() => handleComplete(schedule.id)}>确认送达</button>
            {/if}
            {#if schedule.status === 'completed'}
              <button class="btn btn-secondary" on:click={() => handleEdit(schedule)}>查看详情</button>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</section>

<style>
  .schedule-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }
  
  .schedule-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border-left: 4px solid;
  }
  
  .schedule-card.pending { border-left-color: #9E9E9E; }
  .schedule-card.scheduled { border-left-color: #2196F3; }
  .schedule-card.completed { border-left-color: #4CAF50; }
  
  .schedule-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .schedule-id {
    font-weight: 600;
    color: #1e3c72;
    font-size: 1.1rem;
  }
  
  .order-ref {
    font-size: 0.8rem;
    color: #999;
    margin-left: 0.5rem;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    color: white;
    font-weight: 500;
  }
  
  .customer-info {
    background-color: #f8f9fa;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .customer-name {
    display: block;
    font-weight: 500;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .customer-address {
    display: block;
    font-size: 0.85rem;
    color: #666;
  }
  
  .schedule-details {
    margin-bottom: 1rem;
  }
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .detail-row.highlight {
    background-color: #e8f5e9;
    margin: 0 -1.5rem;
    padding: 0.5rem 1.5rem;
    border-bottom: none;
  }
  
  .detail-label {
    color: #999;
    font-size: 0.9rem;
  }
  
  .detail-value {
    font-weight: 500;
    color: #333;
  }
  
  .schedule-timeline {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    max-height: 150px;
    overflow-y: auto;
  }
  
  .schedule-timeline h4 {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.75rem;
  }
  
  .timeline-mini-item {
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #666;
  }
  
  .timeline-mini-item:last-child {
    margin-bottom: 0;
  }
  
  .timeline-time {
    color: #999;
    margin-right: 0.5rem;
  }
  
  .timeline-desc {
    color: #333;
  }
  
  .timeline-note {
    display: block;
    color: #888;
    margin-left: 80px;
    margin-top: 0.25rem;
  }
  
  .schedule-actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn {
    flex: 1;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
  }
  
  .btn-success {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
  }
  
  .btn-secondary {
    background: #f0f0f0;
    color: #666;
  }
  
  .btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .edit-form {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .form-row {
    margin-bottom: 0.75rem;
  }
  
  .form-row label {
    display: block;
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .form-row input,
  .form-row textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }
  
  .form-actions .btn {
    flex: 1;
  }
  
  .warning-row {
    background-color: #fff8f0;
    padding: 0.5rem;
    border-radius: 6px;
    border-left: 4px solid #FF9800;
  }
  
  .warning-row textarea {
    background-color: white;
  }
</style>
