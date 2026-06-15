<script>
  import { orders } from '$lib/store';
  
  let orderList = [];
  orders.subscribe(o => orderList = o);
  
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
  
  const handleViewDetail = (orderId) => {
    document.getElementById('order-detail-section').scrollIntoView({ behavior: 'smooth' });
    window.currentOrderId = orderId;
  };
</script>

<section id="orders" class="section">
  <div class="section-header">
    <h2>订单列表</h2>
    <div class="filter-bar">
      <select class="filter-select">
        <option value="all">全部状态</option>
        <option value="pending">待处理</option>
        <option value="scheduled">已排期</option>
        <option value="delivered">已送货</option>
        <option value="installing">铺贴中</option>
        <option value="completed">已完成</option>
      </select>
    </div>
  </div>
  
  <div class="order-grid">
    {#each orderList as order}
      <div class="order-card" on:click={() => handleViewDetail(order.id)}>
        <div class="order-header">
          <span class="order-id">{order.id}</span>
          <span class="status-badge" style="background-color: {statusColors[order.status]}">
            {statusLabels[order.status]}
          </span>
        </div>
        <div class="order-info">
          <h3>{order.customerName}</h3>
          <p>{order.address}</p>
        </div>
        <div class="order-meta">
          <div class="meta-item">
            <span class="meta-label">订单日期</span>
            <span class="meta-value">{order.orderDate}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">金额</span>
            <span class="meta-value">¥{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>
        <div class="order-actions">
          <button class="btn btn-primary">查看详情</button>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .section {
    padding: 2rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .section-header h2 {
    font-size: 1.5rem;
    color: #333;
  }
  
  .filter-select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  
  .order-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  
  .order-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .order-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .order-id {
    font-weight: 600;
    color: #1e3c72;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    color: white;
    font-weight: 500;
  }
  
  .order-info h3 {
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  .order-info p {
    color: #666;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .order-meta {
    display: flex;
    gap: 1.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
  
  .meta-item {
    display: flex;
    flex-direction: column;
  }
  
  .meta-label {
    font-size: 0.75rem;
    color: #999;
  }
  
  .meta-value {
    font-weight: 500;
    color: #333;
  }
  
  .order-actions {
    margin-top: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
  }
  
  .btn-primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
</style>
