<script>
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
