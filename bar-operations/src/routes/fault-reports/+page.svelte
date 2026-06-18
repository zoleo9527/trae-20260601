<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();

  let filterStatus = $state(data.statusFilter);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN');
  }

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

  const filteredFaults = $derived(
    filterStatus === 'all'
      ? data.faults
      : data.faults.filter((f: any) => f.status === filterStatus)
  );
</script>

<svelte:head>
  <title>故障报修 - 科技馆展教管理系统</title>
</svelte:head>

<div class="fault-reports-page">
  <div class="page-header">
    <h1 class="page-title">故障报修</h1>
    <p class="page-subtitle">查看和管理所有故障报修工单</p>
  </div>

  <div class="filter-bar">
    <button
      class="filter-btn"
      class:active={filterStatus === 'all'}
      onclick={() => filterStatus = 'all'}
    >
      全部 ({data.faults.length})
    </button>
    <button
      class="filter-btn pending"
      class:active={filterStatus === 'pending'}
      onclick={() => filterStatus = 'pending'}
    >
      待接收 ({data.faults.filter((f: any) => f.status === 'pending').length})
    </button>
    <button
      class="filter-btn processing"
      class:active={filterStatus === 'processing'}
      onclick={() => filterStatus = 'processing'}
    >
      处理中 ({data.faults.filter((f: any) => f.status === 'processing').length})
    </button>
    <button
      class="filter-btn completed"
      class:active={filterStatus === 'completed'}
      onclick={() => filterStatus = 'completed'}
    >
      已完成 ({data.faults.filter((f: any) => f.status === 'completed').length})
    </button>
  </div>

  {#if filteredFaults.length === 0}
    <div class="empty-state">
      <div class="empty-icon">✅</div>
      <div class="empty-text">暂无故障报修</div>
    </div>
  {:else}
    <div class="fault-list">
      {#each filteredFaults as fault}
        <a href="/fault-reports/{fault.id}" class="fault-card">
          <div class="fault-header">
            <div class="fault-exhibit">
              <h3 class="fault-name">{fault.exhibit_name}</h3>
              <div class="fault-location">📍 {fault.exhibit_location}</div>
            </div>
            <span class="fault-status {statusColors[fault.status]}">
              {statusLabels[fault.status]}
            </span>
          </div>

          <div class="fault-description">
            {fault.description}
          </div>

          {#if fault.repair_notes}
            <div class="fault-repair">
              <strong>维修备注：</strong>{fault.repair_notes}
            </div>
          {/if}

          <div class="fault-footer">
            <div class="fault-meta">
              <span class="meta-item">
                <span class="meta-icon">👤</span>
                报修人：{fault.reporter_name}
              </span>
              {#if fault.assignee_name}
                <span class="meta-item">
                  <span class="meta-icon">🔧</span>
                  工程师：{fault.assignee_name}
                </span>
              {/if}
            </div>
            <div class="fault-time">
              {formatDate(fault.created_at)}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fault-reports-page {
    max-width: 1200px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a202c;
  }

  .page-subtitle {
    margin: 0;
    color: #64748b;
  }

  .filter-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #64748b;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    border-color: #667eea;
    color: #667eea;
  }

  .filter-btn.active {
    background: #667eea;
    border-color: #667eea;
    color: white;
  }

  .filter-btn.pending:hover, .filter-btn.pending.active {
    border-color: #ef4444;
    background: #ef4444;
    color: white;
  }

  .filter-btn.processing:hover, .filter-btn.processing.active {
    border-color: #f59e0b;
    background: #f59e0b;
    color: white;
  }

  .filter-btn.completed:hover, .filter-btn.completed.active {
    border-color: #10b981;
    background: #10b981;
    color: white;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    color: #64748b;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .fault-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .fault-card {
    display: block;
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    text-decoration: none;
    transition: all 0.2s;
  }

  .fault-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .fault-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .fault-exhibit {
    flex: 1;
  }

  .fault-name {
    margin: 0 0 0.25rem 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .fault-location {
    color: #64748b;
    font-size: 0.875rem;
  }

  .fault-status {
    padding: 0.5rem 1rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .status-pending {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-processing {
    background: #fef3c7;
    color: #92400e;
  }

  .status-completed {
    background: #d1fae5;
    color: #065f46;
  }

  .fault-description {
    color: #475569;
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  .fault-repair {
    background: #f0fdf4;
    color: #166534;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .fault-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }

  .fault-meta {
    display: flex;
    gap: 1.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .meta-icon {
    font-size: 1rem;
  }

  .fault-time {
    font-size: 0.875rem;
    color: #94a3b8;
  }
</style>
