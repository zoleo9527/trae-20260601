<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getAllReservations, 
    getAllOrders, 
    getAllInventory,
    getAllRooms,
    getAllLogs,
    getUserFromStorage
  } from '$lib/database'
  import { 
    Calendar, AlertTriangle, Clock, Users, Package, CheckCircle, 
    XCircle, ArrowRight, AlertCircle, History, BedDouble, ChefHat, ClipboardList,
    AlertOctagon, DollarSign, Users2
  } from 'lucide-svelte'
  
  let checkInToday: any[] = []
  let checkOutToday: any[] = []
  let pendingOrders: any[] = []
  let lowStockItems: any[] = []
  let pendingReservations: any[] = []
  let rooms: any[] = []
  let logs: any[] = []
  
  let highRiskItems: any[] = []
  let overbookingRisks: any[] = []
  let depositIssues: any[] = []
  
  let currentUser = getUserFromStorage()

  onMount(async () => {
    await loadData()
  })

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    
    const [reservations, orders, inventory, roomsData, logsData] = await Promise.all([
      getAllReservations(),
      getAllOrders(),
      getAllInventory(),
      getAllRooms(),
      getAllLogs()
    ])
    
    rooms = roomsData
    
    checkInToday = reservations.filter(r => r.check_in === today && r.status === 'pending')
    checkOutToday = reservations.filter(r => r.check_out === today && r.status === 'checked_in')
    pendingOrders = orders.filter(o => o.status === 'pending')
    lowStockItems = inventory.filter(i => i.quantity < i.min_stock)
    pendingReservations = reservations.filter(r => r.status === 'pending')
    
    highRiskItems = inventory.filter(i => i.quantity <= i.min_stock * 0.5)
    
    overbookingRisks = detectOverbooking(reservations, rooms, today, tomorrow)
    
    depositIssues = detectDepositIssues(reservations)
    
    for (const res of checkInToday) {
      const room = rooms.find(r => r.id === res.room_id)
      if (room) res.room_name = room.name
    }
    
    for (const res of checkOutToday) {
      const room = rooms.find(r => r.id === res.room_id)
      if (room) res.room_name = room.name
    }
    
    for (const res of pendingReservations) {
      const room = rooms.find(r => r.id === res.room_id)
      if (room) res.room_name = room.name
    }
    
    for (const risk of overbookingRisks) {
      const room = rooms.find(r => r.id === risk.room_id)
      if (room) risk.room_name = room.name
    }
    
    for (const issue of depositIssues) {
      const room = rooms.find(r => r.id === issue.room_id)
      if (room) issue.room_name = room.name
    }
    
    logs = logsData.slice(0, 10).map(log => {
      const room = rooms.find(r => r.id === log.room_id)
      return { ...log, room_name: room?.name || `房间 ${log.room_id}` }
    })
  }

  function detectOverbooking(reservations: any[], rooms: any[], date1: string, date2: string): any[] {
    const risks: any[] = []
    const holidays = ['2026-01-01', '2026-01-25', '2026-01-26', '2026-01-27', '2026-04-04', '2026-04-05', '2026-05-01', '2026-06-07', '2026-09-13', '2026-10-01', '2026-10-02', '2026-10-03']
    
    for (const room of rooms) {
      const roomReservations = reservations.filter(r => 
        r.room_id === room.id && 
        r.status !== 'completed' &&
        ((r.check_in <= date2 && r.check_out >= date1) || holidays.some(h => h >= r.check_in && h <= r.check_out))
      )
      
      if (roomReservations.length > 1) {
        risks.push({
          room_id: room.id,
          room_name: room.name,
          conflict_count: roomReservations.length,
          guests: roomReservations.map(r => r.guest_name).join(', '),
          is_holiday: holidays.some(h => roomReservations.some(r => h >= r.check_in && h <= r.check_out))
        })
      }
    }
    
    return risks
  }

  function detectDepositIssues(reservations: any[]): any[] {
    const issues: any[] = []
    
    for (const res of reservations) {
      if (res.status === 'checked_in' && res.deposit === 0) {
        issues.push({
          room_id: res.room_id,
          guest_name: res.guest_name,
          check_out: res.check_out,
          issue_type: 'no_deposit',
          severity: 'high'
        })
      }
      
      const depositRatio = res.deposit / (res.price * daysBetween(res.check_in, res.check_out))
      if (res.status === 'pending' && depositRatio < 0.3) {
        issues.push({
          room_id: res.room_id,
          guest_name: res.guest_name,
          check_in: res.check_in,
          deposit: res.deposit,
          expected: Math.round(res.price * daysBetween(res.check_in, res.check_out) * 0.3),
          issue_type: 'low_deposit',
          severity: 'medium'
        })
      }
    }
    
    return issues
  }

  function daysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) || 1
  }

  function handleQuickAction(type: string) {
    if (type === 'checkin') {
      window.location.href = '/rooms'
    } else if (type === 'inventory') {
      window.location.href = '/inventory'
    } else if (type === 'order') {
      window.location.href = '/orders'
    }
  }

  const statusLabels: Record<string, string> = {
    available: '空闲',
    occupied: '入住中',
    reserved: '已预订',
    cleaning: '打扫中'
  }
