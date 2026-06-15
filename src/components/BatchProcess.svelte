<script>
  import { orders, deliverySchedules, installationFeedbacks } from '$lib/store';
  
  let orderList = [];
  let scheduleList = [];
  let feedbackList = [];
  
  orders.subscribe(o => orderList = o);
  deliverySchedules.subscribe(s => scheduleList = s);
  installationFeedbacks.subscribe(f => feedbackList = f);
  
  let selectedOrders = [];
  let selectedSchedules = [];
  let selectedFeedbacks = [];
  
  const toggleOrderSelection = (orderId) => {
    const index = selectedOrders.indexOf(orderId);
    if (index === -1) {
      selectedOrders.push(orderId);
    } else {
      selectedOrders.splice(index, 1);
    }
  };
  
  const toggleScheduleSelection = (scheduleId) => {
    const index = selectedSchedules.indexOf(scheduleId);
    if (index === -1) {
      selectedSchedules.push(scheduleId);
    } else {
      selectedSchedules.splice(index, 1);
    }
  };
  
  const toggleFeedbackSelection = (feedbackId) => {
    const index = selectedFeedbacks.indexOf(feedbackId);
    if (index === -1) {
      selectedFeedbacks.push(feedbackId);
    } else {
      selectedFeedbacks.splice(index, 1);
    }
  };
  
  const selectAllOrders = () => {
    if (selectedOrders.length === orderList.length) {
      selectedOrders = [];
    } else {
      selectedOrders = orderList.map(o => o.id);
    }
  };
  
  const selectAllSchedules = () => {
    if (selectedSchedules.length === scheduleList.length) {
      selectedSchedules = [];
    } else {
      selectedSchedules = scheduleList.map(s => s.id);
    }
  };
  
  const selectAllFeedbacks = () => {
    if (selectedFeedbacks.length === feedbackList.length) {
      selectedFeedbacks = [];
    } else {
      selectedFeedbacks = feedbackList.map(f => f.id);
    }
  };
  
  const statusLabels = {
    pending: '待处理',
    scheduled: '已排期',
    delivered: '已送货',
    installing: '铺贴中',
    completed: '已完成'
  };
  
  const scheduleStatusLabels = {
    pending: '待确认',
    scheduled: '已排期',
    completed: '已完成'
  };
  
  const feedbackStatusLabels = {
    pending: '待开始',
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
  
  const batchUpdateOrderStatus = (status) => {
    orders.update(items => 
      items.map(item => 
        selectedOrders.includes(item.id) ? { ...item, status } : item
      )
    );
    selectedOrders = [];
  };
  
  const batchConfirmSchedules = () => {
    deliverySchedules.update(items => 
      items.map(item => 
        selectedSchedules.includes(item.id) && item.status === 'pending' 
          ? { ...item, status: 'scheduled' } 
          : item
      )
    );
    selectedSchedules = [];
  };
  
  const batchCompleteFeedbacks = () => {
    installationFeedbacks.update(items => 
      items.map(item => 
        selectedFeedbacks.includes(item.id) && item.status !== 'completed'
          ? { 
              ...item, 
              status: 'completed',
              endDate: new Date().toISOString().split('T')[0],
              feedbackDate: new Date().toISOString().split('T')[0]
            } 
          : item
      )
    );
    selectedFeedbacks = [];
  };
</script>

<section id="batch" class="section">
  <div class="section-header">
    <h2>批量处理</h2>
  </div>
  
  <div class="batch-section">
    <div class="section-title">
      <h3>订单批量处理</h3>
      <div class="section-actions">
        <button class="btn btn-secondary" on:click={selectAllOrders}>
          {selectedOrders.length === orderList.length ? '取消全选' : '全选'}
        </button>
        <button class="btn btn-primary" on:click={() => batchUpdateOrderStatus('scheduled')}
                disabled={selectedOrders.length === 0}>
          批量排期
        </button>
        <button class="btn btn-success" on:click={() => batchUpdateOrderStatus('completed')}
                disabled={selectedOrders.length === 0}>
          批量完成
        </button>
      </div>
    </div>
    
    <div class="batch-table-container">
      <table class="batch-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" checked={selectedOrders.length === orderList.length && orderList.length > 0}
                     on:change={selectAllOrders} />
            </th>
            <th>订单编号</th>
            <th>客户姓名</th>
            <th>订单日期</th>
            <th>金额</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {#each orderList as order}
            <tr class={selectedOrders.includes(order.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={selectedOrders.includes(order.id)}
                       on:change={() => toggleOrderSelection(order.id)} />
              </td>
              <td>{order.id}</td>
              <td>{order.customerName}</td>
              <td>{order.orderDate}</td>
              <td>¥{order.totalAmount.toLocaleString()}</td>
              <td>
                <span class="status-badge" style="background-color: {statusColors[order.status]}">
                  {statusLabels[order.status]}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <div class="batch-section">
    <div class="section-title">
      <h3>送货排期批量确认</h3>
      <div class="section-actions">
        <button class="btn btn-secondary" on:click={selectAllSchedules}>
          {selectedSchedules.length === scheduleList.length ? '取消全选' : '全选'}
        </button>
        <button class="btn btn-primary" on:click={batchConfirmSchedules}
                disabled={selectedSchedules.length === 0}>
          批量确认排期
        </button>
      </div>
    </div>
    
    <div class="batch-table-container">
      <table class="batch-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" checked={selectedSchedules.length === scheduleList.length && scheduleList.length > 0}
                     on:change={selectAllSchedules} />
            </th>
            <th>排期编号</th>
            <th>关联订单</th>
            <th>排期日期</th>
            <th>仓库员</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {#each scheduleList as schedule}
            <tr class={selectedSchedules.includes(schedule.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={selectedSchedules.includes(schedule.id)}
                       on:change={() => toggleScheduleSelection(schedule.id)} />
              </td>
              <td>{schedule.id}</td>
              <td>{schedule.orderId}</td>
              <td>{schedule.scheduledDate}</td>
              <td>{schedule.warehouseStaff}</td>
              <td>
                <span class="status-badge" style="background-color: {statusColors[schedule.status]}">
                  {scheduleStatusLabels[schedule.status]}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
  
  <div class="batch-section">
    <div class="section-title">
      <h3>铺贴反馈批量完成</h3>
      <div class="section-actions">
        <button class="btn btn-secondary" on:click={selectAllFeedbacks}>
          {selectedFeedbacks.length === feedbackList.length ? '取消全选' : '全选'}
        </button>
        <button class="btn btn-success" on:click={batchCompleteFeedbacks}
                disabled={selectedFeedbacks.length === 0}>
          批量完成铺贴
        </button>
      </div>
    </div>
    
    <div class="batch-table-container">
      <table class="batch-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" checked={selectedFeedbacks.length === feedbackList.length && feedbackList.length > 0}
                     on:change={selectAllFeedbacks} />
            </th>
            <th>反馈编号</th>
            <th>关联订单</th>
            <th>施工师傅</th>
            <th>开始日期</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {#each feedbackList as feedback}
            <tr class={selectedFeedbacks.includes(feedback.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={selectedFeedbacks.includes(feedback.id)}
                       on:change={() => toggleFeedbackSelection(feedback.id)} />
              </td>
              <td>{feedback.id}</td>
              <td>{feedback.orderId}</td>
              <td>{feedback.installer}</td>
              <td>{feedback.startDate}</td>
              <td>
                <span class="status-badge" style="background-color: {statusColors[feedback.status]}">
                  {feedbackStatusLabels[feedback.status]}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</section>

<style>
  .batch-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    margin-bottom: 1.5rem;
  }
  
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-title h3 {
    font-size: 1.1rem;
    color: #333;
  }
  
  .section-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
  }
  
  .btn-success {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    color: white;
  }
  
  .btn-secondary {
    background: #f0f0f0;
    color: #666;
  }
  
  .btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  .batch-table-container {
    overflow-x: auto;
  }
  
  .batch-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .batch-table th,
  .batch-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .batch-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #666;
  }
  
  .batch-table th.checkbox-col {
    width: 40px;
  }
  
  .batch-table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  .batch-table tbody tr.selected {
    background-color: #e3f2fd;
  }
  
  .status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 16px;
    font-size: 0.7rem;
    color: white;
    font-weight: 500;
  }
</style>
