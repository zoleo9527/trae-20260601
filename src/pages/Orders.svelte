<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getAllOrders, 
    getAllInventory,
    updateOrderStatus,
    addOrder
  } from '$lib/database'
  import { 
    ClipboardList, ChefHat, Clock, CheckCircle, 
    AlertTriangle, Plus, X, Search, Filter, Flame
  } from 'lucide-svelte'
  
  let orders: any[] = []
  let inventory: any[] = []
  let showAddModal = false
  let searchQuery = ''
  let statusFilter = 'all'
  let newOrder = { table_no: '', dishes: [] as any[] }
  
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '待处理', color: '#FF9800', bg: '#FFF3E0' },
    cooking: { label: '烹饪中', color: '#2196F3', bg: '#E3F2FD' },
    completed: { label: '已完成', color: '#4CAF50', bg: '#E8F5E9' }
  }
  
  const menuItems = [
    { name: '红烧肉', price: 48 },
    { name: '炒青菜', price: 18 },
    { name: '土鸡汤', price: 68 },
    { name: '清蒸鱼', price: 58 },
    { name: '豆腐煲', price: 28 },
    { name: '腊肉炒饭', price: 22 },
    { name: '凉拌黄瓜', price: 12 },
    { name: '农家小炒肉', price: 38 },
    { name: '蒜蓉西兰花', price: 22 },
    { name: '西红柿炒蛋', price: 20 }
  ]
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    const [ordersData, inventoryData] = await Promise.all([
      getAllOrders(),
      getAllInventory()
    ])
    orders = ordersData
    inventory = inventoryData
  }
  
  function openAddModal() {
    newOrder = { table_no: '', dishes: [] }
    showAddModal = true
  }
  
  function closeAddModal() {
    showAddModal = false
  }
  
  function addDish(dishName: string) {
    const existing = newOrder.dishes.find(d => d.name === dishName)
    if (existing) {
      existing.quantity++
    } else {
      newOrder.dishes.push({ name: dishName, quantity: 1 })
    }
  }
  
  function removeDish(dishName: string) {
    newOrder.dishes = newOrder.dishes.filter(d => d.name !== dishName)
  }
  
  function updateDishQuantity(dishName: string, delta: number) {
    const dish = newOrder.dishes.find(d => d.name === dishName)
    if (dish) {
      dish.quantity = Math.max(1, dish.quantity + delta)
    }
  }
  
  async function submitOrder() {
    if (!newOrder.table_no || newOrder.dishes.length === 0) {
      alert('请填写桌号并选择菜品')
      return
    }
    
    const dishesJson = JSON.stringify(newOrder.dishes)
    const result = await addOrder(newOrder.table_no, dishesJson, true)
    
    if (!result.success) {
      alert(result.message || '下单失败')
      return
    }
    
    await loadData()
    closeAddModal()
    alert('下单成功')
  }
  
  async function handleStatusChange(orderId: number, status: string) {
    await updateOrderStatus(orderId, status)
    await loadData()
  }
  
  function getFilteredOrders() {
    return orders.filter(order => {
      const matchesSearch = order.table_no.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }
  
  function getStatusCounts() {
    return {
      pending: orders.filter(o => o.status === 'pending').length,
      cooking: orders.filter(o => o.status === 'cooking').length,
      completed: orders.filter(o => o.status === 'completed').length
    }
  }
</script>

<div class="orders-page">
  <div class="page-header">
    <div class="header-info">
      <h1>订单管理</h1>
      <p>包间预订与菜品订单处理</p>
    </div>
    <div class="status-summary">
      <div class="status-item">
        <span class="status-dot" style="background: #FF9800"></span>
        <span>待处理 {getStatusCounts().pending}</span>
      </div>
      <div class="status-item">
        <span class="status-dot" style="background: #2196F3"></span>
        <span>烹饪中 {getStatusCounts().cooking}</span>
      </div>
      <div class="status-item">
        <span class="status-dot" style="background: #4CAF50"></span>
        <span>已完成 {getStatusCounts().completed}</span>
      </div>
    </div>
    <button class="btn-add" on:click={openAddModal}>
      <Plus class="btn-icon" />
      新增订单
    </button>
  </div>
  
  <div class="filter-bar">
    <div class="search-box">
      <Search class="search-icon" />
      <input 
        type="text" 
        placeholder="搜索桌号..." 
        bind:value={searchQuery}
      />
    </div>
    <div class="filter-group">
      <Filter class="filter-icon" />
      <select bind:value={statusFilter}>
        <option value="all">全部状态</option>
        {#each Object.keys(statusConfig) as status}
          <option value={status}>{statusConfig[status].label}</option>
        {/each}
      </select>
    </div>
  </div>
  
  <div class="orders-list">
    {#each getFilteredOrders() as order}
      <div class="order-card">
        <div class="order-header">
          <div class="order-table">
            <ClipboardList class="table-icon" />
            <span>桌号 {order.table_no}</span>
          </div>
          <span 
            class="status-badge"
            style="background: {statusConfig[order.status].bg}; color: {statusConfig[order.status].color}"
          >
            {statusConfig[order.status].label}
          </span>
        </div>
        
        <div class="order-content">
          <div class="dishes-list">
            {#each JSON.parse(order.dishes) as dish}
              <div class="dish-item">
                <span>{dish.name}</span>
                <span class="quantity">x{dish.quantity}</span>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="order-footer">
          <span class="order-time">{new Date(order.created_at).toLocaleString('zh-CN')}</span>
          <div class="action-buttons">
            {#if order.status === 'pending'}
              <button 
                class="btn-action cooking" 
                on:click={() => handleStatusChange(order.id, 'cooking')}
              >
                <Flame class="btn-icon" />
                开始烹饪
              </button>
            {/if}
            {#if order.status === 'cooking'}
              <button 
                class="btn-action complete" 
                on:click={() => handleStatusChange(order.id, 'completed')}
              >
                <CheckCircle class="btn-icon" />
                完成上菜
              </button>
            {/if}
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  {#if showAddModal}
    <div class="modal-overlay" on:click={closeAddModal}>
      <div class="modal-content add-order-modal" on:click|stopPropagation>
        <div class="modal-header">
          <h2>新增订单</h2>
          <button class="close-btn" on:click={closeAddModal}>
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>桌号</label>
            <input 
              type="text" 
              placeholder="例如：A1" 
              bind:value={newOrder.table_no}
            />
          </div>
          
          <div class="form-group">
            <label>选择菜品</label>
            <div class="menu-grid">
              {#each menuItems as item}
                <button 
                  class="menu-item {newOrder.dishes.find(d => d.name === item.name) ? 'selected' : ''}"
                  on:click={() => addDish(item.name)}
                >
                  {item.name}
                  <span class="menu-price">¥{item.price}</span>
                </button>
              {/each}
            </div>
          </div>
          
          {#if newOrder.dishes.length > 0}
            <div class="selected-dishes">
              <label>已选菜品</label>
              {#each newOrder.dishes as dish}
                <div class="selected-dish">
                  <span>{dish.name}</span>
                  <div class="quantity-control">
                    <button on:click={() => updateDishQuantity(dish.name, -1)}>-</button>
                    <span>{dish.quantity}</span>
                    <button on:click={() => updateDishQuantity(dish.name, 1)}>+</button>
                  </div>
                  <button class="remove-dish" on:click={() => removeDish(dish.name)}>
                    <X class="remove-icon" />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" on:click={closeAddModal}>取消</button>
          <button class="btn-submit" on:click={submitOrder}>提交订单</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .orders-page {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1.5rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .header-info h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
  }
  
  .header-info p {
    color: #666;
    margin: 0;
  }
  
  .status-summary {
    display: flex;
    gap: 1.5rem;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .btn-add {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-add:hover {
    background: #45a049;
  }
  
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .search-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #f5f5f5;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    flex: 1;
    max-width: 300px;
  }
  
  .search-icon {
    width: 18px;
    height: 18px;
    color: #999;
  }
  
  .search-box input {
    border: none;
    background: transparent;
    width: 100%;
    font-size: 0.9rem;
  }
  
  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .filter-icon {
    width: 18px;
    height: 18px;
    color: #999;
  }
  
  .filter-group select {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .order-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .order-table {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  
  .table-icon {
    width: 20px;
    height: 20px;
    color: #4CAF50;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .dishes-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .dish-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: #f5f5f5;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
  }
  
  .quantity {
    color: #666;
  }
  
  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f0f0f0;
  }
  
  .order-time {
    font-size: 0.85rem;
    color: #999;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-action.cooking {
    background: #2196F3;
    color: white;
  }
  
  .btn-action.cooking:hover {
    background: #1976D2;
  }
  
  .btn-action.complete {
    background: #4CAF50;
    color: white;
  }
  
  .btn-action.complete:hover {
    background: #45a049;
  }
  
  .btn-icon {
    width: 16px;
    height: 16px;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .add-order-modal {
    max-height: 85vh;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .modal-header h2 {
    margin: 0;
  }
  
  .close-btn {
    background: #f5f5f5;
    border: none;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
  }
  
  .close-icon {
    width: 20px;
    height: 20px;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
  }
  
  .menu-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
  }
  
  .menu-item {
    padding: 0.75rem;
    background: #f5f5f5;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    text-align: left;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .menu-item:hover {
    background: #eee;
  }
  
  .menu-item.selected {
    border-color: #4CAF50;
    background: #E8F5E9;
  }
  
  .menu-price {
    font-size: 0.85rem;
    color: #4CAF50;
    font-weight: 600;
  }
  
  .selected-dishes {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
  }
  
  .selected-dishes label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }
  
  .selected-dish {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e9ecef;
  }
  
  .selected-dish:last-child {
    border-bottom: none;
  }
  
  .quantity-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .quantity-control button {
    width: 28px;
    height: 28px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .remove-dish {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
  }
  
  .remove-icon {
    width: 16px;
    height: 16px;
    color: #999;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #f0f0f0;
  }
  
  .btn-cancel {
    padding: 0.75rem 1.5rem;
    background: #f5f5f5;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .btn-submit {
    padding: 0.75rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
  }
</style>
