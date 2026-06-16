<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { accommodations } from '$lib/stores/accommodations';
  import { USERS } from '$lib/constants';
  import { goto } from '$app/navigation';
  
  let guest_name = '';
  let phone = '';
  let room_number = '';
  let handler = USERS.MAID;
  
  function handleSubmit() {
    if (!guest_name || !phone || !room_number) {
      alert('请填写完整信息');
      return;
    }
    
    accommodations.add({
      guest_name,
      phone,
      room_number,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      status: 'checked_in',
      handler
    });
    
    goto('/accommodation');
  }
</script>

<svelte:head>
  <title>登记入住 - 农家乐经营管理系统</title>
</svelte:head>

<div class="new-accommodation">
  <div class="page-header">
    <a href="/accommodation" class="back-link">← 返回列表</a>
    <h2 class="page-title">登记入住</h2>
  </div>
  
  <Card>
    <form class="accommodation-form" on:submit|preventDefault={handleSubmit}>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">客人姓名 *</label>
          <input type="text" class="form-input" bind:value={guest_name} placeholder="请输入客人姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">联系电话 *</label>
          <input type="tel" class="form-input" bind:value={phone} placeholder="请输入联系电话" />
        </div>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">房间号 *</label>
          <input type="text" class="form-input" bind:value={room_number} placeholder="如：101" />
        </div>
        <div class="form-group">
          <label class="form-label">登记人</label>
          <select class="form-select" bind:value={handler}>
            <option value={USERS.MAID}>{USERS.MAID}</option>
            <option value={USERS.BOSS}>{USERS.BOSS}</option>
            <option value={USERS.KITCHEN}>{USERS.KITCHEN}</option>
          </select>
        </div>
      </div>
      
      <div class="form-actions">
        <Button variant="outline" href="/accommodation">取消</Button>
        <Button variant="primary" type="submit">登记入住</Button>
      </div>
    </form>
  </Card>
</div>

<style>
  .new-accommodation {
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

  .accommodation-form {
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