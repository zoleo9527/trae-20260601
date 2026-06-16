<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { bookings } from '$lib/stores/bookings';
  import { USERS } from '$lib/constants';
  import { goto } from '$app/navigation';
  
  let customer_name = '';
  let phone = '';
  let booking_time = '';
  let guest_count = 4;
  let room_number = '';
  let handler = USERS.BOSS;
  
  function handleSubmit() {
    if (!customer_name || !phone || !booking_time || !room_number) {
      alert('请填写完整信息');
      return;
    }
    
    bookings.add({
      customer_name,
      phone,
      booking_time: new Date(booking_time).toISOString(),
      guest_count,
      room_number,
      status: 'pending',
      handler
    });
    
    goto('/bookings');
  }
</script>

<svelte:head>
  <title>新建预订 - 农家乐经营管理系统</title>
</svelte:head>

<div class="new-booking">
  <div class="page-header">
    <a href="/bookings" class="back-link">← 返回列表</a>
    <h2 class="page-title">新建预订</h2>
  </div>
  
  <Card>
    <form class="booking-form" on:submit|preventDefault={handleSubmit}>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">客户姓名 *</label>
          <input type="text" class="form-input" bind:value={customer_name} placeholder="请输入客户姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">联系电话 *</label>
          <input type="tel" class="form-input" bind:value={phone} placeholder="请输入联系电话" />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">预订时间 *</label>
          <input type="datetime-local" class="form-input" bind:value={booking_time} />
        </div>
        <div class="form-group">
          <label class="form-label">用餐人数</label>
          <input type="number" class="form-input" bind:value={guest_count} min="1" max="50" />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">包间号 *</label>
          <input type="text" class="form-input" bind:value={room_number} placeholder="如：A101" />
        </div>
        <div class="form-group">
          <label class="form-label">处理人</label>
          <select class="form-select" bind:value={handler}>
            <option value={USERS.BOSS}>{USERS.BOSS}</option>
            <option value={USERS.KITCHEN}>{USERS.KITCHEN}</option>
            <option value={USERS.MAID}>{USERS.MAID}</option>
          </select>
        </div>
      </div>
      
      <div class="form-actions">
        <Button variant="outline" href="/bookings">取消</Button>
        <Button variant="primary" type="submit">创建预订</Button>
      </div>
    </form>
  </Card>
</div>

<style>
  .new-booking {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
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

  .booking-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  .form-input,
  .form-select {
    padding: 0.75rem 1rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
    transition: border-color 0.2s;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
</style>