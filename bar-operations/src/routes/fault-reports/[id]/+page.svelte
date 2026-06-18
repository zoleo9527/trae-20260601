<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();

  let repairNotes = $state(data.fault.repair_notes || '');
  let isProcessing = $state(false);
  let message = $state('');
  let messageType = $state<'success' | 'error'>('success');

  const roleLabels: Record<string, string> = {
    exhibitor: '展教员',
    engineer: '设备工程师',
    teacher: '活动老师',
    admin: '管理员'
  };

  const statusLabels: Record<string, string> = {
    pending: '待接收',
    processing: '处理中',
    completed: '已完成'
  };

  const statusColors: Record<string, string> = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed'
  };

  const exhibitStatusLabels: Record<string, string> = {
    normal: '正常',
    inspecting: '巡检中',
    fault_pending: '故障待修',
    repairing: '维修中'
  };

  const typeLabels: Record<string, string> = {
    inspection_submitted: '提交巡检',
    fault_reported: '提交故障',
    fault_received: '接收故障',
    fault_processed: '处理故障',
    fault_completed: '完成故障'
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  }

  async function handleReceive() {
    isProcessing = true;
    message = '';

    try {
      const response = await fetch(`/api/faults/${data.fault.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator_id: data.user.id })
      });

      if (response.ok) {
        message = '故障已接收！';
        messageType = 'success';
        await invalidateAll();
      } else {
        const error = await response.json();
        message = error.error || '接收失败';
        messageType = 'error';
      }
    } catch (error) {
      message = '网络错误，请重试';
      messageType = 'error';
    } finally {
      isProcessing = false;
    }
  }

  async function handleProcess() {
    if (!repairNotes.trim()) {
      message = '请填写维修内容';
      messageType = 'error';
      return;
    }

    isProcessing = true;
    message = '';

    try {
      const response = await fetch(`/api/faults/${data.fault.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: data.user.id,
          repair_notes: repairNotes
        })
      });

      if (response.ok) {
        message = '维修进度已更新！';
        messageType = 'success';
        await invalidateAll();
      } else {
        const error = await response.json();
        message = error.error || '更新失败';
        messageType = 'error';
      }
    } catch (error) {
      message = '网络错误，请重试';
      messageType = 'error';
    } finally {
      isProcessing = false;
    }
  }

  async function handleComplete() {
    if (!repairNotes.trim()) {
      message = '请填写维修内容';
      messageType = 'error';
      return;
    }

    isProcessing = true;
    message = '';

    try {
      const response = await fetch(`/api/faults/${data.fault.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_id: data.user.id,
          repair_notes: repairNotes
        })
      });

      if (response.ok) {
        message = '故障已完成！';
        messageType = 'success';
        await invalidateAll();
      } else {
        const error = await response.json();
        message = error.error || '完成失败';
        messageType = 'error';
      }
    } catch (error) {
      message = '网络错误，请重试';
      messageType = 'error';
    } finally {
      isProcessing = false;
    }
  }

  const canReceive = $derived(
    data.fault.status === 'pending' &&
    (data.user.role === 'engineer' || data.user.role === 'admin')
  );

  const canProcess = $derived(
    data.fault.status === 'processing' &&
    data.fault.assignee_id === data.user.id
  );

  const canComplete = $derived(
    data.fault.status === 'processing' &&
    data.fault.assignee_id === data.user.id
  );
</script>

<svelte:head>
  <title>故障详情 - {data.fault.exhibit_name}</title>
</svelte:head>

<div class="fault-detail">
  <div class="breadcrumb">
    <a href="/fault-reports" class="breadcrumb-link">故障报修</a>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current">{data.fault.exhibit_name}</span>
  </div>

  <div class="detail-grid">
    <div class="main-content">
      <div class="detail-card">
        <div class="card-header">
          <div>
            <h1 class="fault-title">{data.fault.exhibit_name}</h1>
            <div class="fault-location">📍 {data.fault.exhibit_location}</div>
          </div>
          <span class="fault-status {statusColors[data.fault.status]}">
            {statusLabels[data.fault.status]}
          </span>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">报修人</div>
            <div class="info-value">
              {data.fault.reporter_name}
              <span class="role-tag">{roleLabels[data.fault.reporter_role]}</span>
            </div>
          </div>

          {#if data.fault.assignee_name}
            <div class="info-item">
              <div class="info-label">负责工程师</div>
              <div class="info-value">
                {data.fault.assignee_name}
                <span class="role-tag">{roleLabels[data.fault.assignee_role]}</span>
              </div>
            </div>
          {/if}

          <div class="info-item">
            <div class="info-label">展项状态</div>
            <div class="info-value">{exhibitStatusLabels[data.fault.exhibit_status]}</div>
          </div>

          <div class="info-item">
            <div class="info-label">提交时间</div>
            <div class="info-value">{formatDate(data.fault.created_at)}</div>
          </div>

          {#if data.fault.received_at}
            <div class="info-item">
              <div class="info-label">接收时间</div>
              <div class="info-value">{formatDate(data.fault.received_at)}</div>
            </div>
          {/if}

          {#if data.fault.completed_at}
            <div class="info-item">
              <div class="info-label">完成时间</div>
              <div class="info-value">{formatDate(data.fault.completed_at)}</div>
            </div>
          {/if}
        </div>

        <div class="description-section">
          <h3 class="section-title">故障描述</h3>
          <div class="description-content">
            {data.fault.description}
          </div>
        </div>

        {#if data.fault.repair_notes}
          <div class="description-section">
            <h3 class="section-title">维修备注</h3>
            <div class="description-content repair-notes">
              {data.fault.repair_notes}
            </div>
          </div>
        {/if}
      </div>

      {#if canReceive || canProcess || canComplete}
        <div class="action-card">
          <h3 class="action-title">
            {data.fault.status === 'pending' ? '接收故障' : '维修处理'}
          </h3>

          {#if message}
            <div class="message" class:success={messageType === 'success'} class:error={messageType === 'error'}>
              {message}
            </div>
          {/if}

          <div class="form-group">
            <label class="form-label">维修内容</label>
            <textarea
              class="form-textarea"
              bind:value={repairNotes}
              placeholder="请详细描述维修过程和结果..."
              rows="6"
            ></textarea>
          </div>

          <div class="action-buttons">
            {#if canReceive}
              <button class="action-btn receive" onclick={handleReceive} disabled={isProcessing}>
                {isProcessing ? '处理中...' : '接收故障'}
              </button>
            {/if}

            {#if canProcess}
              <button class="action-btn process" onclick={handleProcess} disabled={isProcessing}>
                {isProcessing ? '处理中...' : '更新进度'}
              </button>
            {/if}

            {#if canComplete}
              <button class="action-btn complete" onclick={handleComplete} disabled={isProcessing}>
                {isProcessing ? '处理中...' : '确认完成'}
              </button>
            {/if}
          </div>
        </div>
      {/if}

      <div class="timeline-card">
        <h3 class="timeline-title">操作时间线</h3>

        <div class="timeline">
          {#if data.fault.source_inspection_id}
            <div class="timeline-item">
              <div class="timeline-marker">
                <span class="marker-icon">🔍</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">来源巡检</span>
                  <span class="timeline-time">{formatDate(data.fault.source_inspection_time)}</span>
                </div>
                <div class="timeline-operator">
                  巡检结果：<span class="result-badge" class:abnormal={data.fault.source_inspection_result === 'abnormal'}>
                    {data.fault.source_inspection_result === 'normal' ? '正常' : '异常'}
                  </span>
                </div>
                {#if data.fault.source_inspection_notes}
                  <div class="timeline-details">{data.fault.source_inspection_notes}</div>
                {/if}
              </div>
            </div>
          {/if}

          {#each data.logs as log}
            <div class="timeline-item">
              <div class="timeline-marker">
                {#if log.type === 'fault_reported'}
                  <span class="marker-icon">📝</span>
                {:else if log.type === 'fault_received'}
                  <span class="marker-icon">👋</span>
                {:else if log.type === 'fault_processed'}
                  <span class="marker-icon">🔧</span>
                {:else if log.type === 'fault_completed'}
                  <span class="marker-icon">✅</span>
                {:else}
                  <span class="marker-icon">📋</span>
                {/if}
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-type">{typeLabels[log.type] || log.type}</span>
                  <span class="timeline-time">{formatDate(log.created_at)}</span>
                </div>
                <div class="timeline-operator">
                  操作人：{log.operator_name}
                  <span class="role-tag">{roleLabels[log.operator_role]}</span>
                </div>
                {#if log.details}
                  <div class="timeline-details">{log.details}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div class="sidebar">
      <div class="sidebar-card">
        <h3 class="sidebar-title">快速操作</h3>
        <div class="quick-actions">
          <a href="/exhibits/{data.fault.exhibit_id}" class="quick-action">
            <span class="action-icon">📦</span>
            <span class="action-text">查看展项</span>
          </a>
          <a href="/inspection?exhibit_id={data.fault.exhibit_id}" class="quick-action">
            <span class="action-icon">🔍</span>
            <span class="action-text">提交巡检</span>
          </a>
        </div>
      </div>

      <div class="sidebar-card">
        <h3 class="sidebar-title">状态说明</h3>
        <div class="status-guide">
          <div class="guide-item">
            <span class="guide-status status-pending">待接收</span>
            <span class="guide-desc">设备工程师尚未接收此故障</span>
          </div>
          <div class="guide-item">
            <span class="guide-status status-processing">处理中</span>
            <span class="guide-desc">设备工程师正在维修中</span>
          </div>
          <div class="guide-item">
            <span class="guide-status status-completed">已完成</span>
            <span class="guide-desc">故障已修复，展项恢复正常</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .fault-detail {
    max-width: 1400px;
  }

  .breadcrumb {
    margin-bottom: 1.5rem;
    font-size: 0.875rem;
  }

  .breadcrumb-link {
    color: #667eea;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
  }

  .breadcrumb-sep {
    color: #cbd5e1;
    margin: 0 0.5rem;
  }

  .breadcrumb-current {
    color: #64748b;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .detail-grid {
      grid-template-columns: 1fr;
    }
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .detail-card, .action-card, .timeline-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }

  .fault-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    color: #1a202c;
  }

  .fault-location {
    color: #64748b;
  }

  .fault-status {
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-pending { background: #fee2e2; color: #991b1b; }
  .status-processing { background: #fef3c7; color: #92400e; }
  .status-completed { background: #d1fae5; color: #065f46; }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .info-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .info-value {
    font-weight: 600;
    color: #1a202c;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .role-tag {
    background: #e2e8f0;
    color: #475569;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .result-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    background: #d1fae5;
    color: #065f46;
  }

  .result-badge.abnormal {
    background: #fee2e2;
    color: #991b1b;
  }

  .description-section {
    margin-bottom: 1.5rem;
  }

  .section-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #374151;
  }

  .description-content {
    color: #475569;
    line-height: 1.8;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .repair-notes {
    background: #f0fdf4;
    color: #166534;
  }

  .action-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s;
  }

  .form-textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
  }

  .action-btn {
    flex: 1;
    padding: 1rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .action-btn.receive {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .action-btn.receive:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .action-btn.process {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }

  .action-btn.process:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }

  .action-btn.complete {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }

  .action-btn.complete:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .timeline-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .timeline-item {
    display: flex;
    gap: 1rem;
  }

  .timeline-marker {
    flex-shrink: 0;
  }

  .marker-icon {
    font-size: 1.5rem;
  }

  .timeline-content {
    flex: 1;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .timeline-item:last-child .timeline-content {
    border-bottom: none;
    padding-bottom: 0;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .timeline-type {
    font-weight: 600;
    color: #667eea;
  }

  .timeline-time {
    font-size: 0.875rem;
    color: #64748b;
  }

  .timeline-operator {
    font-size: 0.875rem;
    color: #475569;
    margin-bottom: 0.5rem;
  }

  .timeline-details {
    font-size: 0.875rem;
    color: #64748b;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 4px;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .sidebar-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .sidebar-title {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #1a202c;
  }

  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .quick-action {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
    text-decoration: none;
    color: #475569;
    transition: all 0.2s;
  }

  .quick-action:hover {
    background: #f1f5f9;
    transform: translateX(4px);
  }

  .action-icon {
    font-size: 1.25rem;
  }

  .status-guide {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .guide-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .guide-status {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    width: fit-content;
  }

  .guide-desc {
    font-size: 0.875rem;
    color: #64748b;
  }
</style>
