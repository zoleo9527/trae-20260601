<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();

  let filterStatus = $state('all');

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

  const filteredExhibits = $derived(
    filterStatus === 'all'
      ? data.exhibits
      : data.exhibits.filter((e: any) => e.status === filterStatus)
  );
</script>

<svelte:head>
  <title>展项管理 - 科技馆展教管理系统</title>
</svelte:head>

<div class="exhibits-page">
  <div class="page-header">
    <h1 class="page-title">展项管理</h1>
    <div class="filter-group">
      <button
        class="filter-btn"
        class:active={filterStatus === 'all'}
        onclick={() => filterStatus = 'all'}
      >
        全部
      </button>
      <button
        class="filter-btn"
        class:active={filterStatus === 'normal'}
        onclick={() => filterStatus = 'normal'}
      >
        正常
      </button>
      <button
        class="filter-btn"
        class:active={filterStatus === 'fault_pending'}
        onclick={() => filterStatus = 'fault_pending'}
      >
        故障
      </button>
      <button
        class="filter-btn"
        class:active={filterStatus === 'repairing'}
        onclick={() => filterStatus = 'repairing'}
      >
        维修中
      </button>
    </div>
  </div>

  <div class="exhibits-grid">
    {#each filteredExhibits as exhibit}
      <div class="exhibit-card">
        <div class="exhibit-header">
          <h3 class="exhibit-name">{exhibit.name}</h3>
          <span class="exhibit-status {statusColors[exhibit.status]}">
            {statusLabels[exhibit.status]}
          </span>
        </div>

        <div class="exhibit-location">
          <span class="location-icon">📍</span>
          {exhibit.location}
        </div>

        {#if exhibit.fault_count > 0}
          <div class="fault-warning">
            ⚠️ 有 {exhibit.fault_count} 条未完成故障
          </div>
        {/if}

        <div class="exhibit-actions">
          <a href="/exhibits/{exhibit.id}" class="action-btn view">
            查看详情
          </a>
          <a href="/inspection?exhibit_id={exhibit.id}" class="action-btn inspect">
            提交巡检
          </a>
        </div>
      </div>
    {/each}
  </div>

  {#if filteredExhibits.length === 0}
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-text">暂无展项</div>
    </div>
  {/if}
</div>

<style>
  .exhibits-page {
    max-width: 1400px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .page-title {
    margin: 0;
    font-size: 2rem;
    color: #1a202c;
  }

  .filter-group {
    display: flex;
    gap: 0.5rem;
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

  .exhibits-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .exhibit-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
  }

  .exhibit-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .exhibit-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .exhibit-name {
    margin: 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .exhibit-status {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-normal {
    background: #d1fae5;
    color: #065f46;
  }

  .status-inspecting {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-fault {
    background: #fee2e2;
    color: #991b1b;
  }

  .status-repairing {
    background: #fef3c7;
    color: #92400e;
  }

  .exhibit-location {
    color: #64748b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .location-icon {
    font-size: 1.25rem;
  }

  .fault-warning {
    background: #fef2f2;
    color: #991b1b;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .exhibit-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1;
    padding: 0.75rem;
    border-radius: 8px;
    text-align: center;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;
  }

  .action-btn.view {
    background: #f1f5f9;
    color: #475569;
  }

  .action-btn.view:hover {
    background: #e2e8f0;
  }

  .action-btn.inspect {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .action-btn.inspect:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-text {
    font-size: 1.125rem;
  }
</style>
