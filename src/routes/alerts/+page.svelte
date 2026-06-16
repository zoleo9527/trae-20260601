<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Timeline from '$lib/components/common/Timeline.svelte';
  import { alerts, activeAlerts, resolvedAlerts } from '$lib/stores/alerts';
  import { procurements } from '$lib/stores/procurements';
  import { bookings } from '$lib/stores/bookings';
  import { accommodations } from '$lib/stores/accommodations';
  import { formatDate } from '$lib/storage';
  import { ALERT_SEVERITY_LABELS, ALERT_TYPE_LABELS, USERS, PROCUREMENT_STATUS_LABELS } from '$lib/constants';
  
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
  
  function getRelatedLink(alert: any) {
    if (!alert.related_id) return null;
    
    switch (alert.type) {
      case 'procurement':
        return `/procurement/${alert.related_id}`;
      case 'booking':
        return `/bookings/${alert.related_id}`;
      case 'accommodation':
        return `/accommodation/${alert.related_id}`;
      default:
        return null;
    }
  }
  
  function getRelatedEntity(alert: any) {
    if (!alert.related_id) return null;
    
    switch (alert.type) {
      case 'procurement': {
        const proc = procurements.getById(alert.related_id);
        if (!proc) return null;
        const lastStatus = proc.status_history[proc.status_history.length - 1];
        return {
          label: `采购单（${proc.items.length}项）`,
          status: PROCUREMENT_STATUS_LABELS[proc.status],
          statusVariant: proc.status === 'completed' ? 'success' : 
                         proc.status === 'rejected' ? 'danger' : 
                         proc.status === 'pending' ? 'warning' : 'primary',
          currentHandler: lastStatus?.handler || proc.applicant,
          lastAction: lastStatus?.note || '提交采购申请'
        };
      }
      case 'booking': {
        const booking = bookings.getById(alert.related_id);
        if (!booking) return null;
        const lastStatus = booking.status_history[booking.status_history.length - 1];
        return {
          label: `${booking.customer_name}的预订`,
          status: '',
          statusVariant: 'info',
          currentHandler: lastStatus?.handler || booking.handler,
          lastAction: lastStatus?.note || '创建预订'
        };
      }
      case 'accommodation': {
        const acc = accommodations.getById(alert.related_id);
        if (!acc) return null;
        return {
          label: `${acc.guest_name}入住${acc.room_number}`,
          status: '',
          statusVariant: 'info',
          currentHandler: acc.handler,
          lastAction: '办理入住'
        };
      }
      default:
        return null;
    }
  }
  
  function getLastHandler(alert: any) {
    if (alert.handlers && alert.handlers.length > 0) {
      return alert.handlers[alert.handlers.length - 1];
    }
    return null;
  }
</script>

<svelte:head>
  <title>异常提醒 - 农家乐经营管理系统</title>
</svelte:head>

<div class="alerts-page">
  <div class="page-header">
    <h2 class="page-title">异常提醒中心</h2>
    <div class="quick-links">
      <Button variant="outline" size="sm" href="/inventory">
        查看库存
      </Button>
      <Button variant="outline" size="sm" href="/procurement">
        查看采购
      </Button>
    </div>
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
        {@const relatedEntity = getRelatedEntity(alert)}
        {@const relatedLink = getRelatedLink(alert)}
        {@const lastHandler = getLastHandler(alert)}
        <div 
          class="alert-item"
          class:alert-active={alert.status === 'active'}
          class:alert-resolved={alert.status === 'resolved'}
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
              {#if relatedLink && relatedEntity}
                <a href={relatedLink} class="alert-link related-link">
                  {relatedEntity.label}
                  {#if relatedEntity.status}
                    <Badge variant={relatedEntity.statusVariant} size="sm">{relatedEntity.status}</Badge>
                  {/if}
                  →
                </a>
              {:else if alert.type === 'inventory'}
                <a href="/inventory" class="alert-link">查看库存 →</a>
              {:else}
                <span class="alert-link">无关联记录</span>
              {/if}
            </div>
            <span class="alert-time">{formatDate(alert.created_at)}</span>
          </div>
          <div class="alert-content">
            <h4 class="alert-title">{alert.title}</h4>
            <p class="alert-description">{alert.description}</p>
          </div>
          <div class="alert-footer">
            {#if relatedEntity && relatedEntity.currentHandler}
              <div class="alert-handler">
                <span class="handler-label">当前处理：</span>
                <span class="handler-name">{relatedEntity.currentHandler}</span>
                <span class="handler-action">- {relatedEntity.lastAction}</span>
              </div>
            {:else if lastHandler}
              <div class="alert-handler">
                <span class="handler-label">最近处理：</span>
                <span class="handler-name">{lastHandler.handler}</span>
                <span class="handler-action">- {lastHandler.action}</span>
                <span class="handler-time">{formatDate(lastHandler.created_at)}</span>
              </div>
            {:else if alert.status === 'active'}
              <div class="alert-handler">
                <span class="handler-label">待处理</span>
              </div>
            {/if}
            <div class="alert-actions">
              {#if alert.status === 'active'}
                <Button variant="outline" size="sm" on:click={() => selectedAlert = alert}>
                  处理异常
                </Button>
              {:else}
                <Badge variant="success" size="sm">已处理</Badge>
              {/if}
            </div>
          </div>
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
  
  .quick-links {
    display: flex;
    gap: 0.5rem;
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
    align-items: center;
    flex-wrap: wrap;
  }
  
  .alert-link {
    color: #92400E;
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 500;
    transition: color 0.2s;
  }
  
  .alert-link:hover {
    color: #78350F;
  }
  
  .related-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    background-color: white;
    border-radius: 0.25rem;
  }
  
  .related-link:hover {
    background-color: #FEF3C7;
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
  
  .alert-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding-top: 0.5rem;
    border-top: 1px dashed #FDE68A;
  }
  
  .alert-handler {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    flex-wrap: wrap;
  }
  
  .handler-label {
    color: #92400E;
  }
  
  .handler-name {
    font-weight: 600;
    color: #78350F;
  }
  
  .handler-action {
    color: #B45309;
  }
  
  .handler-time {
    color: #92400E;
    font-size: 0.7rem;
  }
  
  .alert-actions {
    display: flex;
    gap: 0.5rem;
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