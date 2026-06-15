<script>
  import { orders, deliverySchedules, installationFeedbacks } from '$lib/store';
  
  let orderList = [];
  let scheduleList = [];
  let feedbackList = [];
  
  orders.subscribe(o => orderList = o);
  deliverySchedules.subscribe(s => scheduleList = s);
  installationFeedbacks.subscribe(f => feedbackList = f);
  
  let selectedOrderId = 'ORD001';
  
  $: order = orderList.find(o => o.id === selectedOrderId);
  $: schedule = scheduleList.find(s => s.orderId === selectedOrderId);
  $: feedback = feedbackList.find(f => f.orderId === selectedOrderId);
  
  const handleOrderChange = (e) => {
    selectedOrderId = e.target.value;
  };
  
  const statusLabels = {
    pending: '待处理',
    scheduled: '已排期',
    delivered: '已送货',
    installing: '铺贴中',
    completed: '已完成'
  };
  
  const statusColors = {
    pending: '#9E9E9E',
    scheduled: '#2196F3',
    delivered: '#FF9800',
    installing: '#FFC107',
    completed: '#4CAF50'
  };
  
  const getTimelineItems = () => {
    const items = [];
    
    if (order) {
      items.push({
        time: order.orderDate + ' 00:00',
        action: '订单创建',
        operator: order.guide,
        remark: '客户下单'
      });
      
      if (order.measurementDate) {
        items.push({
          time: order.measurementDate + ' 09:00',
          action: '量房完成',
          operator: order.designer,
          remark: order.measurementNotes
        });
      }
    }
    
    if (schedule && schedule.timeline) {
      schedule.timeline.forEach(item => {
        items.push({
          ...item,
          category: 'delivery'
        });
      });
    }
    
    if (feedback && feedback.timeline) {
      feedback.timeline.forEach(item => {
        items.push({
          ...item,
          category: 'installation'
        });
      });
    }
    
    return items.sort((a, b) => new Date(a.time) - new Date(b.time));
  };
</script>

