<script>
  export let orders = []
  export let viewOrder
  export let statusLabels
  export let full = false
  export let updateOrderStatus = null

  let filterStatus = 'all'
  let showConfirmModal = false
  let selectedOrder = null

  $: diffOrders = orders.filter(o => o.diffAmount)
  $: filtered = filterStatus === 'all' ? diffOrders : diffOrders.filter(o => o.status === filterStatus)
  $: totalDiff = diffOrders.reduce((s, o) => s + o.diffAmount, 0)
  $: pendingDiff = diffOrders.filter(o => o.status !== 'normal').reduce((s, o) => s + o.diffAmount, 0)

  function confirmRate(o) {
    selectedOrder = o
    showConfirmModal = true
  }

  function doConfirm() {
    if (updateOrderStatus && selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'normal', '汇率差异已确认')
    }
    showConfirmModal = false
    selectedOrder = null
  }
</script>

<style>
  .panel { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .header h3 { font-size: 16px; font-weight: 600; }
  .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  .s-item .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
  .s-item .value { font-size: 18px; font-weight: 700; }
  .s-item .value.green { color: #10b981; }
  .s-item .value.orange { color: #f59e0b; }
  .filters { padding: 12px 20px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; flex-wrap: wrap; }
  .f-btn { padding: 6px 12px; border: 1px solid #d1d5db; border-radius: 16px; font-size: 12px; cursor: pointer; background: white; }
  .f-btn.active { background: #2563eb; color: white; border-color: #2563eb; }
  .list { max-height: 400px; overflow-y: auto; }
  .item { padding: 14px 20px; border-bottom: 1px solid #f3f4f6; cursor: pointer; }
  .item:hover { background: #f9fafb; }
  .item-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .item-id { font-weight: 600; font-size: 13px; color: #2563eb; }
  .item-meta { display: flex; justify-content: space-between; font-size: 12px; }
  .diff-amount { font-family: monospace; font-weight: 600; color: #10b981; }
  .badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; }
  .badge.normal { background: #d1fae5; color: #065f46; }
  .badge.returned { background: #fef3c7; color: #92400e; }
  .badge.overdue { background: #fee2e2; color: #991b1b; }
  .badge.dispute { background: #ede9fe; color: #5b21b6; }
  .actions { display: flex; gap: 8px; margin-top: 10px; }
  .btn-sm { padding: 4px 10px; font-size: 11px; border: none; border-radius: 4px; cursor: pointer; }
  .btn-sm.primary { background: #2563eb; color: white; }
  .btn-sm.secondary { background: #e5e7eb; color: #374151; }
  .empty { padding: 30px; text-align: center; color: #9ca3af; font-size: 13px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: white; border-radius: 10px; padding: 24px; max-width: 400px; width: 90%; }
  .modal h3 { font-size: 16px; margin-bottom: 12px; }
  .modal p { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
  .info-box { padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 16px; font-size: 12px; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .info-row:last-child { margin-bottom: 0; }
  .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
</style>

<div class="panel">
  <div class="header">
    <h3>💱 汇率差异处理</h3>
    <span style="font-size: 12px; color: #9ca3af;">共 {diffOrders.length} 笔</span>
  </div>

  <div class="summary">
    <div class="s-item">
      <div class="label">累计汇率差异</div>
      <div class="value green">+¥{totalDiff.toFixed(2)}</div>
    </div>
    <div class="s-item">
      <div class="label">待确认差异</div>
      <div class="value orange">¥{pendingDiff.toFixed(2)}</div>
    </div>
  </div>

  <div class="filters">
    <button class="f-btn {filterStatus === 'all' ? 'active' : ''}" on:click={() => filterStatus = 'all'}>全部</button>
    <button class="f-btn {filterStatus === 'normal' ? 'active' : ''}" on:click={() => filterStatus = 'normal'}>已确认</button>
    <button class="f-btn {filterStatus === 'returned' ? 'active' : ''}" on:click={() => filterStatus = 'returned'}>待补充</button>
    <button class="f-btn {filterStatus === 'overdue' ? 'active' : ''}" on:click={() => filterStatus = 'overdue'}>逾期</button>
    <button class="f-btn {filterStatus === 'dispute' ? 'active' : ''}" on:click={() => filterStatus = 'dispute'}>争议</button>
  </div>

  <div class="list">
    {#if filtered.length === 0}
      <div class="empty">暂无符合条件的记录</div>
    {:else}
      {#each filtered as order (order.id)}
        <div class="item" on:click={() => viewOrder(order)}>
          <div class="item-top">
            <span class="item-id">{order.id}</span>
            <span class="badge {order.status}">{statusLabels[order.status]}</span>
          </div>
          <div class="item-meta">
            <span>{order.platform} · {order.orderRate} → {order.settlementRate}</span>
            <span class="diff-amount">+¥{order.diffAmount.toFixed(2)}</span>
          </div>
          {#if full && updateOrderStatus && order.status !== 'normal'}
            <div class="actions">
              <button class="btn-sm primary" on:click|stopPropagation={() => confirmRate(order)}>确认无异议</button>
              <button class="btn-sm secondary" on:click|stopPropagation={() => viewOrder(order)}>查看详情</button>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>

{#if showConfirmModal && selectedOrder}
  <div class="modal-overlay" on:click={() => showConfirmModal = false}>
    <div class="modal" on:click|stopPropagation>
      <h3>确认汇率差异</h3>
      <p>订单 {selectedOrder.id} 的汇率差异为 ¥{selectedOrder.diffAmount.toFixed(2)}，确认无异议吗？</p>
      <div class="info-box">
        <div class="info-row"><span style="color: #6b7280;">下单时汇率</span><span style="font-weight: 600;">{selectedOrder.orderRate}</span></div>
        <div class="info-row"><span style="color: #6b7280;">结算时汇率</span><span style="font-weight: 600;">{selectedOrder.settlementRate}</span></div>
        <div class="info-row"><span style="color: #6b7280;">差异金额</span><span style="font-weight: 600; color: #10b981;">+¥{selectedOrder.diffAmount.toFixed(2)}</span></div>
      </div>
      <div class="modal-actions">
        <button class="btn-sm secondary" on:click={() => showConfirmModal = false}>取消</button>
        <button class="btn-sm primary" on:click={doConfirm}>确认</button>
      </div>
    </div>
  </div>
{/if}
