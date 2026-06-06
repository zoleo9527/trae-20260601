<script>
  export let orders = []
  export let toggleSelect
  export let viewOrder
  export let statusLabels
  export let statusColors
</script>

<style>
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f9fafb; padding: 12px 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
  td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  tr:hover td { background: #f9fafb; }
  tr.selected td { background: #eff6ff; }
  .order-id { font-weight: 600; color: #2563eb; cursor: pointer; }
  .order-id:hover { text-decoration: underline; }
  .amount { font-family: monospace; font-weight: 500; }
  .diff-positive { color: #10b981; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .handler { color: #6b7280; }
  .empty { padding: 40px; text-align: center; color: #9ca3af; }
</style>

<div class="table-wrap">
  {#if orders.length === 0}
    <div class="empty">暂无订单数据</div>
  {:else}
    <table>
      <thead>
        <tr>
          <th style="width: 40px;"></th>
          <th>订单号</th>
          <th>平台/国家</th>
          <th>订单金额</th>
          <th>汇率差异</th>
          <th>库存状态</th>
          <th>状态</th>
          <th>处理人</th>
        </tr>
      </thead>
      <tbody>
        {#each orders as order (order.id)}
          <tr class={order.selected ? 'selected' : ''}>
            <td>
              <input type="checkbox" checked={order.selected} on:change={() => toggleSelect(order.id)} />
            </td>
            <td>
              <span class="order-id" on:click={() => viewOrder(order)}>{order.id}</span>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">{order.orderDate}</div>
            </td>
            <td>
              <div>{order.platform}</div>
              <div style="font-size: 11px; color: #9ca3af;">{order.country} · {order.warehouse}</div>
            </td>
            <td>
              <span class="amount">{order.currency} {(order.orderAmount || 0).toLocaleString()}</span>
            </td>
            <td>
              {#if order.diffAmount !== null && order.diffAmount !== undefined}
                <span class="amount diff-positive">+¥{order.diffAmount ? order.diffAmount.toFixed(2) : '0.00'}</span>
                <div style="font-size: 11px; color: #9ca3af;">差异 {order.rateDiff || 0}</div>
              {:else}
                <span style="color: #9ca3af;">未结算</span>
              {/if}
            </td>
            <td>
              <span style="font-size: 12px;">{order.stockStatus}</span>
              <div style="font-size: 11px; color: #9ca3af;">报关: {order.customsDeclaration}</div>
            </td>
            <td>
              <span class="status-badge" style="background: {statusColors[order.status]}20; color: {statusColors[order.status]}">
                {statusLabels[order.status]}
              </span>
            </td>
            <td class="handler">
              {order.handler}
              <div style="font-size: 11px; color: #9ca3af;">{order.department}</div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
