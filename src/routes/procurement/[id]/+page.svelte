<script lang="ts">
  import { page } from '$app/stores';
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Timeline from '$lib/components/common/Timeline.svelte';
  import { procurements } from '$lib/stores/procurements';
  import { inventory } from '$lib/stores/inventory';
  import { formatDate } from '$lib/storage';
  import { PROCUREMENT_STATUS_LABELS, USERS } from '$lib/constants';
  import { goto } from '$app/navigation';
  
  $: procurement = procurements.getById($page.params.id);
  
  let selectedStatus = '';
  let selectedHandler = '';
  let note = '';
  
  function handleUpdateStatus() {
    if (!procurement || !selectedStatus || !selectedHandler) return;
    
    const approver = selectedStatus === 'approved' ? selectedHandler : undefined;
    procurements.updateStatus(
      procurement.id, 
      selectedStatus as any, 
      selectedHandler, 
      note,
      approver
    );
    
    if (selectedStatus === 'received') {
      procurement.items.forEach(item => {
        const invItem = $inventory.find(i => i.ingredient_name === item.ingredient_name);
        if (invItem) {
          inventory.updateQuantity(invItem.id, invItem.current_quantity + item.quantity);
        }
      });
      procurements.updateStatus(procurement.id, 'completed', '系统', '库存已自动更新');
    }
    
    selectedStatus = '';
    selectedHandler = '';
    note = '';
  }
  
  const statusActions = [
    { status: 'approved', label: '批准采购', handler: USERS.BOSS },
    { status: 'rejected', label: '拒绝采购', handler: USERS.BOSS },
    { status: 'purchasing', label: '开始采购', handler: USERS.KITCHEN },
    { status: 'received', label: '确认收货', handler: USERS.KITCHEN }
  ];
</script>

<svelte:head>
  <title>采购详情 - 农家乐经营管理系统</title>
</svelte:head>

{#if procurement}
  <div class="procurement-detail">
    <div class="page-header">
      <div class="header-left">
        <a href="/procurement" class="back-link">← 返回列表</a>
        <h2 class="page-title">采购申请详情</h2>
        <Badge 
          variant={procurement.status === 'completed' ? 'success' : 
                   procurement.status === 'rejected' ? 'danger' : 
                   procurement.status === 'pending' ? 'warning' : 'primary'}
        >
          {PROCUREMENT_STATUS_LABELS[procurement.status]}
        </Badge>
      </div>
    </div>
    
    <div class="detail-grid">
      <Card title="采购信息">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">申请人</div>
            <div class="info-value">{procurement.applicant}</div>
          </div>
          <div class="info-item">
            <div class="info-label">申请时间</div>
            <div class="info-value">{formatDate(procurement.apply_time)}</div>
          </div>
          {#if procurement.approver}
            <div class="info-item">
              <div class="info-label">审批人</div>
              <div class="info-value">{procurement.approver}</div>
            </div>
            <div class="info-item">
              <div class="info-label">审批时间</div>
              <div class="info-value">{formatDate(procurement.approve_time)}</div>
            </div>
          {/if}
        </div>
        
        <div class="items-section">
          <h4 class="items-title">采购清单</h4>
          <div class="items-list">
            {#each procurement.items as item}
              <div class="item-row">
                <span class="item-name">{item.ingredient_name}</span>
                <span class="item-quantity">{item.quantity}{item.unit}</span>
                {#if item.note}
                  <span class="item-note">{item.note}</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </Card>
      
      <Card title="状态流转">
        <Timeline items={procurement.status_history} currentStatus={procurement.status} />
      </Card>
    </div>
    
    {#if procurement.status !== 'completed' && procurement.status !== 'rejected'}
      <Card title="处理采购">
        <div class="action-buttons">
          {#each statusActions.filter(a => {
            if (procurement.status === 'pending') return a.status === 'approved' || a.status === 'rejected';
            if (procurement.status === 'approved') return a.status === 'purchasing';
            if (procurement.status === 'purchasing') return a.status === 'received';
            return false;
          }) as action}
            <Button 
              variant={action.status === 'rejected' ? 'danger' : 'primary'}
              on:click={() => {
                selectedStatus = action.status;
                selectedHandler = action.handler;
                handleUpdateStatus();
              }}
            >
              {action.label}
            </Button>
          {/each}
        </div>
        
        <div class="custom-action">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">自定义状态</label>
              <select class="form-select" bind:value={selectedStatus}>
                <option value="">请选择</option>
                {#each Object.entries(PROCUREMENT_STATUS_LABELS) as [key, label]}
                  <option value={key}>{label}</option>
                {/each}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">处理人</label>
              <select class="form-select" bind:value={selectedHandler}>
                <option value="">请选择</option>
                <option value={USERS.BOSS}>{USERS.BOSS}</option>
                <option value={USERS.KITCHEN}>{USERS.KITCHEN}</option>
                <option value={USERS.MAID}>{USERS.MAID}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input type="text" class="form-input" bind:value={note} placeholder="可选备注" />
          </div>
          <Button variant="secondary" fullWidth on:click={handleUpdateStatus}>
            更新状态
          </Button>
        </div>
      </Card>
    {/if}
  </div>
{:else}
  <div class="not-found">
    <p>采购不存在</p>
    <Button variant="primary" href="/procurement">返回列表</Button>
  </div>
{/if}

<style>
  .procurement-detail {
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
    margin-bottom: 1.5rem;
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

  .items-section {
    margin-top: 1rem;
  }

  .items-title {
    font-size: 1rem;
    font-weight: 600;
    color: #78350F;
    margin-bottom: 0.75rem;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    background-color: #FEF3C7;
    border-radius: 0.5rem;
  }

  .item-name {
    font-weight: 600;
    color: #78350F;
    min-width: 4rem;
  }

  .item-quantity {
    color: #92400E;
  }

  .item-note {
    font-size: 0.75rem;
    color: #B45309;
  }

  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .custom-action {
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

  .not-found {
    text-align: center;
    padding: 4rem;
    color: #92400E;
  }
</style>