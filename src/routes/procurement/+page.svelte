<script lang="ts">
  import Card from '$lib/components/common/Card.svelte';
  import Badge from '$lib/components/common/Badge.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import { procurements } from '$lib/stores/procurements';
  import { formatDate } from '$lib/storage';
  import { PROCUREMENT_STATUS_LABELS } from '$lib/constants';
  
  let searchTerm = '';
  let statusFilter = '';
  
  $: filteredProcurements = $procurements.filter(procurement => {
    const matchesSearch = procurement.applicant.includes(searchTerm) ||
                          procurement.items.some(item => item.ingredient_name.includes(searchTerm));
    const matchesStatus = !statusFilter || procurement.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
</script>

<svelte:head>
  <title>食材采购 - 农家乐经营管理系统</title>
</svelte:head>

<div class="procurement-page">
  <div class="page-header">
    <h2 class="page-title">食材采购管理</h2>
    <Button variant="primary" href="/procurement/new">
      新建采购申请
    </Button>
  </div>
  
  <Card>
    <div class="filters">
      <input 
        type="text" 
        placeholder="搜索申请人或食材..."
        class="search-input"
        bind:value={searchTerm}
      />
      <select class="status-select" bind:value={statusFilter}>
        <option value="">全部状态</option>
        {#each Object.entries(PROCUREMENT_STATUS_LABELS) as [key, label]}
          <option value={key}>{label}</option>
        {/each}
      </select>
    </div>
    
    <div class="procurement-list">
      {#each filteredProcurements as procurement}
        <a href="/procurement/{procurement.id}" class="procurement-item">
          <div class="procurement-header">
            <div class="procurement-info">
              <span class="procurement-applicant">{procurement.applicant}</span>
              <span class="procurement-time">{formatDate(procurement.apply_time)}</span>
            </div>
            <Badge 
              variant={procurement.status === 'completed' ? 'success' : 
                       procurement.status === 'rejected' ? 'danger' : 
                       procurement.status === 'pending' ? 'warning' : 'primary'}
            >
              {PROCUREMENT_STATUS_LABELS[procurement.status]}
            </Badge>
          </div>
          <div class="procurement-items">
            {#each procurement.items as item}
              <span class="item-tag">{item.ingredient_name} {item.quantity}{item.unit}</span>
            {/each}
          </div>
          {#if procurement.status === 'purchasing'}
            <div class="procurement-progress">
              <div class="progress-text">采购中，等待收货确认</div>
            </div>
          {/if}
        </a>
      {:else}
        <div class="empty-list">暂无采购记录</div>
      {/each}
    </div>
  </Card>
</div>

<style>
  .procurement-page {
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

  .procurement-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .procurement-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background-color: #FEF3C7;
    border-radius: 0.75rem;
    transition: all 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .procurement-item:hover {
    background-color: #FDE68A;
    transform: translateX(4px);
  }

  .procurement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .procurement-info {
    display: flex;
    gap: 1rem;
  }

  .procurement-applicant {
    font-weight: 600;
    color: #78350F;
  }

  .procurement-time {
    font-size: 0.875rem;
    color: #92400E;
  }

  .procurement-items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .item-tag {
    padding: 0.25rem 0.75rem;
    background-color: white;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    color: #78350F;
  }

  .procurement-progress {
    padding: 0.5rem;
    background-color: #DBEAFE;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #1E40AF;
  }

  .empty-list {
    text-align: center;
    color: #92400E;
    padding: 2rem;
  }
</style>