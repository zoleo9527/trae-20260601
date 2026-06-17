<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getAllInventory, 
    updateInventoryStock, 
    addInventoryItem,
    deleteInventoryItem
  } from '$lib/database'
  import { 
    Package, AlertTriangle, Plus, X, Search, Filter,
    TrendingDown, TrendingUp, Edit2, Trash2
  } from 'lucide-svelte'
  
  let inventory: any[] = []
  let showAddModal = false
  let searchQuery = ''
  let filterType = 'all'
  let newItem = { name: '', quantity: 0, min_stock: 0, unit: '斤' }
  
  const units = ['斤', '个', '只', '条', '桶', '袋', '盒']
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    inventory = await getAllInventory()
  }
  
  function openAddModal() {
    newItem = { name: '', quantity: 0, min_stock: 0, unit: '斤' }
    showAddModal = true
  }
  
  function closeAddModal() {
    showAddModal = false
  }
  
  async function handleAddItem() {
    if (!newItem.name || newItem.quantity < 0 || newItem.min_stock < 0) {
      alert('请填写完整信息')
      return
    }
    
    await addInventoryItem(newItem.name, newItem.quantity, newItem.min_stock, newItem.unit)
    await loadData()
    closeAddModal()
  }
  
  async function handleUpdateStock(id: number, delta: number) {
    await updateInventoryStock(id, delta)
    await loadData()
  }
  
  async function handleDeleteItem(id: number) {
    if (confirm('确定删除该食材吗？')) {
      await deleteInventoryItem(id)
      await loadData()
    }
  }
  
  function getFilteredItems() {
    let filtered = inventory
    
    if (searchQuery) {
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    if (filterType === 'low') {
      filtered = filtered.filter(i => i.quantity < i.min_stock)
    } else if (filterType === 'normal') {
      filtered = filtered.filter(i => i.quantity >= i.min_stock)
    }
    
    return filtered
  }
  
  function getLowStockCount() {
    return inventory.filter(i => i.quantity < i.min_stock).length
  }
</script>

<div class="inventory-page">
  <div class="page-header">
    <div class="header-info">
      <h1>食材库存</h1>
      <p>食材库存管理与预警</p>
    </div>
    <div class="status-summary">
      <div class="status-item warning">
        <AlertTriangle class="status-icon" />
        <span>库存不足 {getLowStockCount()}</span>
      </div>
      <div class="status-item normal">
        <Package class="status-icon" />
        <span>库存充足 {inventory.length - getLowStockCount()}</span>
      </div>
    </div>
    <button class="btn-add" on:click={openAddModal}>
      <Plus class="btn-icon" />
      新增食材
    </button>
  </div>
  
  <div class="filter-bar">
    <div class="search-box">
      <Search class="search-icon" />
      <input 
        type="text" 
        placeholder="搜索食材名称..." 
        bind:value={searchQuery}
      />
    </div>
    <div class="filter-group">
      <Filter class="filter-icon" />
      <select bind:value={filterType}>
        <option value="all">全部状态</option>
        <option value="low">库存不足</option>
        <option value="normal">库存充足</option>
      </select>
    </div>
  </div>
  
  <div class="inventory-table">
    <table>
      <thead>
        <tr>
          <th>食材名称</th>
          <th>当前库存</th>
          <th>最低库存</th>
          <th>单位</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {#each getFilteredItems() as item}
          <tr class={item.quantity < item.min_stock ? 'low-stock' : ''}>
            <td>
              {#if item.quantity < item.min_stock}
                <AlertTriangle class="warning-icon" />
              {/if}
              {item.name}
            </td>
            <td class="quantity-cell">
              <div class="quantity-display">{item.quantity}</div>
              <div class="quantity-buttons">
                <button 
                  class="qty-btn minus" 
                  on:click={() => handleUpdateStock(item.id, -1)}
                >
                  -1
                </button>
                <button 
                  class="qty-btn plus" 
                  on:click={() => handleUpdateStock(item.id, 1)}
                >
                  +1
                </button>
              </div>
            </td>
            <td>{item.min_stock}</td>
            <td>{item.unit}</td>
            <td>
              <span 
                class="status-badge"
                class:warning={item.quantity < item.min_stock}
                class:normal={item.quantity >= item.min_stock}
              >
                {item.quantity < item.min_stock ? '库存不足' : '充足'}
              </span>
            </td>
            <td class="actions">
              <button class="action-btn edit">
                <Edit2 class="action-icon" />
              </button>
              <button 
                class="action-btn delete" 
                on:click={() => handleDeleteItem(item.id)}
              >
                <Trash2 class="action-icon" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    
    {#if getFilteredItems().length === 0}
      <div class="empty-state">
        <Package class="empty-icon" />
        <span>暂无食材数据</span>
      </div>
    {/if}
  </div>
  
  {#if showAddModal}
    <div class="modal-overlay" on:click={closeAddModal}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h2>新增食材</h2>
          <button class="close-btn" on:click={closeAddModal}>
            <X class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>食材名称</label>
            <input 
              type="text" 
              placeholder="例如：土鸡" 
              bind:value={newItem.name}
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>初始数量</label>
              <input 
                type="number" 
                min="0" 
                bind:value={newItem.quantity}
              />
            </div>
            <div class="form-group">
              <label>最低库存</label>
              <input 
                type="number" 
                min="0" 
                bind:value={newItem.min_stock}
              />
            </div>
            <div class="form-group">
              <label>单位</label>
              <select bind:value={newItem.unit}>
                {#each units as unit}
                  <option value={unit}>{unit}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" on:click={closeAddModal}>取消</button>
          <button class="btn-submit" on:click={handleAddItem}>确认添加</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .inventory-page {
    max-width: 1200px;
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
    padding: 0.5rem 1rem;
    border-radius: 8px;
  }
  
  .status-item.warning {
    background: #FFF3E0;
    color: #F44336;
  }
  
  .status-item.normal {
    background: #E8F5E9;
    color: #4CAF50;
  }
  
  .status-icon {
    width: 18px;
    height: 18px;
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
  
  .inventory-table {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  thead {
    background: #f8f9fa;
  }
  
  th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: #666;
    font-size: 0.9rem;
  }
  
  td {
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
  }
  
  tr:hover {
    background: #fafafa;
  }
  
  tr.low-stock {
    background: #FFF3E0;
  }
  
  tr.low-stock:hover {
    background: #FFE0B2;
  }
  
  .warning-icon {
    width: 16px;
    height: 16px;
    color: #F44336;
    margin-right: 0.5rem;
  }
  
  .quantity-cell {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .quantity-display {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    min-width: 40px;
  }
  
  .quantity-buttons {
    display: flex;
    gap: 0.25rem;
  }
  
  .qty-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: all 0.3s;
  }
  
  .qty-btn.minus {
    background: #FFEBEE;
    color: #F44336;
  }
  
  .qty-btn.minus:hover {
    background: #FFCDD2;
  }
  
  .qty-btn.plus {
    background: #E8F5E9;
    color: #4CAF50;
  }
  
  .qty-btn.plus:hover {
    background: #C8E6C9;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .status-badge.warning {
    background: #FFEBEE;
    color: #F44336;
  }
  
  .status-badge.normal {
    background: #E8F5E9;
    color: #4CAF50;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .action-btn.edit {
    background: #E3F2FD;
  }
  
  .action-btn.edit:hover {
    background: #BBDEFB;
  }
  
  .action-btn.delete {
    background: #FFEBEE;
  }
  
  .action-btn.delete:hover {
    background: #FFCDD2;
  }
  
  .action-icon {
    width: 16px;
    height: 16px;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem;
    color: #999;
  }
  
  .empty-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
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
    max-width: 450px;
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
    margin-bottom: 1rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
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
  
  .btn-icon {
    width: 18px;
    height: 18px;
  }
</style>
