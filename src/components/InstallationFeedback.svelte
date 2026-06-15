<script>
  import { installationFeedbacks, orders, deliverySchedules, updateInstallationStatus, handleAlert } from '$lib/store';
  
  let feedbackList = [];
  let orderList = [];
  let scheduleList = [];
  let selectedFeedbackId = null;
  
  installationFeedbacks.subscribe(f => {
    feedbackList = f;
    if (selectedFeedbackId) {
      const updated = feedbackList.find(feed => feed.id === selectedFeedbackId);
      if (updated) {
        selectedFeedback = updated;
      }
    }
  });
  orders.subscribe(o => orderList = o);
  deliverySchedules.subscribe(s => scheduleList = s);
  
  let selectedFeedback = null;
  let newRemark = '';
  
  const statusLabels = {
    pending: '待开始',
    installing: '铺贴中',
    completed: '已完成'
  };
  
  const statusColors = {
    pending: '#9E9E9E',
    installing: '#FF9800',
    completed: '#4CAF50'
  };
  
  const severityLabels = {
    low: '低',
    medium: '中',
    high: '高'
  };
  
  const severityColors = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336'
  };
  
  const getOrderInfo = (orderId) => {
    return orderList.find(o => o.id === orderId);
  };
  
  const getScheduleInfo = (scheduleId) => {
    return scheduleList.find(s => s.id === scheduleId);
  };
  
  const getPendingAlerts = (feedback) => {
    return (feedback.alerts || []).filter(alert => !alert.handled);
  };
  
  const handleSelectFeedback = (feedback) => {
    selectedFeedback = feedback;
    selectedFeedbackId = feedback.id;
  };
  
  const handleAddRemark = () => {
    if (selectedFeedback && newRemark.trim()) {
      installationFeedbacks.update(items =>
        items.map(item =>
          item.id === selectedFeedback.id
            ? {
                ...item,
                timeline: [
                  ...item.timeline,
                  {
                    time: new Date().toISOString().replace('T', ' ').substr(0, 19),
                    action: '进度更新',
                    operator: '系统',
                    remark: newRemark
                  }
                ]
              }
            : item
        )
      );
      newRemark = '';
    }
  };
  
  const handleComplete = (feedbackId) => {
    updateInstallationStatus(feedbackId, 'completed', '客户验收合格');
  };
  
  const handlePause = (feedbackId) => {
    updateInstallationStatus(feedbackId, 'pending', '暂停铺贴');
  };
  
  const handleResume = (feedbackId) => {
    updateInstallationStatus(feedbackId, 'installing', '继续铺贴');
  };
  
  const handleAlertClick = (feedbackId, alertId) => {
    handleAlert(feedbackId, alertId);
  };
</script>

