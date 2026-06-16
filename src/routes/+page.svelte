<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { 
    bookings, 
    pendingBookings, 
    activeBookings, 
    completedBookings 
  } from '$lib/stores/bookings';
  import { 
    procurements, 
    pendingProcurements, 
    activeProcurements 
  } from '$lib/stores/procurements';
  import { accommodations, checkedInAccommodations } from '$lib/stores/accommodations';
  import { lowInventory } from '$lib/stores/inventory';
  import { activeAlerts, highSeverityAlerts } from '$lib/stores/alerts';
  import { formatDate } from '$lib/storage';
  import { BOOKING_STATUS_LABELS, PROCUREMENT_STATUS_LABELS } from '$lib/constants';
  
  const todoItems = [
    { label: '新建预订', path: '/bookings/new', icon: '📅' },
    { label: '新建采购', path: '/procurement/new', icon: '🥬' },
    { label: '登记入住', path: '/accommodation/new', icon: '🛏️' },
    { label: '查看异常', path: '/alerts', icon: '⚠️' }
  ];
</script>

<svelte:head>
  <title>首页 - 农家乐经营管理系统</title>
</svelte:head>

<div class="dashboard">
  <div class="dashboard-header">
    <h2 class="dashboard-title">流程概览</h2>
    <p class="dashboard-subtitle">实时追踪所有业务流程状态</p>
  </div>
  
  <div class="stats-grid">
    <Card padding hoverable clickable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-pending">📋</div>
        <div class="stat-content">
          <div class="stat-value">{ $pendingBookings.length + $pendingProcurements.length }</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
    </Card>
    
    <Card padding hoverable clickable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-active">🔄</div>
        <div class="stat-content">
          <div class="stat-value">{ $activeBookings.length + $activeProcurements.length }</div>
          <div class="stat-label">进行中</div>
        </div>
      </div>
    </Card>
    
    <Card padding hoverable clickable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-completed">✅</div>
        <div class="stat-content">
          <div class="stat-value">{ $completedBookings.length }</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </Card>
    
    <Card padding hoverable clickable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-alert">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{ $activeAlerts.length }</div>
          <div class="stat-label">异常</div>
        </div>
      </div>
    </Card>
  </div>
  
  <div class="dashboard-grid">
    <div class="dashboard-section">
      <Card title="待办事项" subtitle="需要您处理的任务">
        <div class="todo-list">
          {#each $pendingBookings as booking}
            <a href="/bookings/{booking.id}" class="todo-item">
              <div class="todo-icon">📅</div>
              <div class="todo-content">
                <div class="todo-title">{booking.customer_name} 的预订</div>
                <div class="todo-meta">
                  <Badge variant="warning" size="sm">{BOOKING_STATUS_LABELS[booking.status]}</Badge>
                  <span class="todo-handler">处理人：{booking.handler}</span>
                </div>
              </div>
              <div class="todo-time">{formatDate(booking.created_at)}</div>
            </a>
          {/each}
          
          {#each $pendingProcurements as procurement}
            <a href="/procurement/{procurement.id}" class="todo-item">
              <div class="todo-icon">🥬</div>
              <div class="todo-content">
                <div class="todo-title">采购申请（{procurement.items.length}项食材）</div>
                <div class="todo-meta">
                  <Badge variant="info" size="sm">{PROCUREMENT_STATUS_LABELS[procurement.status]}</Badge>
                  <span class="todo-handler">申请人：{procurement.applicant}</span>
                </div>
              </div>
              <div class="todo-time">{formatDate(procurement.apply_time)}</div>
            </a>
          {/each}
          
          {#if $pendingBookings.length === 0 && $pendingProcurements.length === 0}
            <div class="todo-empty">
              暂无待办事项
            </div>
          {/if}
        </div>
      </Card>
    </div>
    
    <div class="dashboard-section">
      <Card title="异常提醒" subtitle="需要立即处理的问题">
        <div class="alert-list">
          {#each $highSeverityAlerts.slice(0, 3) as alert}
            <a href="/alerts" class="alert-item">
              <div class="alert-icon alert-icon-{alert.severity}">⚠️</div>
              <div class="alert-content">
                <div class="alert-title">{alert.title}</div>
                <div class="alert-description">{alert.description}</div>
              </div>
              <Badge variant="danger" size="sm">紧急</Badge>
            </a>
          {/each}
          
          {#if $highSeverityAlerts.length === 0}
            <div class="alert-empty">
              暂无异常
            </div>
          {/if}
        </div>
        
        <div slot="footer" class="alert-footer">
          <a href="/alerts" class="alert-link">
            { $activeAlerts.length > 0 ? `查看全部 ${$activeAlerts.length} 条异常 →` : '查看异常中心 →' }
          </a>
        </div>
      </Card>
      
      <Card title="快捷操作" subtitle="快速创建新记录">
        <div class="quick-actions">
          {#each todoItems as item}
            <a href={item.path} class="quick-action">
              <div class="quick-action-icon">{item.icon}</div>
              <div class="quick-action-label">{item.label}</div>
            </a>
          {/each}
        </div>
      </Card>
    </div>
  </div>
  
  <div class="dashboard-grid">
    <Card title="当前入住" subtitle="正在入住的客人">
      <div class="accommodation-list">
        {#each $checkedInAccommodations.slice(0, 5) as accommodation}
          <div class="accommodation-item">
            <div class="accommodation-room">{accommodation.room_number}</div>
            <div class="accommodation-guest">{accommodation.guest_name}</div>
            <div class="accommodation-time">
              入住：{formatDate(accommodation.check_in_time)}
            </div>
          </div>
        {/each}
        
        {#if $checkedInAccommodations.length === 0}
          <div class="accommodation-empty">
            暂无入住客人
          </div>
        {/if}
      </div>
    </Card>
    
    <Card title="库存预警" subtitle="库存不足的食材">
      <div class="inventory-list">
        {#each $lowInventory.slice(0, 5) as item}
          <a href="/inventory" class="inventory-item">
            <div class="inventory-name">{item.ingredient_name}</div>
            <div class="inventory-quantity">
              <span class="inventory-current">{item.current_quantity}{item.unit}</span>
              <span class="inventory-threshold">预警：{item.warning_threshold}{item.unit}</span>
            </div>
            <Badge variant="danger" size="sm">不足</Badge>
          </a>
        {/each}
        
        {#if $lowInventory.length === 0}
          <div class="inventory-empty">
            库存充足
          </div>
        {/if}
      </div>
      
      <div slot="footer" class="inventory-footer">
        <a href="/inventory" class="inventory-link">
          { $lowInventory.length > 0 ? '查看全部库存和采购建议 →' : '查看库存预估 →' }
        </a>
      </div>
    </Card>
  </div>
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .dashboard-header {
    margin-bottom: 1rem;
  }

  .dashboard-title {
    font-size: 2rem;
    font-weight: 700;
    color: #78350F;
    margin: 0;
  }

  .dashboard-subtitle {
    font-size: 1rem;
    color: #92400E;
    margin-top: 0.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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

  .stat-icon-pending {
    background-color: #FED7AA;
  }

  .stat-icon-active {
    background-color: #DBEAFE;
  }

  .stat-icon-completed {
    background-color: #D1FAE5;
  }

  .stat-icon-alert {
    background-color: #FEE2E2;
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

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .dashboard-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background-color: #FEF3C7;
    border-radius: 0.5rem;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .todo-item:hover {
    background-color: #FDE68A;
    transform: translateX(4px);
  }

  .todo-icon {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .todo-content {
    flex: 1;
  }

  .todo-title {
    font-weight: 600;
    color: #78350F;
    margin-bottom: 0.25rem;
  }

  .todo-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .todo-handler {
    font-size: 0.75rem;
    color: #92400E;
  }

  .todo-time {
    font-size: 0.75rem;
    color: #B45309;
  }

  .todo-empty {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }

  .alert-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .alert-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background-color: #FEE2E2;
    border-radius: 0.5rem;
    border-left: 3px solid #EF4444;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .alert-item:hover {
    background-color: #FECACA;
    transform: translateX(4px);
  }

  .alert-icon {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
  }

  .alert-content {
    flex: 1;
  }

  .alert-title {
    font-weight: 600;
    color: #991B1B;
    margin-bottom: 0.25rem;
  }

  .alert-description {
    font-size: 0.75rem;
    color: #7F1D1D;
  }

  .alert-empty {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }

  .alert-footer {
    text-align: center;
  }

  .alert-link {
    color: #92400E;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .alert-link:hover {
    color: #78350F;
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .quick-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background-color: #FEF3C7;
    border-radius: 0.75rem;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .quick-action:hover {
    background-color: #FDE68A;
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  }

  .quick-action-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .quick-action-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #78350F;
  }

  .accommodation-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .accommodation-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background-color: #FEF3C7;
    border-radius: 0.5rem;
  }

  .accommodation-room {
    font-weight: 600;
    color: #78350F;
    min-width: 3rem;
  }

  .accommodation-guest {
    flex: 1;
    color: #92400E;
  }

  .accommodation-time {
    font-size: 0.75rem;
    color: #B45309;
  }

  .accommodation-empty {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }

  .inventory-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .inventory-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background-color: #FEE2E2;
    border-radius: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }
  
  .inventory-item:hover {
    background-color: #FECACA;
    transform: translateX(4px);
  }

  .inventory-name {
    font-weight: 600;
    color: #78350F;
    min-width: 4rem;
  }

  .inventory-quantity {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .inventory-current {
    font-weight: 600;
    color: #991B1B;
  }

  .inventory-threshold {
    font-size: 0.75rem;
    color: #7F1D1D;
  }

  .inventory-empty {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }

  .inventory-footer {
    text-align: center;
  }

  .inventory-link {
    color: #92400E;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .inventory-link:hover {
    color: #78350F;
  }
</style>