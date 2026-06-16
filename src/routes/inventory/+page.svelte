<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { inventory, lowInventory, inventoryEstimates } from '$lib/stores/inventory';
  import { procurements } from '$lib/stores/procurements';
  import { formatDate } from '$lib/storage';
  import { PROCUREMENT_STATUS_LABELS } from '$lib/constants';
  
  let editingId = '';
  let editQuantity = 0;
  
  function startEdit(item: any) {
    editingId = item.id;
    editQuantity = item.current_quantity;
  }
  
  function saveEdit() {
    if (editingId) {
      inventory.updateQuantity(editingId, editQuantity);
      editingId = '';
      editQuantity = 0;
    }
  }
  
  function cancelEdit() {
    editingId = '';
    editQuantity = 0;
  }
  
  function getRelatedProcurements(ingredientName: string) {
    const allProc = $procurements;
    return allProc
      .filter(proc => proc.items.some(item => item.ingredient_name === ingredientName))
      .sort((a, b) => new Date(b.apply_time).getTime() - new Date(a.apply_time).getTime())
      .slice(0, 2);
  }
  
  function getProcurementStatusVariant(status: string) {
    switch (status) {
      case 'completed':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'purchasing':
        return 'info';
      default:
        return 'primary';
    }
  }
</script>

<svelte:head>
  <title>库存预估 - 农家乐经营管理系统</title>
</svelte:head>

