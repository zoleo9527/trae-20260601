<script>
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
