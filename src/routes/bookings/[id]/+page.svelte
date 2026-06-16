<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Timeline from '$lib/components/common/Timeline.svelte';
  import { bookings } from '$lib/stores/bookings';
  import { formatDate } from '$lib/storage';
  import { BOOKING_STATUS_LABELS, USERS } from '$lib/constants';
  
  $: booking = bookings.getById($page.params.id);
  
  let selectedStatus = '';
  let selectedHandler = '';
  let note = '';
  
  function handleUpdateStatus() {
    if (!booking || !selectedStatus || !selectedHandler) return;
    
    bookings.updateStatus(booking.id, selectedStatus as any, selectedHandler, note);
    
    selectedStatus = '';
    selectedHandler = '';
    note = '';
  }
  
  const statusOptions = [
    { value: 'confirmed', label: '确认预订' },
    { value: 'arrived', label: '客人到店' },
    { value: 'dining', label: '开始用餐' },
    { value: 'billing', label: '开始结账' },
    { value: 'completed', label: '完成' },
    { value: 'cancelled', label: '取消' }
  ];
</script>

<svelte:head>
  <title>预订详情 - 农家乐经营管理系统</title>
</svelte:head>

{#if booking}
  <div class="booking-detail">
    <div class="page-header">
      <div class="header-left">
        <a href="/bookings" class="back-link">← 返回列表</a>
        <h2 class="page-title">{booking.customer_name} 的预订</h2>
        <Badge 
          variant={booking.status === 'completed' ? 'success' : 
                   booking.status === 'cancelled' ? 'danger' : 
                   booking.status === 'pending' ? 'warning' : 'primary'}
        >
          {BOOKING_STATUS_LABELS[booking.status]}
        </Badge>
      </div>
    </div>
    
    <div class="detail-grid">
      <Card title="基本信息">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">客户姓名</div>
            <div class="info-value">{booking.customer_name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">联系电话</div>
            <div class="info-value">{booking.phone}</div>
          </div>
          <div class="info-item">
            <div class="info-label">包间号</div>
            <div class="info-value">{booking.room_number}</div>
          </div>
          <div class="info-item">
            <div class="info-label">预订时间</div>
            <div class="info-value">{formatDate(booking.booking_time)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">用餐人数</div>
            <div class="info-value">{booking.guest_count}人</div>
          </div>
          <div class="info-item">
            <div class="info-label">当前处理人</div>
            <div class="info-value">{booking.handler}</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">{formatDate(booking.created_at)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">更新时间</div>
            <div class="info-value">{formatDate(booking.updated_at)}</div>
          </div>
        </div>
      </Card>
      
      <Card title="状态流转记录">
        <Timeline items={booking.status_history} currentStatus={booking.status} />
      </Card>
    </div>
    
    {#if booking.status !== 'completed' && booking.status !== 'cancelled'}
      <Card title="更新状态">
        <div class="update-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">新状态</label>
              <select class="form-select" bind:value={selectedStatus}>
                <option value="">请选择状态</option>
                {#each statusOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">处理人</label>
              <select class="form-select" bind:value={selectedHandler}>
                <option value="">请选择处理人</option>
                <option value={USERS.BOSS}>{USERS.BOSS}</option>
                <option value={USERS.KITCHEN}>{USERS.KITCHEN}</option>
                <option value={USERS.MAID}>{USERS.MAID}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input type="text" class="form-input" bind:value={note} placeholder="可选备注信息" />
          </div>
          <Button variant="primary" fullWidth on:click={handleUpdateStatus}>
            更新状态
          </Button>
        </div>
      </Card>
    {/if}
  </div>
{:else}
  <div class="not-found">
    <p>预订不存在</p>
    <Button variant="primary" href="/bookings">返回列表</Button>
  </div>
{/if}

<style>
  .booking-detail {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-link {
    color: #92400E;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: #78350F;
  }

  .page-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #78350F;
    margin: 0;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .info-label {
    font-size: 0.75rem;
    color: #92400E;
  }

  .info-value {
    font-size: 1rem;
    font-weight: 500;
    color: #78350F;
  }

  .update-form {
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
    transition: border-color 0.2s;
  }

  .form-select:focus,
  .form-input:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .not-found {
    text-align: center;
    padding: 4rem;
    color: #92400E;
  }
</style>