<section id="installation" class="section">
  <div class="section-header">
    <h2>铺贴反馈管理</h2>
    <div class="filter-bar">
      <select class="filter-select">
        <option value="all">全部状态</option>
        <option value="pending">待开始</option>
        <option value="installing">铺贴中</option>
        <option value="completed">已完成</option>
      </select>
    </div>
  </div>
  
  <div class="feedback-container">
    <div class="feedback-list">
      {#each feedbackList as feedback}
        <div class="feedback-card" 
             class={feedback.status}
             class:active={selectedFeedback?.id === feedback.id}
             on:click={() => handleSelectFeedback(feedback)}>
          <div class="feedback-header">
            <span class="feedback-id">{feedback.id}</span>
            <span class="status-badge" style="background-color: {statusColors[feedback.status]}">
              {statusLabels[feedback.status]}
            </span>
          </div>
          
          {#if getOrderInfo(feedback.orderId)}
            <div class="customer-info">
              <span class="customer-name">{getOrderInfo(feedback.orderId).customerName}</span>
              <span class="order-link">{feedback.orderId}</span>
            </div>
          {/if}
          
          <div class="feedback-summary">
            <div class="summary-item">
              <span class="label">施工师傅</span>
              <span class="value">{feedback.installer}</span>
            </div>
            <div class="summary-item">
              <span class="label">开始日期</span>
              <span class="value">{feedback.startDate}</span>
            </div>
            {#if feedback.endDate}
              <div class="summary-item">
                <span class="label">完成日期</span>
                <span class="value">{feedback.endDate}</span>
              </div>
            {/if}
            {#if feedback.qualityRating}
              <div class="summary-item">
                <span class="label">质量评分</span>
                <span class="value stars">
                  {#each Array(5) as _, i}
                    <span class={i < feedback.qualityRating ? 'filled' : ''}>★</span>
                  {/each}
                </span>
              </div>
            {/if}
          </div>
          
          {#if feedback.issues && feedback.issues.length > 0}
            <div class="issues-warning">
              <span class="warning-icon">⚠</span>
              <span>{feedback.issues.length} 个问题待处理</span>
            </div>
          {/if}
          
          {#if getPendingAlerts(feedback).length > 0}
            <div class="alerts-warning">
              <span class="alert-icon">🔔</span>
              <span>{getPendingAlerts(feedback).length} 条预警待处理</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    
    <div class="feedback-detail">
      {#if selectedFeedback}
        <div class="detail-header">
          <h3>铺贴详情</h3>
          <div class="detail-actions">
            {#if selectedFeedback.status === 'installing'}
              <button class="btn btn-warning" on:click={() => handlePause(selectedFeedback.id)}>暂停</button>
              <button class="btn btn-success" on:click={() => handleComplete(selectedFeedback.id)}>完成</button>
            {/if}
            {#if selectedFeedback.status === 'pending'}
              <button class="btn btn-primary" on:click={() => handleResume(selectedFeedback.id)}>开始铺贴</button>
            {/if}
          </div>
        </div>
        
        <div class="detail-info">
          <div class="info-section">
            <h4>基本信息</h4>
            <div class="info-row">
              <span class="label">关联订单</span>
              <span class="value">{selectedFeedback.orderId}</span>
            </div>
            <div class="info-row">
              <span class="label">施工师傅</span>
              <span class="value">{selectedFeedback.installer}</span>
            </div>
            <div class="info-row">
              <span class="label">送货排期</span>
              <span class="value">{getScheduleInfo(selectedFeedback.deliveryScheduleId)?.scheduledDate || '未安排'}</span>
            </div>
            <div class="info-row">
              <span class="label">施工状态</span>
              <span class="value">
                <span class="status-dot" style="background-color: {statusColors[selectedFeedback.status]}"></span>
                {statusLabels[selectedFeedback.status]}
              </span>
            </div>
          </div>
          
          {#if selectedFeedback.issues && selectedFeedback.issues.length > 0}
            <div class="info-section warning">
              <h4>问题记录</h4>
              {#each selectedFeedback.issues as issue}
                <div class="issue-item">
                  <span class="severity-badge" style="background-color: {severityColors[issue.severity]}">
                    {severityLabels[issue.severity]}
                  </span>
                  <span class="issue-desc">{issue.description}</span>
                  <span class="issue-date">{issue.createdAt}</span>
                </div>
              {/each}
            </div>
          {/if}
          
          {#if selectedFeedback.alerts && selectedFeedback.alerts.length > 0}
            <div class="info-section alert-section">
              <h4>责任预警</h4>
              {#each selectedFeedback.alerts as alert}
                <div class="alert-item" class={alert.handled ? 'handled' : ''}>
                  <div class="alert-header">
                    <span class="alert-icon">🔔</span>
                    <span class="alert-title">{alert.title}</span>
                    {#if alert.handled}
                      <span class="alert-status handled-tag">已处理</span>
                    {:else}
                      <span class="alert-status pending-tag">待处理</span>
                    {/if}
                  </div>
                  <p class="alert-desc">{alert.description}</p>
                  <div class="alert-meta">
                    <span class="alert-responsibility">责任人: {alert.responsibility}</span>
                    <span class="alert-date">{alert.createdAt}</span>
                  </div>
                  {#if !alert.handled}
                    <button class="btn btn-sm btn-primary" on:click={() => handleAlertClick(selectedFeedback.id, alert.id)}>
                      标记为已处理
                    </button>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
          
          <div class="info-section">
            <h4>施工时间线</h4>
            <div class="timeline">
              {#each selectedFeedback.timeline as item}
                <div class="timeline-item">
                  <div class="timeline-marker">
                    <span class="marker-dot"></span>
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <span class="timeline-action">{item.action}</span>
                      <span class="timeline-time">{item.time}</span>
                    </div>
                    <div class="timeline-body">
                      <span class="timeline-operator">{item.operator}</span>
                      {#if item.remark}
                        <span class="timeline-remark">- {item.remark}</span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
          
          <div class="info-section">
            <h4>添加备注</h4>
            <div class="remark-input">
              <textarea bind:value={newRemark} placeholder="输入施工备注..." rows="3"></textarea>
              <button class="btn btn-primary" on:click={handleAddRemark}>添加备注</button>
            </div>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>请选择一个铺贴反馈查看详情</p>
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .feedback-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  
  .feedback-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .feedback-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: all 0.2s;
    border-left: 4px solid;
  }
  
  .feedback-card.pending { border-left-color: #9E9E9E; }
  .feedback-card.installing { border-left-color: #FF9800; }
  .feedback-card.completed { border-left-color: #4CAF50; }
  .feedback-card.active {
    box-shadow: 0 4px 16px rgba(30, 60, 114, 0.15);
    transform: translateX(4px);
  }
  
  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }
  
  .feedback-id {
    font-weight: 600;
    color: #1e3c72;
  }
  
  .status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 16px;
    font-size: 0.7rem;
    color: white;
    font-weight: 500;
  }
  
  .customer-info {
    margin-bottom: 0.75rem;
  }
  
  .customer-name {
    font-weight: 500;
    color: #333;
  }
  
  .order-link {
    font-size: 0.8rem;
    color: #666;
    margin-left: 0.5rem;
  }
  
  .feedback-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
  }
  
  .summary-item .label {
    color: #999;
  }
  
  .summary-item .value {
    color: #333;
    font-weight: 500;
  }
  
  .summary-item .value.stars {
    color: #FFC107;
  }
  
  .summary-item .value.stars .filled {
    opacity: 1;
  }
  
  .summary-item .value.stars span {
    opacity: 0.3;
  }
  
  .issues-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background-color: #fff8f0;
    border-radius: 6px;
    color: #e65100;
    font-size: 0.85rem;
  }
  
  .feedback-detail {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    min-height: 500px;
  }
  
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
  }
  
  .detail-header h3 {
    font-size: 1.2rem;
    color: #333;
  }
  
  .detail-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
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
  
  .btn-warning {
    background: linear-gradient(135deg, #FF9800 0%, #f57c00 100%);
    color: white;
  }
  
  .btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .info-section {
    margin-bottom: 1.5rem;
  }
  
  .info-section h4 {
    font-size: 0.95rem;
    color: #666;
    margin-bottom: 0.75rem;
  }
  
  .info-section.warning {
    background-color: #fff8f0;
    padding: 1rem;
    border-radius: 8px;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
  }
  
  .info-row .label {
    color: #999;
    font-size: 0.9rem;
  }
  
  .info-row .value {
    color: #333;
    font-weight: 500;
  }
  
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }
  
  .issue-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem;
    background-color: rgba(255,255,255,0.8);
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  
  .severity-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.65rem;
    color: white;
    font-weight: 500;
  }
  
  .issue-desc {
    flex: 1;
    font-size: 0.85rem;
    color: #333;
  }
  
  .issue-date {
    font-size: 0.75rem;
    color: #999;
  }
  
  .timeline {
    position: relative;
    padding-left: 1.5rem;
  }
  
  .timeline::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #eee;
  }
  
  .timeline-item {
    position: relative;
    padding-bottom: 1rem;
  }
  
  .timeline-item:last-child {
    padding-bottom: 0;
  }
  
  .timeline-marker {
    position: absolute;
    left: -1.5rem;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #FF9800;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .marker-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #FF9800;
  }
  
  .timeline-content {
    background-color: #f8f9fa;
    padding: 0.75rem;
    border-radius: 6px;
  }
  
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }
  
  .timeline-action {
    font-weight: 600;
    color: #333;
    font-size: 0.85rem;
  }
  
  .timeline-time {
    font-size: 0.7rem;
    color: #999;
  }
  
  .timeline-body {
    font-size: 0.8rem;
    color: #666;
  }
  
  .timeline-operator {
    font-weight: 500;
  }
  
  .timeline-remark {
    color: #888;
    margin-left: 0.5rem;
  }
  
  .remark-input {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .remark-input textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
    resize: vertical;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #999;
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .alerts-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background-color: #fff3e0;
    border-radius: 6px;
    color: #f57c00;
    font-size: 0.85rem;
  }
  
  .alert-icon {
    font-size: 1rem;
  }
  
  .info-section.alert-section {
    background-color: #fff3e0;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #FF9800;
  }
  
  .alert-item {
    background-color: white;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
    border: 1px solid #ffe0b2;
  }
  
  .alert-item.handled {
    opacity: 0.6;
    border-color: #e0e0e0;
  }
  
  .alert-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .alert-header .alert-icon {
    font-size: 1.1rem;
  }
  
  .alert-title {
    font-weight: 600;
    color: #e65100;
  }
  
  .alert-status {
    margin-left: auto;
    padding: 0.15rem 0.5rem;
    border-radius: 12px;
    font-size: 0.65rem;
    font-weight: 500;
  }
  
  .pending-tag {
    background-color: #fff8e1;
    color: #ff9800;
  }
  
  .handled-tag {
    background-color: #e8f5e9;
    color: #4caf50;
  }
  
  .alert-desc {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  
  .alert-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #999;
    margin-bottom: 0.5rem;
  }
  
  .btn-sm {
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
  }
</style>