<section id="order-detail-section" class="section">
  <div class="section-header">
    <h2>订单详情时间线</h2>
    <div class="order-selector">
      <select value={selectedOrderId} on:change={handleOrderChange}>
        {#each orderList as o}
          <option value={o.id}>{o.id} - {o.customerName}</option>
        {/each}
      </select>
    </div>
  </div>
  
  {#if order}
    <div class="detail-container">
      <div class="detail-card customer-card">
        <h3>客户信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">客户姓名</span>
            <span class="value">{order.customerName}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{order.phone}</span>
          </div>
          <div class="info-item">
            <span class="label">收货地址</span>
            <span class="value">{order.address}</span>
          </div>
          <div class="info-item">
            <span class="label">订单日期</span>
            <span class="value">{order.orderDate}</span>
          </div>
          <div class="info-item">
            <span class="label">订单状态</span>
            <span class="value">
              <span class="status-dot" style="background-color: {statusColors[order.status]}"></span>
              {statusLabels[order.status]}
            </span>
          </div>
          <div class="info-item">
            <span class="label">订单金额</span>
            <span class="value amount">¥{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div class="detail-card">
        <h3>产品清单</h3>
        <table class="product-table">
          <thead>
            <tr>
              <th>产品名称</th>
              <th>数量</th>
              <th>单位</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            {#each order.products as product}
              <tr>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
                <td>{product.unit}</td>
                <td>¥{product.price}</td>
                <td>¥{(product.quantity * product.price).toLocaleString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      
      <div class="detail-card">
        <h3>关联信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">导购</span>
            <span class="value">{order.guide}</span>
          </div>
          <div class="info-item">
            <span class="label">设计师</span>
            <span class="value">{order.designer}</span>
          </div>
          <div class="info-item">
            <span class="label">样板册</span>
            <span class="value">{order.showroomBook}</span>
          </div>
          <div class="info-item">
            <span class="label">量房日期</span>
            <span class="value">{order.measurementDate}</span>
          </div>
        </div>
        {#if order.measurementNotes}
          <div class="notes-section">
            <span class="label">量房备注</span>
            <p>{order.measurementNotes}</p>
          </div>
        {/if}
      </div>
      
      {#if order.replenishRequests && order.replenishRequests.length > 0}
        <div class="detail-card warning-card">
          <h3>补货申请</h3>
          <div class="replenish-list">
            {#each order.replenishRequests as request}
              <div class="replenish-item">
                <span class="product">{request.product}</span>
                <span class="quantity">x{request.quantity}</span>
                <span class="reason">{request.reason}</span>
                <span class="status-tag" class={request.status}>
                  {request.status === 'pending' ? '待处理' : '已完成'}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      <div class="timeline-section">
        <h3>处理时间线</h3>
        <div class="timeline">
          {#each getTimelineItems() as (item, index)}
            <div class="timeline-item">
              <div class="timeline-marker" 
                   class={item.category || 'order'}
                   style="border-color: {item.category === 'installation' ? '#FF9800' : item.category === 'delivery' ? '#2196F3' : '#4CAF50'}">
                <span class="marker-dot"></span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-action">{item.action}</span>
                  <span class="timeline-time">{item.time}</span>
                </div>
                <div class="timeline-body">
                  <span class="timeline-operator">{item.operator}</span>
                  {#if item.remark}
                    <span class="timeline-remark">- {item.remark}</span>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .detail-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }
  
  .detail-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  
  .detail-card h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .info-item .label {
    font-size: 0.8rem;
    color: #999;
  }
  
  .info-item .value {
    font-weight: 500;
    color: #333;
  }
  
  .info-item .value.amount {
    color: #e74c3c;
    font-size: 1.1rem;
  }
  
  .status-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 0.5rem;
  }
  
  .product-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .product-table th,
  .product-table td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .product-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #666;
  }
  
  .notes-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
  
  .notes-section p {
    margin-top: 0.5rem;
    color: #666;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .warning-card {
    border-left: 4px solid #FF9800;
  }
  
  .replenish-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .replenish-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: #fff8f0;
    border-radius: 8px;
  }
  
  .replenish-item .product {
    flex: 1;
    font-weight: 500;
  }
  
  .replenish-item .quantity {
    color: #666;
  }
  
  .replenish-item .reason {
    flex: 2;
    color: #888;
    font-size: 0.85rem;
  }
  
  .status-tag {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
  }
  
  .status-tag.pending {
    background-color: #fff3e0;
    color: #ff9800;
  }
  
  .status-tag.completed {
    background-color: #e8f5e9;
    color: #4caf50;
  }
  
  .timeline-section {
    grid-column: 1 / -1;
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  
  .timeline-section h3 {
    margin-bottom: 1.5rem;
    color: #333;
    font-size: 1.1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  .timeline {
    position: relative;
    padding-left: 2rem;
  }
  
  .timeline::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #eee;
  }
  
  .timeline-item {
    position: relative;
    padding-bottom: 1.5rem;
  }
  
  .timeline-item:last-child {
    padding-bottom: 0;
  }
  
  .timeline-marker {
    position: absolute;
    left: -2rem;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .marker-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: inherit;
  }
  
  .timeline-marker.order .marker-dot { background-color: #4CAF50; }
  .timeline-marker.delivery .marker-dot { background-color: #2196F3; }
  .timeline-marker.installation .marker-dot { background-color: #FF9800; }
  
  .timeline-content {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
  }
  
  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .timeline-action {
    font-weight: 600;
    color: #333;
  }
  
  .timeline-time {
    font-size: 0.8rem;
    color: #999;
  }
  
  .timeline-body {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .timeline-operator {
    font-weight: 500;
  }
  
  .timeline-remark {
    color: #888;
  }
  
  .order-selector select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
    min-width: 250px;
  }
</style>