<div class="inventory-page">
  <div class="page-header">
    <h2 class="page-title">库存预估管理</h2>
    <Button variant="primary" href="/procurement/new">
      新建采购申请
    </Button>
  </div>
  
  <div class="stats-grid">
    <Card padding hoverable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-total">📦</div>
        <div class="stat-content">
          <div class="stat-value">{ $inventory.length }</div>
          <div class="stat-label">食材种类</div>
        </div>
      </div>
    </Card>
    
    <Card padding hoverable>
      <div class="stat-card">
        <div class="stat-icon stat-icon-warning">⚠️</div>
        <div class="stat-content">
          <div class="stat-value">{ $lowInventory.length }</div>
          <div class="stat-label">库存不足</div>
        </div>
      </div>
    </Card>
  </div>
  
  <div class="inventory-grid">
    <Card title="库存盘点">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>食材名称</th>
            <th>当前库存</th>
            <th>预警阈值</th>
            <th>状态</th>
            <th>最近采购</th>
            <th>最后更新</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each $inventory as item}
            {@const relatedProcs = getRelatedProcurements(item.ingredient_name)}
            <tr class:row-warning={item.current_quantity <= item.warning_threshold}>
              <td class="item-name">{item.ingredient_name}</td>
              <td class="item-quantity">
                {#if editingId === item.id}
                  <input 
                    type="number" 
                    class="edit-input"
                    bind:value={editQuantity}
                    min="0"
                  />
                {:else}
                  {item.current_quantity}{item.unit}
                {/if}
              </td>
              <td class="threshold">{item.warning_threshold}{item.unit}</td>
              <td>
                {#if item.current_quantity <= item.warning_threshold}
                  <Badge variant="danger" size="sm">不足</Badge>
                {:else}
                  <Badge variant="success" size="sm">充足</Badge>
                {/if}
              </td>
              <td class="procurement-cell">
                {#if relatedProcs.length > 0}
                  {#each relatedProcs as proc}
                    <div class="procurement-item">
                      <a href="/procurement/{proc.id}" class="procurement-link">
                        {PROCUREMENT_STATUS_LABELS[proc.status]}
                      </a>
                      <Badge variant={getProcurementStatusVariant(proc.status)} size="sm">
                        {proc.status === 'completed' ? '已完成' : 
                         proc.status === 'rejected' ? '已拒绝' :
                         proc.status === 'pending' ? '待审批' :
                         proc.status === 'purchasing' ? '采购中' : '收货'}
                      </Badge>
                    </div>
                  {/each}
                {:else}
                  <span class="no-procurement">暂无采购</span>
                {/if}
              </td>
              <td class="time">{formatDate(item.last_updated)}</td>
              <td class="actions">
                {#if editingId === item.id}
                  <button class="save-btn" on:click={saveEdit}>保存</button>
                  <button class="cancel-btn" on:click={cancelEdit}>取消</button>
                {:else}
                  <button class="edit-btn" on:click={() => startEdit(item)}>编辑</button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </Card>
    
    <Card title="采购建议">
      <div class="suggestions-list">
        {#each $inventoryEstimates as estimate}
          {@const relatedProcs = getRelatedProcurements(estimate.ingredient_name)}
          {@const activeProc = relatedProcs.find(p => ['pending', 'approved', 'purchasing'].includes(p.status))}
          {@const inventoryItem = inventory.getByIngredientName(estimate.ingredient_name)}
          <div class="suggestion-item">
            <div class="suggestion-header">
              <span class="suggestion-name">{estimate.ingredient_name}</span>
              <Badge variant="warning" size="sm">建议采购</Badge>
            </div>
            <div class="suggestion-details">
              <div class="suggestion-quantity">
                建议采购：<strong>{estimate.estimated_consumption}{inventoryItem?.unit || '斤'}</strong>
              </div>
              <div class="suggestion-reason">{estimate.reason}</div>
            </div>
            {#if activeProc}
              <div class="active-procurement">
                <a href="/procurement/{activeProc.id}" class="active-proc-link">
                  已有采购进行中 →
                </a>
                <Badge variant={getProcurementStatusVariant(activeProc.status)} size="sm">
                  {PROCUREMENT_STATUS_LABELS[activeProc.status]}
                </Badge>
              </div>
            {:else}
              <a href="/procurement/new?ingredient={encodeURIComponent(estimate.ingredient_name)}&quantity={estimate.estimated_consumption}&unit={encodeURIComponent(inventoryItem?.unit || '斤')}" class="suggestion-action">
                创建采购单 →
              </a>
            {/if}
          </div>
        {:else}
          <div class="empty-suggestions">
            库存充足，暂无采购建议
          </div>
        {/each}
      </div>
    </Card>
  </div>
</div>

<style>
  .inventory-page {
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

  .stat-icon-total {
    background-color: #DBEAFE;
  }

  .stat-icon-warning {
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

  .inventory-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
  }

  .inventory-table {
    width: 100%;
    border-collapse: collapse;
  }

  .inventory-table th {
    background-color: #FEF3C7;
    color: #78350F;
    font-weight: 600;
    padding: 0.75rem;
    text-align: left;
    border-bottom: 2px solid #FDE68A;
  }

  .inventory-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #FEF3C7;
    color: #92400E;
  }
  
  .procurement-cell {
    max-width: 150px;
  }
  
  .procurement-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .procurement-item:last-child {
    margin-bottom: 0;
  }
  
  .procurement-link {
    color: #92400E;
    text-decoration: none;
    font-size: 0.75rem;
    font-weight: 500;
    transition: color 0.2s;
  }
  
  .procurement-link:hover {
    color: #78350F;
  }
  
  .no-procurement {
    font-size: 0.75rem;
    color: #B45309;
    font-style: italic;
  }

  .row-warning {
    background-color: #FEE2E2;
  }

  .item-name {
    font-weight: 600;
    color: #78350F;
  }

  .edit-input {
    padding: 0.25rem 0.5rem;
    border: 2px solid #F59E0B;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    width: 5rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-btn,
  .save-btn,
  .cancel-btn {
    padding: 0.25rem 0.75rem;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .edit-btn {
    background-color: #FDE68A;
    color: #78350F;
  }

  .edit-btn:hover {
    background-color: #F59E0B;
  }

  .save-btn {
    background-color: #10B981;
    color: white;
  }

  .save-btn:hover {
    background-color: #059669;
  }

  .cancel-btn {
    background-color: #FEE2E2;
    color: #DC2626;
  }

  .cancel-btn:hover {
    background-color: #FECACA;
  }

  .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .suggestion-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background-color: #FED7AA;
    border-radius: 0.5rem;
  }
  
  .suggestion-action {
    color: #92400E;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.2s;
  }
  
  .suggestion-action:hover {
    color: #78350F;
  }
  
  .active-procurement {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: #DBEAFE;
    border-radius: 0.25rem;
    margin-top: 0.25rem;
  }
  
  .active-proc-link {
    color: #1E40AF;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.2s;
  }
  
  .active-proc-link:hover {
    color: #1E3A8A;
  }

  .suggestion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .suggestion-name {
    font-weight: 600;
    color: #78350F;
  }

  .suggestion-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .suggestion-quantity {
    font-size: 0.875rem;
    color: #92400E;
  }

  .suggestion-reason {
    font-size: 0.75rem;
    color: #B45309;
  }

  .empty-suggestions {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }
</style>