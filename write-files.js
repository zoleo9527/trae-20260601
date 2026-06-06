const fs = require('fs');
const path = require('path');

const baseDir = '/Users/liu/Documents/private/model-test/trae-20260601-3';

// BatchActions.svelte
const batchActionsContent = `<script>
  export let orders = []
  export let batchUpdateStatus
  export let selectedCount = 0

  let tasks = [
    { id: 1, name: '批量确认汇率差异', type: 'normal', desc: '将选中订单的汇率差异标记为已确认', status: 'ready', progress: 0 },
    { id: 2, name: '批量标记为退回补充', type: 'returned', desc: '将选中订单标记为需要退回补充资料', status: 'ready', progress: 0 },
    { id: 3, name: '批量标记逾期', type: 'overdue', desc: '将选中订单标记为逾期未处理', status: 'ready', progress: 0 },
    { id: 4, name: '批量导出报关资料', type: 'export', desc: '导出选中订单的报关资料', status: 'ready', progress: 0 },
    { id: 5, name: '批量生成利润报表', type: 'report', desc: '生成选中订单的利润核算报表', status: 'ready', progress: 0 }
  ]

  function runTask(task) {
    if (selectedCount === 0 && task.type !== 'export' && task.type !== 'report') {
      alert('请先在订单列表中选择要操作的订单')
      return
    }
    task.status = 'running'
    task.progress = 0
    
    const interval = setInterval(() => {
      task.progress += Math.random() * 20
      if (task.progress >= 100) {
        task.progress = 100
        clearInterval(interval)
        setTimeout(() => {
          task.status = 'completed'
          if (task.type === 'normal' || task.type === 'returned' || task.type === 'overdue') {
            batchUpdateStatus(task.type)
          }
          setTimeout(() => {
            task.status = 'ready'
            task.progress = 0
            tasks = tasks
          }, 1500)
        }, 500)
      }
      tasks = tasks
    }, 300)
  }
</script>

<style>
  .container { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
  .header h3 { font-size: 16px; font-weight: 600; }
  .selected-info { padding: 12px 20px; background: #eff6ff; border-bottom: 1px solid #dbeafe; font-size: 13px; color: #1e40af; }
  .task-list { padding: 16px 20px; }
  .task-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; }
  .task-card:hover { border-color: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1); }
  .task-card.running { border-color: #2563eb; background: #eff6ff; }
  .task-card.completed { border-color: #10b981; background: #f0fdf4; }
  .task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .task-name { font-weight: 600; font-size: 14px; }
  .task-desc { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
  .task-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .status-ready { background: #f3f4f6; color: #374151; }
  .status-running { background: #dbeafe; color: #1e40af; }
  .status-completed { background: #d1fae5; color: #065f46; }
  .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #3b82f6); border-radius: 3px; transition: width 0.3s; }
  .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .history { padding: 16px 20px; border-top: 1px solid #e5e7eb; }
  .history h4 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  .history-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; display: flex; justify-content: space-between; }
  .history-item:last-child { border-bottom: none; }
</style>

<div class="container">
  <div class="header">
    <h3>⚡ 批量动作中心</h3>
    <span style="font-size: 12px; color: #6b7280;">提高处理效率</span>
  </div>

  <div class="selected-info">
    📋 当前已选择 <strong>{selectedCount}</strong> 个订单，请选择要执行的批量操作
  </div>

  <div class="task-list">
    {#each tasks as task (task.id)}
      <div class="task-card {task.status}">
        <div class="task-header">
          <span class="task-name">{task.name}</span>
          <span class="task-status status-{task.status}">
            {task.status === 'ready' ? '待执行' : task.status === 'running' ? '执行中...' : '✓ 已完成'}
          </span>
        </div>
        <div class="task-desc">{task.desc}</div>
        {#if task.status === 'running'}
          <div class="progress-bar">
            <div class="progress-fill" style="width: {task.progress}%"></div>
          </div>
        {/if}
        <div style="display: flex; justify-content: flex-end;">
          <button 
            class="btn btn-primary"
            disabled={task.status !== 'ready'}
            on:click={() => runTask(task)}
          >
            {task.status === 'running' ? '执行中...' : task.status === 'completed' ? '✓ 完成' : '开始执行'}
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div class="history">
    <h4>📜 最近执行记录</h4>
    <div class="history-item">
      <span>批量导出报关资料</span>
      <span style="color: #6b7280;">2026-06-05 16:20 · 45条</span>
    </div>
    <div class="history-item">
      <span>批量确认汇率差异</span>
      <span style="color: #6b7280;">2026-06-05 14:30 · 12条</span>
    </div>
    <div class="history-item">
      <span>批量生成利润报表</span>
      <span style="color: #6b7280;">2026-06-04 17:00 · 30条</span>
    </div>
  </div>
</div>
`;

