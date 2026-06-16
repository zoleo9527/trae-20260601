<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { accommodations, checkedInAccommodations, checkedOutAccommodations } from '$lib/stores/accommodations';
  import { formatDate } from '$lib/storage';
  import { ACCOMMODATION_STATUS_LABELS } from '$lib/constants';
  
  let searchTerm = '';
  let statusFilter = '';
  
  $: filteredAccommodations = $accommodations.filter(accommodation => {
    const matchesSearch = accommodation.guest_name.includes(searchTerm) ||
                          accommodation.phone.includes(searchTerm) ||
                          accommodation.room_number.includes(searchTerm);
    const matchesStatus = !statusFilter || accommodation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
</script>

<svelte:head>
  <title>住宿登记 - 农家乐经营管理系统</title>
</svelte:head>

<div class="accommodation-page">
  <div class="page-header">
    <h2 class="page-title">住宿登记管理</h2>
    <Button variant="primary" href="/accommodation/new">
      登记入住
    </Button>
  </div>
  
  <div class="stats-grid">
    <Card padding hoverable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-active">🛏️</div>
        <div class="stat-content">
          <div class="stat-value">{ $checkedInAccommodations.length }</div>
          <div class="stat-label">当前入住</div>
        </div>
      </div>
    </Card>
    
    <Card padding hoverable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-completed">✅</div>
        <div class="stat-content">
          <div class="stat-value">{ $checkedOutAccommodations.length }</div>
          <div class="stat-label">已退房</div>
        </div>
      </div>
    </Card>
  </div>
  
  <Card>
    <div class="filters">
      <input 
        type="text" 
        placeholder="搜索客人姓名、电话或房间号..."
        class="search-input"
        bind:value={searchTerm}
      />
      <select class="status-select" bind:value={statusFilter}>
        <option value="">全部状态</option>
        {#each Object.entries(ACCOMMODATION_STATUS_LABELS) as [key, label]}
          <option value={key}>{label}</option>
        {/each}
      </select>
    </div>
    
    <div class="accommodation-list">
      {#each filteredAccommodations as accommodation}
        <div class="accommodation-item">
          <div class="accommodation-header">
            <div class="room-number">{accommodation.room_number}</div>
            <Badge 
              variant={accommodation.status === 'checked_out' ? 'success' : 'primary'}
            >
              {ACCOMMODATION_STATUS_LABELS[accommodation.status]}
            </Badge>
          </div>
          <div class="accommodation-details">
            <div class="guest-info">
              <span class="guest-name">{accommodation.guest_name}</span>
              <span class="guest-phone">{accommodation.phone}</span>
            </div>
            <div class="time-info">
              <div class="time-item">
                <span class="time-label">入住：</span>
                <span class="time-value">{formatDate(accommodation.check_in_time)}</span>
              </div>
              {#if accommodation.check_out_time}
                <div class="time-item">
                  <span class="time-label">退房：</span>
                  <span class="time-value">{formatDate(accommodation.check_out_time)}</span>
                </div>
              {/if}
            </div>
          </div>
          <div class="accommodation-actions">
            {#if accommodation.status === 'checked_in'}
              <Button 
                variant="success" 
                size="sm"
                on:click={() => accommodations.checkOut(accommodation.id)}
              >
                办理退房
              </Button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="empty-list">暂无住宿记录</div>
      {/each}
    </div>
  </Card>
</div>

<style>
  .accommodation-page {
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
    background-color: #DBEAFE;
  }

  .stat-icon-completed {
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

  .search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .search-input:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .status-select {
    padding: 0.75rem 1rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .accommodation-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .accommodation-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #FEF3C7;
    border-radius: 0.75rem;
  }

  .accommodation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .room-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: #78350F;
  }

  .accommodation-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .guest-info {
    display: flex;
    gap: 1rem;
  }

  .guest-name {
    font-weight: 600;
    color: #78350F;
  }

  .guest-phone {
    font-size: 0.875rem;
    color: #92400E;
  }

  .time-info {
    display: flex;
    gap: 1rem;
  }

  .time-item {
    display: flex;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .time-label {
    color: #92400E;
  }

  .time-value {
    color: #78350F;
  }

  .accommodation-actions {
    display: flex;
    justify-content: flex-end;
  }

  .empty-list {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }
</style>