<script>
  import { orders, statusLabels, statusColors, calculateProfit } from './data/mockData.js'
  import OrderList from './components/OrderList.svelte'
  import RateDiffPanel from './components/RateDiffPanel.svelte'
  import ProfitReview from './components/ProfitReview.svelte'
  import BatchActions from './components/BatchActions.svelte'
  import OrderDetail from './components/OrderDetail.svelte'

  let currentView = 'dashboard'
  let selectedOrder = null
  let orderList = orders.map(o => ({ ...o, selected: false }))

  $: allSelected = orderList.length > 0 && orderList.every(o => o.selected)
  $: selectedCount = orderList.filter(o => o.selected).length

  function toggleSelectAll() {
    const newValue = !allSelected
    orderList = orderList.map(o => ({ ...o, selected: newValue }))
  }

  function toggleSelect(id) {
    orderList = orderList.map(o =>
      o.id === id ? { ...o, selected: !o.selected } : o
    )
  }

  function viewOrder(order) {
    selectedOrder = order
    currentView = 'detail'
  }

  function closeDetail() {
    selectedOrder = null
    currentView = 'dashboard'
  }

  function setView(view) {
    currentView = view
    selectedOrder = null
  }

  function getStats() {
    const stats = {
      total: orderList.length,
      normal: 0,
      returned: 0,
      overdue: 0,
      dispute: 0,
      totalDiff: 0,
      pendingDiff: 0
    }
    orderList.forEach(o => {
      stats[o.status]++
      if (o.diffAmount) {
        stats.totalDiff += o.diffAmount
        if (o.status !== 'normal') stats.pendingDiff += o.diffAmount
      }
    })
    return stats
  }

  function updateOrderStatus(id, newStatus, remark) {
    const now = new Date().toLocaleString('zh-CN')
    orderList = orderList.map(o => {
      if (o.id === id) {
        const newLog = {
          time: now,
          action: '状态更新',
          operator: '当前用户',
          remark: remark || '状态更新为: ' + statusLabels[newStatus]
        }
        return { ...o, status: newStatus, logs: [...o.logs, newLog] }
      }
      return o
    })
    if (selectedOrder && selectedOrder.id === id) {
      selectedOrder = orderList.find(o => o.id === id)
    }
  }

  function batchUpdateStatus(newStatus) {
    const now = new Date().toLocaleString('zh-CN')
    orderList = orderList.map(o => {
      if (o.selected) {
        const newLog = {
          time: now,
          action: '批量状态更新',
          operator: '当前用户',
          remark: '批量更新为: ' + statusLabels[newStatus]
        }
        return { ...o, status: newStatus, selected: false, logs: [...o.logs, newLog] }
      }
      return o
    })
  }
</script>

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #1f2937; }
  .app { min-height: 100vh; }
  .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header h1 { font-size: 20px; font-weight: 600; }
  .header .subtitle { font-size: 13px; opacity: 0.8; margin-top: 2px; }
  .nav { display: flex; gap: 4px; }
  .nav button { background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
  .nav button:hover, .nav button.active { background: rgba(255,255,255,0.25); }
  .main { padding: 24px; max-width: 1400px; margin: 0 auto; }
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .stat-card .label { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #1f2937; }
  .stat-card .value.success { color: #10b981; }
  .stat-card .value.warning { color: #f59e0b; }
  .stat-card .value.danger { color: #ef4444; }
  .stat-card .value.purple { color: #8b5cf6; }
  .content-grid { display: grid; grid-template-columns: 1fr 380px; gap: 20px; }
  @media (max-width: 1024px) { .content-grid { grid-template-columns: 1fr; } }
  .card { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .card-header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
  .card-header h3 { font-size: 16px; font-weight: 600; }
  .toolbar { display: flex; gap: 12px; align-items: center; padding: 12px 20px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
  .toolbar select, .toolbar input { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white; }
  .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .btn-secondary:hover { background: #d1d5db; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .batch-info { font-size: 13px; color: #6b7280; margin-left: auto; }
</style>

<div class="app">
  <div class="header">
    <div>
      <h1>📦 跨境电商 - 汇率差异与利润核算</h1>
      <div class="subtitle">一线处理与管理回看 · 数据同源 · 全程可追溯</div>
    </div>
    <nav class="nav">
      <button class={currentView === 'dashboard' ? 'active' : ''} on:click={() => setView('dashboard')}>工作台</button>
      <button class={currentView === 'rate' ? 'active' : ''} on:click={() => setView('rate')}>汇率差异</button>
      <button class={currentView === 'profit' ? 'active' : ''} on:click={() => setView('profit')}>利润核算</button>
      <button class={currentView === 'batch' ? 'active' : ''} on:click={() => setView('batch')}>批量动作</button>
    </nav>
  </div>

  <div class="main">
    {#if currentView === 'dashboard'}
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">订单总数</div>
          <div class="value">{getStats().total}</div>
        </div>
        <div class="stat-card">
          <div class="label">正常推进</div>
          <div class="value success">{getStats().normal}</div>
        </div>
        <div class="stat-card">
          <div class="label">退回补充</div>
          <div class="value warning">{getStats().returned}</div>
        </div>
        <div class="stat-card">
          <div class="label">逾期未处理</div>
          <div class="value danger">{getStats().overdue}</div>
        </div>
        <div class="stat-card">
          <div class="label">责任争议</div>
          <div class="value purple">{getStats().dispute}</div>
        </div>
        <div class="stat-card">
          <div class="label">累计汇率差异</div>
          <div class="value">¥{getStats().totalDiff.toFixed(2)}</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="card">
          <div class="card-header">
            <h3>订单列表</h3>
          </div>
          <div class="toolbar">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;">
              <input type="checkbox" checked={allSelected} on:change={toggleSelectAll} />
              全选
            </label>
            <select on:change={(e) => batchUpdateStatus(e.target.value)} disabled={selectedCount === 0}>
              <option value="">批量操作...</option>
              <option value="normal">标记正常推进</option>
              <option value="returned">标记退回补充</option>
              <option value="overdue">标记逾期</option>
              <option value="dispute">标记责任争议</option>
            </select>
            <span class="batch-info">已选 {selectedCount} 项</span>
          </div>
          <OrderList
            orders={orderList}
            {toggleSelect}
            {viewOrder}
            {statusLabels}
            {statusColors}
          />
        </div>

        <div>
          <div class="card" style="margin-bottom: 20px;">
            <div class="card-header">
              <h3>⚡ 快速操作</h3>
            </div>
            <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
              <button class="btn btn-primary" on:click={() => setView('rate')}>处理汇率差异</button>
              <button class="btn btn-secondary" on:click={() => setView('profit')}>查看利润核算</button>
              <button class="btn btn-secondary" on:click={() => setView('batch')}>执行批量动作</button>
            </div>
          </div>
          
          <RateDiffPanel orders={orderList} {viewOrder} {statusLabels} full={false} {updateOrderStatus} />
        </div>
      </div>
    {:else if currentView === 'rate'}
      <RateDiffPanel orders={orderList} {viewOrder} {statusLabels} full={true} {updateOrderStatus} />
    {:else if currentView === 'profit'}
      <ProfitReview orders={orderList} {calculateProfit} {viewOrder} />
    {:else if currentView === 'batch'}
      <BatchActions orders={orderList} {batchUpdateStatus} selectedCount={selectedCount} />
    {:else if currentView === 'detail' && selectedOrder}
      <OrderDetail
        order={selectedOrder}
        {closeDetail}
        {statusLabels}
        {statusColors}
        {calculateProfit}
        {updateOrderStatus}
      />
    {/if}
  </div>
</div>