// ProfitReview.svelte
const profitReviewContent = `<script>
  export let orders = []
  export let calculateProfit
  export let viewOrder

  $: settled = orders.filter(o => o.settlementRate)
  $: profitData = settled.map(o => ({ ...o, profit: calculateProfit(o) }))
  $: totalRevenue = profitData.reduce((s, o) => s + parseFloat(o.profit.revenueRMB), 0)
  $: totalCost = profitData.reduce((s, o) => s + parseFloat(o.profit.totalCost), 0)
  $: totalProfit = profitData.reduce((s, o) => s + parseFloat(o.profit.profit), 0)
  $: avgRate = profitData.length > 0 ? (totalProfit / totalRevenue * 100).toFixed(2) : 0
</script>

<style>
  .container { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
  .header h3 { font-size: 16px; font-weight: 600; }
  .header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; padding: 16px 20px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-bottom: 1px solid #e5e7eb; }
  .stat { background: white; border-radius: 8px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .stat .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
  .stat .value { font-size: 20px; font-weight: 700; }
  .stat .value.green { color: #10b981; }
  .stat .value.blue { color: #2563eb; }
  .stat .value.orange { color: #f59e0b; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f9fafb; padding: 10px 14px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
  td { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; }
  tr:hover td { background: #f9fafb; }
  .order-id { font-weight: 600; color: #2563eb; cursor: pointer; }
  .mono { font-family: monospace; }
  .profit { color: #10b981; font-weight: 600; }
  .rate-badge { padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; }
  .rate-badge.high { background: #d1fae5; color: #065f46; }
  .rate-badge.medium { background: #fef3c7; color: #92400e; }
  .rate-badge.low { background: #fee2e2; color: #991b1b; }
  .empty { padding: 40px; text-align: center; color: #9ca3af; }
</style>

<div class="container">
  <div class="header">
    <h3>💰 利润核算回看</h3>
    <p>基于结算汇率的实际利润核算，支持追溯每笔订单明细</p>
  </div>

  <div class="summary">
    <div class="stat"><div class="label">已结算订单</div><div class="value blue">{settled.length}</div></div>
    <div class="stat"><div class="label">总收入 (RMB)</div><div class="value">¥{totalRevenue.toFixed(2)}</div></div>
    <div class="stat"><div class="label">总成本 (RMB)</div><div class="value orange">¥{totalCost.toFixed(2)}</div></div>
    <div class="stat"><div class="label">总利润 (RMB)</div><div class="value green">¥{totalProfit.toFixed(2)}</div></div>
    <div class="stat"><div class="label">平均利润率</div><div class="value green">{avgRate}%</div></div>
  </div>

  <div class="table-wrap">
    {#if profitData.length === 0}
      <div class="empty">暂无已结算订单数据</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>订单号</th><th>平台</th><th>收入</th><th>成本</th><th>利润</th><th>利润率</th><th>汇率收益</th>
          </tr>
        </thead>
        <tbody>
          {#each profitData as item (item.id)}
            <tr>
              <td>
                <span class="order-id" on:click={() => viewOrder(item)}>{item.id}</span>
                <div style="font-size:11px;color:#9ca3af;">{item.orderDate}</div>
              </td>
              <td>{item.platform}</td>
              <td class="mono">¥{item.profit.revenueRMB}</td>
              <td class="mono">¥{item.profit.totalCost}</td>
              <td class="mono profit">+¥{item.profit.profit}</td>
              <td>
                <span class="rate-badge {parseFloat(item.profit.profitRate) >= 15 ? 'high' : parseFloat(item.profit.profitRate) >= 8 ? 'medium' : 'low'}">
                  {item.profit.profitRate}%
                </span>
              </td>
              <td class="mono" style="color:#10b981;">+¥{item.diffAmount ? item.diffAmount.toFixed(2) : '0.00'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
`;

