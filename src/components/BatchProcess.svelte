<script>
  import { orders, deliverySchedules, installationFeedbacks } from '$lib/store';
  import { writable } from 'svelte/store';
  
  let orderList = [];
  let scheduleList = [];
  let feedbackList = [];
  
  orders.subscribe(o => orderList = o);
  deliverySchedules.subscribe(s => scheduleList = s);
  installationFeedbacks.subscribe(f => feedbackList = f);
  
  const selectedOrders = writable([]);
  const selectedSchedules = writable([]);
  const selectedFeedbacks = writable([]);
  
  let localSelectedOrders = [];
  let localSelectedSchedules = [];
  let localSelectedFeedbacks = [];
  
  selectedOrders.subscribe(s => localSelectedOrders = s);
  selectedSchedules.subscribe(s => localSelectedSchedules = s);
  selectedFeedbacks.subscribe(s => localSelectedFeedbacks = s);
  
  const toggleOrderSelection = (orderId) => {
    selectedOrders.update(items => {
      const index = items.indexOf(orderId);
      if (index === -1) {
        return [...items, orderId];
      } else {
        return items.filter(id => id !== orderId);
      }
    });
  };
  
  const toggleScheduleSelection = (scheduleId) => {
    selectedSchedules.update(items => {
      const index = items.indexOf(scheduleId);
      if (index === -1) {
        return [...items, scheduleId];
      } else {
        return items.filter(id => id !== scheduleId);
      }
    });
  };
  
  const toggleFeedbackSelection = (feedbackId) => {
    selectedFeedbacks.update(items => {
      const index = items.indexOf(feedbackId);
      if (index === -1) {
        return [...items, feedbackId];
      } else {
        return items.filter(id => id !== feedbackId);
      }
    });
  };
  
  const selectAllOrders = () => {
    if (localSelectedOrders.length === orderList.length) {
      selectedOrders.set([]);
    } else {
      selectedOrders.set(orderList.map(o => o.id));
    }
  };
  
  const selectAllSchedules = () => {
    if (localSelectedSchedules.length === scheduleList.length) {
      selectedSchedules.set([]);
    } else {
      selectedSchedules.set(scheduleList.map(s => s.id));
    }
  };
  
  const selectAllFeedbacks = () => {
    if (localSelectedFeedbacks.length === feedbackList.length) {
      selectedFeedbacks.set([]);
    } else {
      selectedFeedbacks.set(feedbackList.map(f => f.id));
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
        localSelectedOrders.includes(item.id) ? { ...item, status } : item
      )
    );
    selectedOrders.set([]);
  };
  
  const batchConfirmSchedules = () => {
    deliverySchedules.update(items => 
      items.map(item => 
        localSelectedSchedules.includes(item.id) && item.status === 'pending' 
          ? { ...item, status: 'scheduled' } 
          : item
      )
    );
    selectedSchedules.set([]);
  };
  
  const batchCompleteFeedbacks = () => {
    const today = new Date().toISOString().split('T')[0];
    installationFeedbacks.update(items => 
      items.map(item => 
        localSelectedFeedbacks.includes(item.id) && item.status !== 'completed'
          ? { 
              ...item, 
              status: 'completed',
              endDate: today,
              feedbackDate: today
            } 
          : item
      )
    );
    selectedFeedbacks.set([]);
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
          {localSelectedOrders.length === orderList.length && orderList.length > 0 ? '取消全选' : '全选'}
        </button>
        <button class="btn btn-primary" on:click={() => batchUpdateOrderStatus('scheduled')}
                disabled={localSelectedOrders.length === 0}>
          批量排期
        </button>
        <button class="btn btn-success" on:click={() => batchUpdateOrderStatus('completed')}
                disabled={localSelectedOrders.length === 0}>
          批量完成
        </button>
      </div>
    </div>
    
    <div class="batch-table-container">
      <table class="batch-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" checked={localSelectedOrders.length === orderList.length && orderList.length > 0}
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
            <tr class={localSelectedOrders.includes(order.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={localSelectedOrders.includes(order.id)}
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
          {localSelectedSchedules.length === scheduleList.length && scheduleList.length > 0 ? '取消全选' : '全选'}
        </button>
        <button class="btn btn-primary" on:click={batchConfirmSchedules}
                disabled={localSelectedSchedules.length === 0}>
          批量确认排期
        </button>
      </div>
    </div>
    
    <div class="batch-table-container">
      <table class="batch-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" checked={localSelectedSchedules.length === scheduleList.length && scheduleList.length > 0}
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
            <tr class={localSelectedSchedules.includes(schedule.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={localSelectedSchedules.includes(schedule.id)}
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
          {localSelectedFeedbacks.length === feedbackList.length && feedbackList.length > 0 ? '取消全选' : '全选'}
        </button>
        <button class="btn btn-success" on:click={batchCompleteFeedbacks}
                disabled={localSelectedFeedbacks.length === 0}>
          批量完成铺贴
        </button>
      </div>
    </div>
    
    <div class="batch-table-container">
      <table class="batch-table">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input type="checkbox" checked={localSelectedFeedbacks.length === feedbackList.length && feedbackList.length > 0}
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
            <tr class={localSelectedFeedbacks.includes(feedback.id) ? 'selected' : ''}>
              <td>
                <input type="checkbox" checked={localSelectedFeedbacks.includes(feedback.id)}
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