</script>

<div class="dashboard">
  <div class="header-section">
    <div class="date-display">
      <Calendar class="calendar-icon" />
      <div>
        <div class="date-text">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</div>
        <div class="greeting">今日工作概览</div>
      </div>
    </div>
    {#if currentUser}
    <div class="user-info">
      <Users class="user-icon" />
      <span>当前用户: {currentUser.username} ({currentUser.role === 'boss' ? '老板' : currentUser.role === 'chef' ? '后厨' : currentUser.role === 'housekeeper' ? '客房阿姨' : '员工'})</span>
    </div>
    {/if}
  </div>
  
  <div class="priority-section">
    <div class="priority-card urgent">
      <div class="priority-header">
        <AlertCircle class="priority-icon" />
        <span class="priority-title">紧急待处理</span>
      </div>
      <div class="priority-content">
        {#if checkInToday.length > 0 || checkOutToday.length > 0 || highRiskItems.length > 0 || overbookingRisks.length > 0 || depositIssues.length > 0}
          {#if checkInToday.length > 0}
            <div class="priority-item" on:click={() => handleQuickAction('checkin')}>
              <div class="item-count">{checkInToday.length}</div>
              <div class="item-info">
                <div class="item-title">今日入住</div>
                <div class="item-desc">{checkInToday.map(c => c.guest_name).join('、')}</div>
              </div>
              <ArrowRight class="arrow-icon" />
            </div>
          {/if}
          {#if checkOutToday.length > 0}
            <div class="priority-item" on:click={() => handleQuickAction('checkin')}>
              <div class="item-count">{checkOutToday.length}</div>
              <div class="item-info">
                <div class="item-title">今日退房</div>
                <div class="item-desc">{checkOutToday.map(c => c.guest_name).join('、')}</div>
              </div>
              <ArrowRight class="arrow-icon" />
            </div>
          {/if}
          {#if overbookingRisks.length > 0}
            <div class="priority-item danger" on:click={() => handleQuickAction('checkin')}>
              <div class="item-count">{overbookingRisks.length}</div>
              <div class="item-info">
                <div class="item-title">超订风险</div>
                <div class="item-desc">{overbookingRisks.map(r => r.room_name).join('、')}</div>
              </div>
              <ArrowRight class="arrow-icon" />
            </div>
          {/if}
          {#if depositIssues.length > 0}
            <div class="priority-item warning" on:click={() => handleQuickAction('checkin')}>
              <div class="item-count">{depositIssues.length}</div>
              <div class="item-info">
                <div class="item-title">押金异常</div>
                <div class="item-desc">{depositIssues.map(i => i.guest_name).join('、')}</div>
              </div>
              <ArrowRight class="arrow-icon" />
            </div>
          {/if}
          {#if highRiskItems.length > 0}
            <div class="priority-item danger" on:click={() => handleQuickAction('inventory')}>
              <div class="item-count">{highRiskItems.length}</div>
              <div class="item-info">
                <div class="item-title">库存告急</div>
                <div class="item-desc">{highRiskItems.map(i => i.name).join('、')}</div>
              </div>
              <ArrowRight class="arrow-icon" />
            </div>
          {/if}
        {:else}
          <div class="empty-priority">
            <CheckCircle class="empty-icon" />
            <span>暂无紧急事项</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <div class="stats-grid">
    <div 
      class="stat-card checkin"
      on:click={() => handleQuickAction('checkin')}
    >
      <div class="stat-header">
        <BedDouble class="stat-icon" />
        <div>
          <span class="stat-title">办理今日入住</span>
          <span class="stat-count">{checkInToday.length}</span>
        </div>
      </div>
      {#if checkInToday.length > 0}
        <div class="stat-content">
          {#each checkInToday.slice(0, 3) as item}
            <div class="task-item">
              <Users class="task-icon" />
              <span>{item.guest_name} - {item.room_name}</span>
            </div>
          {/each}
        </div>
        <div class="stat-action">立即办理 →</div>
      {:else}
        <div class="stat-empty">
          <CheckCircle class="empty-icon" />
          <span>暂无待入住</span>
        </div>
      {/if}
    </div>
    
    <div 
      class="stat-card checkout"
      on:click={() => handleQuickAction('checkin')}
    >
      <div class="stat-header">
        <Clock class="stat-icon" />
        <div>
          <span class="stat-title">办理今日退房</span>
          <span class="stat-count">{checkOutToday.length}</span>
        </div>
      </div>
      {#if checkOutToday.length > 0}
        <div class="stat-content">
          {#each checkOutToday.slice(0, 3) as item}
            <div class="task-item">
              <Users class="task-icon" />
              <span>{item.guest_name} - {item.room_name}</span>
            </div>
          {/each}
        </div>
        <div class="stat-action">立即办理 →</div>
      {:else}
        <div class="stat-empty">
          <CheckCircle class="empty-icon" />
          <span>暂无待退房</span>
        </div>
      {/if}
    </div>
    
    <div 
      class="stat-card order"
      on:click={() => handleQuickAction('order')}
    >
      <div class="stat-header">
        <ClipboardList class="stat-icon" />
        <div>
          <span class="stat-title">待处理订单</span>
          <span class="stat-count">{pendingOrders.length}</span>
        </div>
      </div>
      {#if pendingOrders.length > 0}
        <div class="stat-content">
          {#each pendingOrders.slice(0, 3) as item}
            <div class="task-item">
              <Package class="task-icon" />
              <span>桌号 {item.table_no}</span>
            </div>
          {/each}
        </div>
        <div class="stat-action">处理订单 →</div>
      {:else}
        <div class="stat-empty">
          <CheckCircle class="empty-icon" />
          <span>暂无待处理订单</span>
        </div>
      {/if}
    </div>
    
    <div 
      class="stat-card inventory"
      on:click={() => handleQuickAction('inventory')}
    >
      <div class="stat-header">
        <AlertTriangle class="stat-icon" />
        <div>
          <span class="stat-title">库存预警</span>
          <span class="stat-count">{lowStockItems.length}</span>
        </div>
      </div>
      {#if lowStockItems.length > 0}
        <div class="stat-content">
          {#each lowStockItems.slice(0, 3) as item}
            <div class="task-item warning">
              <AlertTriangle class="task-icon" />
              <span>{item.name}: {item.quantity}{item.unit}</span>
            </div>
          {/each}
        </div>
        <div class="stat-action">查看详情 →</div>
      {:else}
        <div class="stat-empty">
          <CheckCircle class="empty-icon" />
          <span>库存充足</span>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="section-row">
    <div class="section">
      <div class="section-header">
        <h2>今日入住名单</h2>
        <span class="section-count">{checkInToday.length} 位客人</span>
      </div>
      <div class="list-container">
        {#if checkInToday.length > 0}
          {#each checkInToday as item}
            <div class="list-item">
              <div class="item-info">
                <div class="item-name">{item.guest_name}</div>
                <div class="item-detail">{item.room_name} | {item.guests}人 | {item.phone}</div>
              </div>
              {#if item.deposit > 0}
              <div class="deposit-badge">已交押金 ¥{item.deposit}</div>
              {:else}
              <div class="deposit-badge warning">未交押金</div>
              {/if}
              <button class="btn-checkin" on:click={() => window.location.href = '/rooms'}>办理入住</button>
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <XCircle class="empty-icon" />
            <span>今日暂无待入住客人</span>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="section">
      <div class="section-header">
        <h2>今日退房名单</h2>
        <span class="section-count">{checkOutToday.length} 位客人</span>
      </div>
      <div class="list-container">
        {#if checkOutToday.length > 0}
          {#each checkOutToday as item}
            <div class="list-item">
              <div class="item-info">
                <div class="item-name">{item.guest_name}</div>
                <div class="item-detail">{item.room_name} | 押金¥{item.deposit}</div>
              </div>
              <button class="btn-checkout" on:click={() => window.location.href = '/rooms'}>办理退房</button>
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <XCircle class="empty-icon" />
            <span>今日暂无待退房客人</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  {#if overbookingRisks.length > 0 || depositIssues.length > 0}
  <div class="section-row">
    {#if overbookingRisks.length > 0}
    <div class="section warning">
      <div class="section-header">
        <AlertOctagon class="warning-icon" />
        <h2>节假日超订风险</h2>
        <span class="section-count">{overbookingRisks.length} 项</span>
      </div>
      <div class="list-container">
        {#each overbookingRisks as risk}
          <div class="list-item danger">
            <div class="risk-indicator"></div>
            <div class="item-info">
              <div class="item-name">{risk.room_name}</div>
              <div class="item-detail">
                冲突预订: {risk.conflict_count} 笔 | 
                客人: {risk.guests}
                {#if risk.is_holiday}
                <span class="holiday-tag">节假日</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    {/if}
    
    {#if depositIssues.length > 0}
    <div class="section warning">
      <div class="section-header">
        <DollarSign class="warning-icon" />
        <h2>押金异常提醒</h2>
        <span class="section-count">{depositIssues.length} 项</span>
      </div>
      <div class="list-container">
        {#each depositIssues as issue}
          <div class="list-item {issue.severity === 'high' ? 'danger' : 'warning'}">
            <div class="item-info">
              <div class="item-name">{issue.guest_name}</div>
              <div class="item-detail">
                {#if issue.issue_type === 'no_deposit'}
                  <span class="issue-type">未交押金</span>
                  入住中，退房日期: {issue.check_out}
                {:else}
                  <span class="issue-type">押金不足</span>
                  已交 ¥{issue.deposit}，建议至少 ¥{issue.expected}
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    {/if}
  </div>
  {/if}
  
  <div class="section-row">
    <div class="section">
      <div class="section-header">
        <h2>库存预警</h2>
        <span class="section-count">{lowStockItems.length} 项不足</span>
      </div>
      <div class="list-container">
        {#if lowStockItems.length > 0}
          {#each lowStockItems as item}
            <div class="list-item warning">
              <AlertTriangle class="warning-icon" />
              <div class="item-info">
                <div class="item-name">{item.name}</div>
                <div class="item-detail">当前: {item.quantity}{item.unit}，最低: {item.min_stock}{item.unit}</div>
              </div>
              <span class="stock-status">需采购</span>
            </div>
          {/each}
        {:else}
          <div class="empty-state success">
            <CheckCircle class="empty-icon" />
            <span>所有库存充足</span>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="section">
      <div class="section-header">
        <h2>最近变更记录</h2>
        <History class="section-icon" />
      </div>
      <div class="list-container">
        {#if logs.length > 0}
          {#each logs as log}
            <div class="list-item log-item">
              <div class="log-time">{new Date(log.changed_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
              <div class="log-content">
                <span class="log-room">{log.room_name}</span>
                <span class="log-action">→</span>
                <span class="log-status">{statusLabels[log.status] || log.status}</span>
              </div>
              <span class="log-operator">{log.changed_by}</span>
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <History class="empty-icon" />
            <span>暂无变更记录</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <div class="section full-width">
    <div class="section-header">
      <h2>今日待处理订单</h2>
      <span class="section-count">{pendingOrders.length} 笔</span>
    </div>
    <div class="orders-list">
      {#if pendingOrders.length > 0}
        {#each pendingOrders as order}
          <div class="order-card">
            <div class="order-info">
              <div class="order-table">桌号 {order.table_no}</div>
              <div class="order-dishes">
                {#each JSON.parse(order.dishes) as dish}
                  <span class="dish-tag">{dish.name} x{dish.quantity}</span>
                {/each}
              </div>
            </div>
            <div class="order-meta">
              <span class="order-time">{new Date(order.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              <span class="order-status">待处理</span>
            </div>
          </div>
        {/each}
      {:else}
        <div class="empty-state">
          <ClipboardList class="empty-icon" />
          <span>暂无待处理订单</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  .header-section {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .date-display {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    color: white;
    flex: 1;
    margin-right: 1rem;
  }
  
  .calendar-icon {
    width: 48px;
    height: 48px;
  }
  
  .date-text {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .greeting {
    font-size: 1rem;
    opacity: 0.9;
    margin-top: 0.25rem;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .user-icon {
    width: 24px;
    height: 24px;
    color: #666;
  }
  
  .priority-section {
    margin-bottom: 1.5rem;
  }
  
  .priority-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  
  .priority-card.urgent {
    border-left: 4px solid #F44336;
  }
  
  .priority-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: #FFF3E0;
  }
  
  .priority-icon {
    width: 24px;
    height: 24px;
    color: #F44336;
  }
  
  .priority-title {
    font-weight: 600;
    color: #E53935;
    font-size: 1.1rem;
  }
  
  .priority-content {
    padding: 1rem 1.5rem;
  }
  
  .priority-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .priority-item:hover {
    background: #e9ecef;
  }
  
  .priority-item.danger {
    background: #FFEBEE;
    border-left: 3px solid #F44336;
  }
  
  .priority-item.warning {
    background: #FFF8E1;
    border-left: 3px solid #FF9800;
  }
  
  .item-count {
    width: 36px;
    height: 36px;
    background: #4CAF50;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1rem;
    margin-right: 1rem;
  }
  
  .priority-item.danger .item-count {
    background: #F44336;
  }
  
  .priority-item.warning .item-count {
    background: #FF9800;
  }
  
  .item-info {
    flex: 1;
  }
  
  .item-title {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .item-desc {
    font-size: 0.85rem;
    color: #666;
  }
  
  .arrow-icon {
    width: 20px;
    height: 20px;
    color: #999;
  }
  
  .empty-priority {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    color: #999;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: all 0.3s;
    border-left: 4px solid #e0e0e0;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
  
  .stat-card.checkin { border-left-color: #4CAF50; }
  .stat-card.checkout { border-left-color: #2196F3; }
  .stat-card.order { border-left-color: #FF9800; }
  .stat-card.inventory { border-left-color: #F44336; }
  
  .stat-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .stat-icon {
    width: 28px;
    height: 28px;
    color: #666;
  }
  
  .stat-header div {
    flex: 1;
  }
  
  .stat-title {
    display: block;
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
  }
  
  .stat-count {
    font-size: 1.75rem;
    font-weight: bold;
    color: #666;
  }
  
  .stat-content {
    margin-bottom: 1rem;
  }
  
  .task-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    color: #555;
    font-size: 0.9rem;
  }
  
  .task-item.warning {
    color: #F44336;
  }
  
  .task-icon {
    width: 16px;
    height: 16px;
  }
  
  .stat-action {
    color: #2196F3;
    font-size: 0.85rem;
    font-weight: 500;
  }
  
  .stat-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 0;
    color: #999;
  }
  
  .empty-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 0.5rem;
  }
  
  .section-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  }
  
  .section.warning {
    border-left: 4px solid #FF9800;
  }
  
  .section.full-width {
    grid-column: 1 / -1;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f0f0f0;
  }
  
  .section-header h2 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .section-count {
    font-size: 0.85rem;
    color: #999;
    background: #f5f5f5;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
  }
  
  .section-icon {
    width: 18px;
    height: 18px;
    color: #999;
  }
  
  .warning-icon {
    width: 20px;
    height: 20px;
    color: #FF9800;
  }
  
  .list-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    transition: all 0.3s;
  }
  
  .list-item:hover {
    background: #e9ecef;
  }
  
  .list-item.warning {
    background: #fff3e0;
    border-left: 4px solid #FF9800;
  }
  
  .list-item.danger {
    background: #FFEBEE;
    border-left: 4px solid #F44336;
  }
  
  .list-item.log-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .risk-indicator {
    width: 8px;
    height: 8px;
    background: #F44336;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .log-time {
    font-size: 0.8rem;
    color: #999;
  }
  
  .log-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .log-room {
    font-weight: 600;
    color: #333;
  }
  
  .log-action {
    color: #999;
  }
  
  .log-status {
    padding: 0.2rem 0.5rem;
    background: #E8F5E9;
    color: #4CAF50;
    border-radius: 4px;
    font-size: 0.8rem;
  }
  
  .log-operator {
    font-size: 0.8rem;
    color: #999;
    padding: 0.2rem 0.5rem;
    background: #f0f0f0;
    border-radius: 4px;
    align-self: flex-end;
  }
  
  .item-info {
    flex: 1;
  }
  
  .item-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .item-detail {
    font-size: 0.85rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .issue-type {
    background: #FF9800;
    color: white;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }
  
  .holiday-tag {
    background: #E91E63;
    color: white;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }
  
  .deposit-badge {
    background: #4CAF50;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 0.75rem;
  }
  
  .deposit-badge.warning {
    background: #FF9800;
  }
  
  .btn-checkin {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s;
  }
  
  .btn-checkin:hover {
    background: #45a049;
  }
  
  .btn-checkout {
    background: #2196F3;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.3s;
  }
  
  .btn-checkout:hover {
    background: #1976D2;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    color: #999;
  }
  
  .empty-state.success {
    color: #4CAF50;
  }
  
  .stock-status {
    background: #F44336;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }
  
  .orders-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .order-card {
    flex: 1;
    min-width: 280px;
    max-width: 400px;
    background: #f8f9fa;
    border-radius: 8px;
    padding: 1rem;
  }
  
  .order-info {
    margin-bottom: 0.75rem;
  }
  
  .order-table {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
  }
  
  .order-dishes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .dish-tag {
    background: white;
    padding: 0.3rem 0.7rem;
    border-radius: 4px;
    font-size: 0.85rem;
    color: #666;
  }
  
  .order-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 0.75rem;
    border-top: 1px solid #e9ecef;
  }
  
  .order-time {
    font-size: 0.8rem;
    color: #999;
  }
  
  .order-status {
    background: #FF9800;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }
</style>