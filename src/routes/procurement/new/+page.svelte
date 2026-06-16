<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { procurements } from '$lib/stores/procurements';
  import { USERS } from '$lib/constants';
  import { goto } from '$app/navigation';
  
  let applicant = USERS.KITCHEN;
  let items: Array<{ ingredient_name: string; quantity: number; unit: string; note: string }> = [
    { ingredient_name: '', quantity: 1, unit: '斤', note: '' }
  ];
  
  function addItem() {
    items = [...items, { ingredient_name: '', quantity: 1, unit: '斤', note: '' }];
  }
  
  function removeItem(index: number) {
    items = items.filter((_, i) => i !== index);
  }
  
  function handleSubmit() {
    const validItems = items.filter(item => item.ingredient_name && item.quantity > 0);
    if (validItems.length === 0) {
      alert('请至少添加一项采购食材');
      return;
    }
    
    procurements.add({
      applicant,
      apply_time: new Date().toISOString(),
      approver: null,
      approve_time: null,
      status: 'pending',
      items: validItems.map(item => ({
        ...item,
        id: '',
        procurement_id: ''
      }))
    });
    
    goto('/procurement');
  }
</script>

<svelte:head>
  <title>新建采购 - 农家乐经营管理系统</title>
</svelte:head>

<div class="new-procurement">
  <div class="page-header">
    <a href="/procurement" class="back-link">← 返回列表</a>
    <h2 class="page-title">新建采购申请</h2>
  </div>
  
  <Card>
    <form class="procurement-form" on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label class="form-label">申请人</label>
        <select class="form-select" bind:value={applicant}>
          <option value={USERS.KITCHEN}>{USERS.KITCHEN}</option>
          <option value={USERS.BOSS}>{USERS.BOSS}</option>
          <option value={USERS.MAID}>{USERS.MAID}</option>
        </select>
      </div>
      
      <div class="items-section">
        <h4 class="items-title">采购清单</h4>
        {#each items as item, i}
          <div class="item-row">
            <input 
              type="text" 
              class="item-input"
              bind:value={item.ingredient_name}
              placeholder="食材名称"
            />
            <input 
              type="number" 
              class="item-input item-quantity"
              bind:value={item.quantity}
              min="1"
              placeholder="数量"
            />
            <select class="item-select" bind:value={item.unit}>
              <option value="斤">斤</option>
              <option value="个">个</option>
              <option value="块">块</option>
              <option value="袋">袋</option>
              <option value="箱">箱</option>
            </select>
            <input 
              type="text" 
              class="item-input item-note"
              bind:value={item.note}
              placeholder="备注（可选）"
            />
            {#if items.length > 1}
              <button class="remove-btn" on:click={() => removeItem(i)}>✕</button>
            {/if}
          </div>
        {/each}
        <Button variant="outline" size="sm" on:click={addItem}>
          + 添加食材
        </Button>
      </div>
      
      <div class="form-actions">
        <Button variant="outline" href="/procurement">取消</Button>
        <Button variant="primary" type="submit">提交申请</Button>
      </div>
    </form>
  </Card>
</div>

<style>
  .new-procurement {
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

  .procurement-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

  .form-select {
    padding: 0.75rem 1rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .form-select:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .items-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .items-title {
    font-size: 1rem;
    font-weight: 600;
    color: #78350F;
  }

  .item-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .item-input {
    padding: 0.5rem 0.75rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .item-input:focus {
    outline: none;
    border-color: #F59E0B;
  }

  .item-input:first-child {
    flex: 1;
  }

  .item-quantity {
    width: 5rem;
  }

  .item-select {
    padding: 0.5rem 0.75rem;
    border: 2px solid #FDE68A;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #78350F;
    background-color: white;
  }

  .item-note {
    flex: 1;
  }

  .remove-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #FEE2E2;
    border: none;
    border-radius: 0.5rem;
    color: #DC2626;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .remove-btn:hover {
    background-color: #FECACA;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
</style>