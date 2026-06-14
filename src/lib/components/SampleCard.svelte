<script>
  import { createEventDispatcher } from 'svelte';
  import { statusLabels, statusColors, priorityLabels, priorityColors } from '$lib/api.js';

  export let sample;

  const dispatch = createEventDispatcher();

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function handleClick() {
    dispatch('select', sample);
  }
</script>

<div class="sample-card" on:click={handleClick}>
  <div class="card-header">
    <span class="case-number">{sample.case_number}</span>
    <span 
      class="priority-badge"
      style="background: {priorityColors[sample.priority]}"
    >
      {priorityLabels[sample.priority]}
    </span>
  </div>

  <h3 class="case-name">{sample.case_name}</h3>

  <div class="card-body">
    <div class="info-row">
      <span class="label">委托人：</span>
      <span class="value">{sample.client_name || '-'}</span>
    </div>
    <div class="info-row">
      <span class="label">样本类型：</span>
      <span class="value">{sample.sample_type}</span>
    </div>
    <div class="info-row">
      <span class="label">样本数量：</span>
      <span class="value">{sample.sample_count} 份</span>
    </div>
    <div class="info-row">
      <span class="label">分配鉴定人：</span>
      <span class="value">{sample.appraiser_name || '未分配'}</span>
    </div>
  </div>

  <div class="card-footer">
    <span 
      class="status-badge"
      style="background: {statusColors[sample.reception_status]}"
    >
      {statusLabels[sample.reception_status]}
    </span>
    <span class="due-date">截止：{formatDate(sample.due_date)}</span>
  </div>
</div>

<style>
  .sample-card {
    background: white;
    border-radius: 10px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: all 0.3s;
    border-left: 4px solid transparent;
  }

  .sample-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
    border-left-color: #409EFF;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .case-number {
    font-family: monospace;
    font-size: 0.9rem;
    color: #409EFF;
    font-weight: 600;
  }

  .priority-badge {
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .case-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 1rem 0;
    line-height: 1.4;
  }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .info-row {
    display: flex;
    font-size: 0.9rem;
  }

  .label {
    color: #666;
    min-width: 90px;
  }

  .value {
    color: #333;
    font-weight: 500;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid #eee;
  }

  .status-badge {
    color: white;
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .due-date {
    font-size: 0.8rem;
    color: #999;
  }
</style>
