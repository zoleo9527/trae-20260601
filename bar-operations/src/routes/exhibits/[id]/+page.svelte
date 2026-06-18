<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();

  const statusLabels: Record<string, string> = {
    normal: '正常',
    inspecting: '巡检中',
    fault_pending: '故障待修',
    repairing: '维修中'
  };

  const statusColors: Record<string, string> = {
    normal: 'status-normal',
    inspecting: 'status-inspecting',
    fault_pending: 'status-fault',
    repairing: 'status-repairing'
  };

  const resultLabels: Record<string, string> = {
    normal: '正常',
    abnormal: '异常'
  };

  const faultStatusLabels: Record<string, string> = {
    pending: '待接收',
    processing: '处理中',
    completed: '已完成'
  };

  const faultStatusColors: Record<string, string> = {
    pending: 'status-pending',
    processing: 'status-processing',
    completed: 'status-completed'
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN');
  }
</script>

<svelte:head>
  <title>{data.exhibit.name} - 展项详情</title>
</svelte:head>

<div class="exhibit-detail">
  <div class="breadcrumb">
    <a href="/exhibits" class="breadcrumb-link">展项管理</a>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current">{data.exhibit.name}</span>
  </div>

  <div class="detail-card">
    <div class="detail-header">
      <div>
        <h1 class="detail-title">{data.exhibit.name}</h1>
        <div class="detail-location">📍 {data.exhibit.location}</div>
      </div>
      <span class="exhibit-status {statusColors[data.exhibit.status]}">
        {statusLabels[data.exhibit.status]}
      </span>
    </div>

    <div class="detail-actions">
      <a href="/inspection?exhibit_id={data.exhibit.id}" class="action-btn primary">
        🔍 提交巡检
      </a>
      {#if data.exhibit.status !== 'normal'}
        <a href="/fault-reports?exhibit_id={data.exhibit.id}" class="action-btn secondary">
          ⚠️ 查看故障
        </a>
      {/if}
    </div>
  </div>

  <div class="tabs">
    <div class="tab active">巡检记录</div>
    <div class="tab">故障记录</div>
  </div>

  <div class="section">
    <h2 class="section-title">巡检记录</h2>

    {#if data.inspections.length === 0}
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">暂无巡检记录</div>
      </div>
    {:else}
      <div class="record-list">
        {#each data.inspections as inspection}
          <div class="record-item">
            <div class="record-header">
              <span class="record-result" class:normal={inspection.result === 'normal'} class:abnormal={inspection.result === 'abnormal'}>
                {resultLabels[inspection.result]}
              </span>
              <span class="record-time">{formatDate(inspection.created_at)}</span>
            </div>
            {#if inspection.notes}
              <div class="record-notes">{inspection.notes}</div>
            {/if}
            <div class="record-operator">巡检员：{inspection.inspector_name}</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="section">
    <h2 class="section-title">故障记录</h2>

    {#if data.faults.length === 0}
      <div class="empty-state">
        <div class="empty-icon">✅</div>
        <div class="empty-text">暂无故障记录</div>
      </div>
    {:else}
      <div class="fault-list">
        {#each data.faults as fault}
          <a href="/fault-reports/{fault.id}" class="fault-item">
            <div class="fault-header">
              <span class="fault-status {faultStatusColors[fault.status]}">
                {faultStatusLabels[fault.status]}
              </span>
              <span class="fault-time">{formatDate(fault.created_at)}</span>
            </div>
            <div class="fault-description">{fault.description}</div>
            {#if fault.repair_notes}
              <div class="fault-repair">维修备注：{fault.repair_notes}</div>
            {/if}
            <div class="fault-meta">
              <span>报修人：{fault.reporter_name}</span>
              {#if fault.assignee_name}
                <span>工程师：{fault.assignee_name}</span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .exhibit-detail {
    max-width: 1200px;
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

  .detail-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .detail-title {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a202c;
  }

  .detail-location {
    color: #64748b;
    font-size: 1.125rem;
  }

  .exhibit-status {
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-normal { background: #d1fae5; color: #065f46; }
  .status-inspecting { background: #dbeafe; color: #1e40af; }
  .status-fault { background: #fee2e2; color: #991b1b; }
  .status-repairing { background: #fef3c7; color: #92400e; }

  .detail-actions {
    display: flex;
    gap: 1rem;
  }

  .action-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .action-btn.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .action-btn.secondary {
    background: #f1f5f9;
    color: #475569;
  }

  .action-btn.secondary:hover {
    background: #e2e8f0;
  }

  .tabs {
    display: flex;
    gap: 2rem;
    border-bottom: 2px solid #e2e8f0;
    margin-bottom: 2rem;
  }

  .tab {
    padding: 1rem 0;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
  }

  .tab.active {
    color: #667eea;
    border-bottom-color: #667eea;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
  }

  .section-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .record-list, .fault-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .record-item {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .record-result {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .record-result.normal {
    background: #d1fae5;
    color: #065f46;
  }

  .record-result.abnormal {
    background: #fee2e2;
    color: #991b1b;
  }

  .record-time {
    font-size: 0.875rem;
    color: #64748b;
  }

  .record-notes {
    color: #475569;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }

  .record-operator {
    font-size: 0.875rem;
    color: #64748b;
  }

  .fault-item {
    display: block;
    padding: 1rem;
    background: #fef2f2;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .fault-item:hover {
    background: #fee2e2;
    transform: translateX(4px);
  }

  .fault-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .fault-status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-pending { background: #fee2e2; color: #991b1b; }
  .status-processing { background: #fef3c7; color: #92400e; }
  .status-completed { background: #d1fae5; color: #065f46; }

  .fault-time {
    font-size: 0.875rem;
    color: #64748b;
  }

  .fault-description {
    color: #1a202c;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .fault-repair {
    color: #475569;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
  }

  .fault-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.875rem;
    color: #64748b;
  }
</style>