// OrderDetail.svelte
const orderDetailContent = `<script>
  export let order
  export let closeDetail
  export let statusLabels
  export let statusColors
  export let calculateProfit
  export let updateOrderStatus

  let activeTab = 'basic'
  let showAddException = false
  let newExceptionDesc = ''
  let newExceptionType = '其他'

  $: profit = order.settlementRate ? calculateProfit(order) : null

  function addException() {
    if (!newExceptionDesc.trim()) return
    const now = new Date().toLocaleString('zh-CN')
    const newLog = {
      time: now,
      action: '添加异常',
      operator: '当前用户',
      remark: '新增异常: ' + newExceptionType + ' - ' + newExceptionDesc
    }
    order.logs.push(newLog)
    order.exceptions.push({
      type: newExceptionType,
      desc: newExceptionDesc,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      resolved: false
    })
    newExceptionDesc = ''
    showAddException = false
    order = order
  }

  function resolveException(index) {
    order.exceptions[index].resolved = true
    const now = new Date().toLocaleString('zh-CN')
    const newLog = {
      time: now,
      action: '解决异常',
      operator: '当前用户',
      remark: '异常已解决: ' + order.exceptions[index].type + ' - ' + order.exceptions[index].desc
    }
    order.logs.push(newLog)
    order = order
  }
</script>

<style>
  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
  .modal { background: white; border-radius: 12px; max-width: 850px; width: 100%; max-height: 88vh; overflow: hidden; display: flex; flex-direction: column; }
  .modal-header { padding: 20px 24px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
  .modal-header h2 { font-size: 18px; font-weight: 600; }
  .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #9ca3af; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
  .close-btn:hover { background: #f3f4f6; color: #374151; }
  .order-meta { display: flex; gap: 16px; align-items: center; padding: 0 24px 16px; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
  .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
  .meta-item { font-size: 13px; color: #6b7280; }
  .meta-item strong { color: #1f2937; }
  .tabs { display: flex; padding: 0 24px; border-bottom: 1px solid #e5e7eb; }
  .tab { padding: 12px 16px; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; border-bottom: 2px solid transparent; }
  .tab:hover { color: #374151; }
  .tab.active { color: #2563eb; border-bottom-color: #2563eb; }
  .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #374151; }
  .info-card { background: #f9fafb; border-radius: 8px; padding: 16px; }
  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  .info-row:last-child { border-bottom: none; }
  .info-row .label { color: #6b7280; }
  .info-row .value { font-weight: 500; font-family: monospace; }
  .timeline { position: relative; padding-left: 24px; }
  .timeline::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: #e5e7eb; }
  .timeline-item { position: relative; padding-bottom: 20px; }
  .timeline-item::before { content: ''; position: absolute; left: -20px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; border: 2px solid white; box-shadow: 0 0 0 2px #dbeafe; }
  .timeline-time { font-size: 11px; color: #9ca3af; margin-bottom: 4px; }
  .timeline-action { font-weight: 600; font-size: 13px; color: #1f2937; }
  .timeline-remark { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .timeline-operator { font-size: 11px; color: #9ca3af; margin-top: 2px; }
  .exception-card { border: 1px solid #fee2e2; border-radius: 8px; padding: 14px; margin-bottom: 12px; background: #fef2f2; }
  .exception-card.resolved { border-color: #d1fae5; background: #f0fdf4; }
  .exception-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .exception-type { font-weight: 600; font-size: 13px; color: #991b1b; }
  .exception-card.resolved .exception-type { color: #065f46; }
  .exception-desc { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
  .exception-date { font-size: 11px; color: #9ca3af; }
  .btn { padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-success { background: #10b981; color: white; }
  .btn-secondary { background: #e5e7eb; color: #374151; }
  .form-row { margin-bottom: 12px; }
  .form-row label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px; color: #374151; }
  .form-row select, .form-row input, .form-row textarea { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: inherit; }
  .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
  .profit-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .profit-value { font-size: 28px; font-weight: 700; color: #065f46; }
  .profit-rate { font-size: 14px; color: #059669; margin-top: 4px; }
</style>

<div class="overlay" on:click={closeDetail}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h2>📋 订单详情 - {order.id}</h2>
      <button class="close-btn" on:click={closeDetail}>×</button>
    </div>

    <div class="order-meta">
      <span class="status-badge" style="background: {statusColors[order.status]}20; color: {statusColors[order.status]}">
        {statusLabels[order.status]}
      </span>
      <span class="meta-item">平台: <strong>{order.platform}</strong></span>
      <span class="meta-item">处理人: <strong>{order.handler}</strong></span>
      <span class="meta-item">仓库: <strong>{order.warehouse}</strong></span>
    </div>

    <div class="tabs">
      <div class="tab {activeTab === 'basic' ? 'active' : ''}" on:click={() => activeTab = 'basic'}>基本信息</div>
      <div class="tab {activeTab === 'rate' ? 'active' : ''}" on:click={() => activeTab = 'rate'}>汇率差异</div>
      <div class="tab {activeTab === 'profit' ? 'active' : ''}" on:click={() => activeTab = 'profit'}>利润核算</div>
      <div class="tab {activeTab === 'logs' ? 'active' : ''}" on:click={() => activeTab = 'logs'}>操作追溯</div>
      <div class="tab {activeTab === 'exceptions' ? 'active' : ''}" on:click={() => activeTab = 'exceptions'}>异常说明</div>
    </div>

    <div class="modal-body">
      {#if activeTab === 'basic'}
        <div class="grid-2">
          <div class="section">
            <div class="section-title">订单信息</div>
            <div class="info-card">
              <div class="info-row"><span class="label">订单号</span><span class="value">{order.id}</span></div>
              <div class="info-row"><span class="label">下单日期</span><span class="value">{order.orderDate}</span></div>
              <div class="info-row"><span class="label">平台/国家</span><span class="value">{order.platform} / {order.country}</span></div>
              <div class="info-row"><span class="label">订单金额</span><span class="value">{order.currency} {order.orderAmount.toLocaleString()}</span></div>
              <div class="info-row"><span class="label">结算日期</span><span class="value">{order.settlementDate || '未结算'}</span></div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">库存与报关</div>
            <div class="info-card">
              <div class="info-row"><span class="label">海外仓</span><span class="value">{order.warehouse}</span></div>
              <div class="info-row"><span class="label">库存状态</span><span class="value">{order.stockStatus}</span></div>
              <div class="info-row"><span class="label">报关状态</span><span class="value">{order.customsDeclaration}</span></div>
              <div class="info-row"><span class="label">处理部门</span><span class="value">{order.department}</span></div>
            </div>
          </div>
        </div>
      {:else if activeTab === 'rate'}
        <div class="section">
          <div class="section-title">汇率差异明细</div>
          {#if order.rateDiff !== null && order.rateDiff !== undefined}
            <div class="info-card">
              <div class="info-row"><span class="label">下单时汇率</span><span class="value">{order.orderRate}</span></div>
              <div class="info-row"><span class="label">结算时汇率</span><span class="value">{order.settlementRate}</span></div>
              <div class="info-row"><span class="label">汇率差异</span><span class="value" style="color: #10b981;">+{order.rateDiff}</span></div>
              <div class="info-row"><span class="label">差异金额 (RMB)</span><span class="value" style="color: #10b981;">+¥{order.diffAmount.toFixed(2)}</span></div>
            </div>
            {#if order.status !== 'normal'}
              <div style="margin-top: 16px;">
                <button class="btn btn-primary" on:click={() => updateOrderStatus(order.id, 'normal', '汇率差异已确认')}>确认汇率差异无异议</button>
              </div>
            {/if}
          {:else}
            <div style="color: #9ca3af; padding: 20px; text-align: center;">该订单尚未结算，暂无汇率差异数据</div>
          {/if}
        </div>
      {:else if activeTab === 'profit'}
        {#if profit}
          <div class="profit-card">
            <div style="font-size: 13px; color: #065f46; margin-bottom: 4px;">净利润 (RMB)</div>
            <div class="profit-value">¥{profit.profit}</div>
            <div class="profit-rate">利润率 {profit.profitRate}%</div>
          </div>
          <div class="grid-2">
            <div class="section">
              <div class="section-title">收入</div>
              <div class="info-card">
                <div class="info-row"><span class="label">结算收入 (RMB)</span><span class="value">¥{profit.revenueRMB}</span></div>
                <div class="info-row"><span class="label">汇率收益</span><span class="value" style="color: #10b981;">+¥{order.diffAmount ? order.diffAmount.toFixed(2) : '0.00'}</span></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">成本明细</div>
              <div class="info-card">
                <div class="info-row"><span class="label">产品成本</span><span class="value">¥{order.productCost.toFixed(2)}</span></div>
                <div class="info-row"><span class="label">物流成本</span><span class="value">¥{order.shippingCost.toFixed(2)}</span></div>
                <div class="info-row"><span class="label">平台费用</span><span class="value">¥{order.platformFee.toFixed(2)}</span></div>
                <div class="info-row"><span class="label">总成本</span><span class="value" style="color: #f59e0b;">¥{profit.totalCost}</span></div>
              </div>
            </div>
          </div>
        {:else}
          <div style="color: #9ca3af; padding: 40px; text-align: center;">该订单尚未结算，暂无利润核算数据</div>
        {/if}
      {:else if activeTab === 'logs'}
        <div class="section">
          <div class="section-title">操作日志 (全程追溯)</div>
          <div class="timeline">
            {#each order.logs as log (log.time + log.action)}
              <div class="timeline-item">
                <div class="timeline-time">{log.time}</div>
                <div class="timeline-action">{log.action}</div>
                <div class="timeline-remark">{log.remark}</div>
                <div class="timeline-operator">操作人: {log.operator}</div>
              </div>
            {/each}
          </div>
        </div>
      {:else if activeTab === 'exceptions'}
        <div class="section">
          <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>异常说明 ({order.exceptions.filter(e => !e.resolved).length} 项待处理)</span>
            <button class="btn btn-primary" on:click={() => showAddException = !showAddException}>+ 添加异常</button>
          </div>
          
          {#if showAddException}
            <div class="info-card" style="margin-bottom: 16px;">
              <div class="form-row">
                <label>异常类型</label>
                <select bind:value={newExceptionType}>
                  <option>报关资料</option>
                  <option>库存超卖</option>
                  <option>退件原因</option>
                  <option>汇率争议</option>
                  <option>其他</option>
                </select>
              </div>
              <div class="form-row">
                <label>异常描述</label>
                <textarea bind:value={newExceptionDesc} rows="3" placeholder="请详细描述异常情况..."></textarea>
              </div>
              <div class="form-actions">
                <button class="btn btn-secondary" on:click={() => showAddException = false}>取消</button>
                <button class="btn btn-primary" on:click={addException}>提交</button>
              </div>
            </div>
          {/if}

          {#if order.exceptions.length === 0}
            <div style="color: #9ca3af; padding: 30px; text-align: center;">暂无异常记录</div>
          {:else}
            {#each order.exceptions as ex, index (index)}
              <div class="exception-card {ex.resolved ? 'resolved' : ''}">
                <div class="exception-header">
                  <span class="exception-type">{ex.type} {ex.resolved ? '✓ 已解决' : ''}</span>
                  <span class="exception-date">{ex.createdAt}</span>
                </div>
                <div class="exception-desc">{ex.desc}</div>
                {#if !ex.resolved}
                  <div style="text-align: right;">
                    <button class="btn btn-success" on:click={() => resolveException(index)}>标记已解决</button>
                  </div>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
`;

// App.svelte
const appContent = `<script>
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
`;

// 写入文件
fs.writeFileSync(path.join(baseDir, 'src/components/BatchActions.svelte'), batchActionsContent, 'utf8');
console.log('✅ BatchActions.svelte 已写入');

fs.writeFileSync(path.join(baseDir, 'src/components/ProfitReview.svelte'), profitReviewContent, 'utf8');
console.log('✅ ProfitReview.svelte 已写入');

fs.writeFileSync(path.join(baseDir, 'src/components/OrderDetail.svelte'), orderDetailContent, 'utf8');
console.log('✅ OrderDetail.svelte 已写入');

fs.writeFileSync(path.join(baseDir, 'src/App.svelte'), appContent, 'utf8');
console.log('✅ App.svelte 已写入');

console.log('\n🎉 所有文件写入完成！');
