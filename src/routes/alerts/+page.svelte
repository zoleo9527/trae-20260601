<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Timeline from '$lib/components/common/Timeline.svelte';
  import { alerts, activeAlerts, resolvedAlerts } from '$lib/stores/alerts';
  import { formatDate } from '$lib/storage';
  import { ALERT_SEVERITY_LABELS, ALERT_TYPE_LABELS, USERS } from '$lib/constants';
  
  let severityFilter = '';
  let typeFilter = '';
  let statusFilter = 'active';
  
  $: filteredAlerts = $alerts.filter(alert => {
    const matchesSeverity = !severityFilter || alert.severity === severityFilter;
    const matchesType = !typeFilter || alert.type === typeFilter;
    const matchesStatus = !statusFilter || alert.status === statusFilter;
    return matchesSeverity && matchesType && matchesStatus;
  });
  
  let selectedAlert: any = null;
  let handler = USERS.BOSS;
  let action = '';
  
  function handleResolve() {
    if (!selectedAlert || !handler || !action) {
      alert('请填写处理人和处理措施');
      return;
    }
    
    alerts.resolve(selectedAlert.id, handler, action);
    selectedAlert = null;
    handler = USERS.BOSS;
    action = '';
  }
</script>

<svelte:head>
  <title>异常提醒 - 农家乐经营管理系统</title>
</svelte:head>

<div class="alerts-page">
  <div class="page-header">
    <h2 class="page-title">异常提醒中心</h2>
  </div>
  
  <div class="stats-grid">
    <Card padding hoverable clickable on:click={() => statusFilter = 'active'}>
      <div class="stat-card">
        <div class="stat-icon stat-icon-active">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{ $activeAlerts.length }</div>
          <div class="stat-label">待处理异常</div>
        </div>
      </div>
    </Card>
    
    <Card padding hoverable clickable on:click={() => statusFilter = 'resolved'}>
      <div class="stat-card">
        <div class="stat-icon stat-icon-resolved">✅</div>
        <div class="stat-content">
          <div class="stat-value">{ $resolvedAlerts.length }</div>
          <div class="stat-label">已处理异常</div>
        </div>
      </div>
    </Card>
  </div>
  
  <Card>
    <div class="filters">
      <select class="filter-select" bind:value={statusFilter}>
        <option value="">全部状态</option>
        <option value="active">待处理</option>
        <option value="resolved">已处理</option>
      </select>
      <select class="filter-select" bind:value={severityFilter}>
        <option value="">全部严重程度</option>
        {#each Object.entries(ALERT_SEVERITY_LABELS) as [key, label]}
          <option value={key}>{label}</option>
        {/each}
      </select>
      <select class="filter-select" bind:value={typeFilter}>
        <option value="">全部类型</option>
        {#each Object.entries(ALERT_TYPE_LABELS) as [key, label]}
          <option value={key}>{label}</option>
        {/each}
      </select>
    </div>
    
    <div class="alerts-list">
      {#each filteredAlerts as alert}
        <div 
          class="alert-item"
          class:alert-active={alert.status === 'active'}
          class:alert-resolved={alert.status === 'resolved'}
          on:click={() => selectedAlert = alert}
        >
          <div class="alert-header">
            <div class="alert-info">
              <Badge 
                variant={alert.severity === 'high' ? 'danger' : 
                         alert.severity === 'medium' ? 'warning' : 'info'}
                size="sm"
              >
                {ALERT_SEVERITY_LABELS[alert.severity]}
              </Badge>
              <Badge variant="secondary" size="sm">{ALERT_TYPE_LABELS[alert.type]}</Badge>
            </div>
            <span class="alert-time">{formatDate(alert.created_at)}</span>
          </div>
          <div class="alert-content">
            <h4 class="alert-title">{alert.title}</h4>
            <p class="alert-description">{alert.description}</p>
          </div>
          {#if alert.status === 'resolved'}
            <div class="alert-resolution">
              <span class="resolution-handler">处理人：{alert.handlers[alert.handlers.length - 1]?.handler}</span>
              <span class="resolution-action">{alert.handlers[alert.handlers.length - 1]?.action}</span>
            </div>
          {/if}
        </div>
      {:else}
        <div class="empty-list">暂无异常记录</div>
      {/each}
    </div>
  </Card>
  
  {#if selectedAlert && selectedAlert.status === 'active'}
    <Card title="处理异常">
      <div class="selected-alert">
        <h4 class="selected-title">{selectedAlert.title}</h4>
        <p class="selected-description">{selectedAlert.description}</p>
      </div>
      
      <div class="resolve-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">处理人</label>
            <select class="form-select" bind:value={handler}>
              <option value={USERS.BOSS}>{USERS.BOSS}</option>
              <option value={USERS.KITCHEN}>{USERS.KITCHEN}</option>
              <option value={USERS.MAID}>{USERS.MAID}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">处理措施</label>
            <input 
              type="text" 
              class="form-input"
              bind:value={action}
              placeholder="请输入处理措施"
            />
          </div>
        </div>
        <div class="form-actions">
          <Button variant="outline" on:click={() => selectedAlert = null}>取消</Button>
          <Button variant="success" on:click={handleResolve}>处理完成</Button>
        </div>
      </div>
    </Card>
  {/if}
</div>

<style>
  .alerts-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #78350F;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .stat-icon {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1.5rem;
  }

  .stat-icon-active {
    background-color: #FEE2E2;
  }

  .stat-icon-resolved {
    background-color: #D1FAE5;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #78350F;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #92400E;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .filter-select {
    padding: 0.75rem 1rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .alerts-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .alert-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .alert-active {
    background-color: #FEE2E2;
    border-left: 3px solid #EF4444;
  }

  .alert-active:hover {
    background-color: #FECACA;
  }

  .alert-resolved {
    background-color: #D1FAE5;
    border-left: 3px solid #10B981;
  }

  .alert-resolved:hover {
    background-color: #A7F3D0;
  }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .alert-info {
    display: flex;
    gap: 0.5rem;
  }

  .alert-time {
    font-size: 0.75rem;
    color: #92400E;
  }

  .alert-content {
    flex: 1;
  }

  .alert-title {
    font-size: 1rem;
    font-weight: 600;
    color: #78350F;
    margin: 0 0 0.25rem 0;
  }

  .alert-description {
    font-size: 0.875rem;
    color: #92400E;
    margin: 0;
  }

  .alert-resolution {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #065F46;
  }

  .empty-list {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }

  .selected-alert {
    padding: 1rem;
    background-color: #FEE2E2;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
  }

  .selected-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #991B1B;
    margin: 0 0 0.5rem 0;
  }

  .selected-description {
    font-size: 0.875rem;
    color: #7F1D1D;
    margin: 0;
  }

  .resolve-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #78350F;
  }

  .form-select,
  .form-input {
    padding: 0.75rem 1rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .form-select:focus,
  .form-input:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
  }
</style>