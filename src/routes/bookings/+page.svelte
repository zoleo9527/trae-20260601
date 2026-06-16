<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { bookings } from '$lib/stores/bookings';
  import { formatDate } from '$lib/storage';
  import { BOOKING_STATUS_LABELS } from '$lib/constants';
  
  let searchTerm = '';
  let statusFilter = '';
  
  $: filteredBookings = $bookings.filter(booking => {
    const matchesSearch = booking.customer_name.includes(searchTerm) || 
                          booking.phone.includes(searchTerm) ||
                          booking.room_number.includes(searchTerm);
    const matchesStatus = !statusFilter || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
</script>

<svelte:head>
  <title>包间预订 - 农家乐经营管理系统</title>
</svelte:head>

<div class="bookings-page">
  <div class="page-header">
    <h2 class="page-title">包间预订管理</h2>
    <Button variant="primary" href="/bookings/new">
      新建预订
    </Button>
  </div>
  
  <Card>
    <div class="filters">
      <input 
        type="text" 
        placeholder="搜索客户姓名、电话或包间号..."
        class="search-input"
        bind:value={searchTerm}
      />
      <select class="status-select" bind:value={statusFilter}>
        <option value="">全部状态</option>
        {#each Object.entries(BOOKING_STATUS_LABELS) as [key, label]}
          <option value={key}>{label}</option>
        {/each}
      </select>
    </div>
    
    <table class="bookings-table">
      <thead>
        <tr>
          <th>客户姓名</th>
          <th>电话</th>
          <th>包间号</th>
          <th>预订时间</th>
          <th>人数</th>
          <th>状态</th>
          <th>处理人</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredBookings as booking}
          <tr>
            <td class="customer-name">{booking.customer_name}</td>
            <td class="phone">{booking.phone}</td>
            <td class="room-number">{booking.room_number}</td>
            <td class="booking-time">{formatDate(booking.booking_time)}</td>
            <td class="guest-count">{booking.guest_count}人</td>
            <td>
              <Badge 
                variant={booking.status === 'completed' ? 'success' : 
                         booking.status === 'cancelled' ? 'danger' : 
                         booking.status === 'pending' ? 'warning' : 'primary'}
                size="sm"
              >
                {BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
            </td>
            <td class="handler">{booking.handler}</td>
            <td class="actions">
              <a href="/bookings/{booking.id}" class="action-link">查看详情</a>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="8" class="empty-row">暂无预订记录</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Card>
</div>

<style>
  .bookings-page {
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
    transition: border-color 0.2s;
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
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .status-select:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .bookings-table {
    width: 100%;
    border-collapse: collapse;
  }

  .bookings-table th {
    background-color: #FEF3C7;
    color: #78350F;
    font-weight: 600;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 2px solid #FDE68A;
  }

  .bookings-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #FEF3C7;
    color: #92400E;
  }

  .bookings-table tr:hover {
    background-color: #FEF3C7;
  }

  .customer-name {
    font-weight: 600;
    color: #78350F;
  }

  .room-number {
    font-weight: 500;
  }

  .booking-time {
    font-size: 0.875rem;
  }

  .guest-count {
    text-align: center;
  }

  .handler {
    font-size: 0.875rem;
  }

  .actions {
    text-align: center;
  }

  .action-link {
    color: #F59E0B;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .action-link:hover {
    color: #D97706;
  }

  .empty-row {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }
</style>