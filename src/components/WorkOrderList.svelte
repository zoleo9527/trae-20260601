<script lang="ts">
  import { onMount } from 'svelte';
  import type { User, WorkOrder } from '../lib/types';
  import { getWorkOrders, createWorkOrder, createOperationLog } from '../lib/db';
  import CreateOrderModal from './CreateOrderModal.svelte';

  export let user: User;

  const emit = defineEmits<{
    'select-order': [order: WorkOrder];
    logout: [];
  }>();

  let orders: WorkOrder[] = [];
  let showCreateModal = false;
  let filterPlateNumber = '';
  let filterCustomerName = '';
  let filterStatus = '';
  let filterStartDate = '';
  let filterEndDate = '';

  async function loadOrders() {
    const params: any = {};
    if (filterPlateNumber) params.plateNumber = filterPlateNumber;
    if (filterCustomerName) params.customerName = filterCustomerName;
    if (filterStatus) params.status = filterStatus;
    if (filterStartDate) params.startDate = filterStartDate;
    if (filterEndDate) params.endDate = filterEndDate;
    
    orders = getWorkOrders(params);
  }

  async function handleCreateOrder(data: Omit<WorkOrder, 'id' | 'balanceRecords' | 'inspectionRecord' | 'createdAt' | 'updatedAt' | 'needsReinspection' | 'balanceUpdatedAfterInspection'>) {
    const orderId = createWorkOrder(data);
    createOperationLog({
      workOrderId: orderId,
      action: '创建工单',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      details: `创建工单: ${data.plateNumber} - ${data.customerName}`
    });
    showCreateModal = false;
    await loadOrders();
  }

  function handleSelectOrder(order: WorkOrder) {
    emit('select-order', order);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getBalanceStatus(order: WorkOrder) {
    if (order.balanceRecords.length === 0) return '待录入';
    if (order.balanceRecords.some(r => r.status === '待处理' || r.status === '处理中')) return '处理中';
    if (order.balanceRecords.some(r => r.status === '需复检')) return '需复检';
    return '已完成';
  }

  function getInspectionStatus(order: WorkOrder) {
    if (!order.inspectionRecord) return '待质检';
    return order.inspectionRecord.status;
  }

  function resetFilter() {
    filterPlateNumber = '';
    filterCustomerName = '';
    filterStatus = '';
    filterStartDate = '';
    filterEndDate = '';
    loadOrders();
  }

  onMount(async () => {
    await loadOrders();
    window['loadOrders'] = loadOrders;
  });
</script>

<div class="container">
  <header class="page-header">
    <div class="header-left">
      <h1>工单列表</h1>
      <p class="user-info">当前角色：{user.name} ({user.role})</p>
    </div>
    <div class="header-right">
      {#if user.role === '前台' || user.role === '店长'}
        <button class="btn btn-primary" on:click={() => showCreateModal = true}>
          + 新建工单
        </button>
      {/if}
      <button class="btn btn-outline" on:click={() => emit('logout')}>
        退出登录
      </button>
    </div>
  </header>

  <div class="search-bar">
    <input 
      type="text" 
      bind:value={filterPlateNumber} 
      placeholder="车牌号"
      on:input={loadOrders}
    />
    <input 
      type="text" 
      bind:value={filterCustomerName} 
      placeholder="客户姓名"
      on:input={loadOrders}
    />
    <select bind:value={filterStatus} on:change={loadOrders}>
      <option value="">全部状态</option>
      <option value="进行中">进行中</option>
      <option value="已完成">已完成</option>
    </select>
    <input 
      type="date" 
      bind:value={filterStartDate} 
      on:change={loadOrders}
    />
    <input 
      type="date" 
      bind:value={filterEndDate} 
      on:change={loadOrders}
    />
    <button class="btn btn-outline" on:click={resetFilter}>
      重置筛选
    </button>
  </div>

  <div class="card">
    <table class="table">
      <thead>
        <tr>
          <th>车牌号</th>
          <th>客户</th>
          <th>车型</th>
          <th>动平衡状态</th>
          <th>质检状态</th>
          <th>工单状态</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#each orders as order}
          <tr>
            <td>{order.plateNumber}</td>
            <td>{order.customerName}</td>
            <td>{order.vehicleModel || '-'}</td>
            <td>
              <span class="badge {
                getBalanceStatus(order) === '待录入' ? 'badge-info' :
                getBalanceStatus(order) === '处理中' ? 'badge-warning' :
                getBalanceStatus(order) === '需复检' ? 'badge-danger' :
                'badge-success'
              }">
                {getBalanceStatus(order)}
              </span>
            </td>
            <td>
              <span class="badge {
                getInspectionStatus(order) === '待质检' ? 'badge-info' :
                getInspectionStatus(order) === '质检中' ? 'badge-warning' :
                getInspectionStatus(order) === '质检不通过' ? 'badge-danger' :
                getInspectionStatus(order) === '待重新质检' ? 'badge-warning' :
                'badge-success'
              }">
                {getInspectionStatus(order)}
              </span>
            </td>
            <td>
              <span class="badge {
                order.status === '进行中' ? 'badge-warning' : 'badge-success'
              }">
                {order.status}
              </span>
            </td>
            <td>{formatDate(order.createdAt)}</td>
            <td>
              <button class="btn btn-outline btn-sm" on:click={() => handleSelectOrder(order)}>
                查看详情
              </button>
            </td>
          </tr>
        {/each}
        {#if orders.length === 0}
          <tr>
            <td colspan="8" style="text-align: center; color: #64748b;">
              暂无工单记录
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>

  {#if showCreateModal}
    <CreateOrderModal 
      user={user}
      on:close={() => showCreateModal = false}
      on:submit={handleCreateOrder}
    />
  {/if}
</div>

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-left h1 {
    margin-bottom: 4px;
  }

  .user-info {
    font-size: 14px;
    color: #64748b;
  }

  .header-right {
    display: flex;
    gap: 12px;
  }

  .btn-sm {
    padding: 4px 12px;
    font-size: 13px;
  }

  .search-bar {
    flex-wrap: wrap;
  }

  .search-bar input,
  .search-bar select {
    flex: 1;
    min-width: 120px;
  }
</style>
