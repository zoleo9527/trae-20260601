<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { getAllRooms, getAllReservations, getAllInventory, getAllLogs, getUserFromStorage } from '$lib/database'
  import { Calendar, Users, AlertTriangle, Clock, ChevronRight, CheckCircle, XCircle, Package } from 'lucide-svelte'

  let rooms: any[] = []
  let reservations: any[] = []
  let inventory: any[] = []
  let logs: any[] = []
  let currentUser: any = null
  let loading = true

  let todayCheckIns: any[] = []
  let todayCheckOuts: any[] = []
  let lowStockItems: any[] = []
  let overbookingRisks: any[] = []
  let depositIssues: any[] = []
  let recentChanges: any[] = []

  const today = new Date().toISOString().split('T')[0]

  function detectOverbooking(reservations: any[]) {
    const risks: any[] = []
    const roomReservations: Record<number, any[]> = {}
    
    for (const r of reservations) {
      if (!roomReservations[r.room_id]) roomReservations[r.room_id] = []
      roomReservations[r.room_id].push(r)
    }
    
    for (const roomId in roomReservations) {
      const roomRes = roomReservations[roomId]
      for (let i = 0; i < roomRes.length; i++) {
        for (let j = i + 1; j < roomRes.length; j++) {
          const r1 = roomRes[i]
          const r2 = roomRes[j]
          const overlap = r1.check_in <= r2.check_out && r2.check_in <= r1.check_out
          if (overlap && r1.status === 'pending' && r2.status === 'pending') {
            risks.push({
              roomId,
              guest1: r1.guest_name,
              guest2: r2.guest_name,
              date1: r1.check_in,
              date2: r2.check_in
            })
          }
        }
      }
    }
    return risks
  }

  function detectDepositIssues(reservations: any[], rooms: any[]) {
    const issues: any[] = []
    for (const r of reservations) {
      const room = rooms.find(room => room.id === r.room_id)
      if (room && r.status === 'checked_in') {
        const expectedDeposit = room.price * 0.3
        if (r.deposit === 0) {
          issues.push({
            reservation: r,
            type: 'no_deposit',
            message: `${r.guest_name} 未交押金入住`
          })
        } else if (r.deposit < expectedDeposit) {
          issues.push({
            reservation: r,
            type: 'low_deposit',
            message: `${r.guest_name} 押金不足（${r.deposit}元，建议${expectedDeposit}元）`
          })
        }
      }
    }
    return issues
  }

  onMount(async () => {
    currentUser = getUserFromStorage()
    if (!currentUser) {
      goto('/login')
      return
    }

    try {
      rooms = await getAllRooms()
      reservations = await getAllReservations()
      inventory = await getAllInventory()
      logs = await getAllLogs()

      todayCheckIns = reservations.filter(r => r.check_in === today && r.status === 'pending')
      todayCheckOuts = reservations.filter(r => r.check_out === today && r.status === 'checked_in')
      lowStockItems = inventory.filter(i => i.quantity < i.min_stock)
      overbookingRisks = detectOverbooking(reservations)
      depositIssues = detectDepositIssues(reservations, rooms)
      recentChanges = logs.slice(0, 5)
    } catch (e) {
      console.error('Failed to load data:', e)
    }
    
    loading = false
  })

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
</script>

{#if loading}
  <div class="loading">
    <div class="spinner"></div>
    <p>加载中...</p>
  </div>
{:else}
  <div class="home-page">
    <div class="section urgent-tasks">
      <h2><AlertTriangle class="section-icon" /> 紧急待处理</h2>
      <div class="task-grid">
        {#if todayCheckIns.length > 0}
          <div class="task-card checkin" on:click={() => goto('/rooms')}>
            <div class="task-header">
              <Calendar class="task-icon" />
              <span class="task-title">今日待入住</span>
            </div>
            <div class="task-count">{todayCheckIns.length}</div>
            <div class="task-detail">
              {#each todayCheckIns.slice(0, 3) as r}
                <div class="task-item">{r.guest_name} - {r.phone}</div>
              {/each}
            </div>
          </div>
        {/if}

        {#if todayCheckOuts.length > 0}
          <div class="task-card checkout" on:click={() => goto('/rooms')}>
            <div class="task-header">
              <Clock class="task-icon" />
              <span class="task-title">今日待退房</span>
            </div>
            <div class="task-count">{todayCheckOuts.length}</div>
            <div class="task-detail">
              {#each todayCheckOuts.slice(0, 3) as r}
                <div class="task-item">{r.guest_name} - 房间{r.room_id}</div>
              {/each}
            </div>
          </div>
        {/if}

        {#if lowStockItems.length > 0}
          <div class="task-card stock" on:click={() => goto('/inventory')}>
            <div class="task-header">
              <Package class="task-icon" />
              <span class="task-title">库存预警</span>
            </div>
            <div class="task-count">{lowStockItems.length}</div>
            <div class="task-detail">
              {#each lowStockItems.slice(0, 3) as item}
                <div class="task-item">{item.name}: {item.quantity}/{item.min_stock}{item.unit}</div>
              {/each}
            </div>
          </div>
        {/if}

        {#if overbookingRisks.length > 0}
          <div class="task-card risk" on:click={() => goto('/rooms')}>
            <div class="task-header">
              <AlertTriangle class="task-icon warning" />
              <span class="task-title">超订风险</span>
            </div>
            <div class="task-count warning">{overbookingRisks.length}</div>
            <div class="task-detail">
              {#each overbookingRisks.slice(0, 2) as risk}
                <div class="task-item">房间{risk.roomId}: {risk.guest1} 与 {risk.guest2} 冲突</div>
              {/each}
            </div>
          </div>
        {/if}

        {#if depositIssues.length > 0}
          <div class="task-card deposit" on:click={() => goto('/rooms')}>
            <div class="task-header">
              <AlertTriangle class="task-icon warning" />
              <span class="task-title">押金异常</span>
            </div>
            <div class="task-count warning">{depositIssues.length}</div>
            <div class="task-detail">
              {#each depositIssues.slice(0, 2) as issue}
                <div class="task-item">{issue.message}</div>
              {/each}
            </div>
          </div>
        {/if}

        {#if todayCheckIns.length === 0 && todayCheckOuts.length === 0 && lowStockItems.length === 0 && overbookingRisks.length === 0 && depositIssues.length === 0}
          <div class="task-card empty">
            <div class="task-header">
              <CheckCircle class="task-icon success" />
              <span class="task-title">一切正常</span>
            </div>
            <div class="task-count success">0</div>
            <div class="task-detail">
              <div class="task-item">当前无紧急待处理事项</div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="section recent-changes">
      <h2><Clock class="section-icon" /> 最近变更</h2>
      <div class="changes-list">
        {#if recentChanges.length > 0}
          {#each recentChanges as log}
            <div class="change-item">
              <div class="change-info">
                <span class="change-room">房间 {log.room_id}</span>
                <span class="change-status" class:available={log.status === 'available'} class:occupied={log.status === 'occupied'} class:cleaning={log.status === 'cleaning'}>
                  {log.status === 'available' ? '空闲' : log.status === 'occupied' ? '入住' : log.status === 'cleaning' ? '打扫中' : log.status}
                </span>
              </div>
              <div class="change-meta">
                <span class="change-by">{log.changed_by}</span>
                <span class="change-time">{formatTime(log.changed_at)}</span>
              </div>
            </div>
          {/each}
        {:else}
          <div class="empty-state">
            <p>暂无变更记录</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="section stats">
      <h2><Users class="section-icon" /> 今日概况</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{rooms.filter(r => r.status === 'occupied').length}</div>
          <div class="stat-label">入住房间</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{rooms.filter(r => r.status === 'available').length}</div>
          <div class="stat-label">空闲房间</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{rooms.filter(r => r.status === 'cleaning').length}</div>
          <div class="stat-label">打扫中</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{reservations.filter(r => r.status === 'pending').length}</div>
          <div class="stat-label">待处理预订</div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #4CAF50;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .home-page {
    display: grid;
    gap: 2rem;
  }

  .section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .section h2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #333;
  }

  .section-icon {
    width: 24px;
    height: 24px;
    color: #4CAF50;
  }

  .task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .task-card {
    padding: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
  }

  .task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .task-card.checkin {
    background: #E3F2FD;
    border-color: #2196F3;
  }

  .task-card.checkout {
    background: #FFF3E0;
    border-color: #FF9800;
  }

  .task-card.stock {
    background: #FFEBEE;
    border-color: #F44336;
  }

  .task-card.risk {
    background: #FCE4EC;
    border-color: #E91E63;
  }

  .task-card.deposit {
    background: #FFF8E1;
    border-color: #FFC107;
  }

  .task-card.empty {
    background: #E8F5E9;
    border-color: #4CAF50;
  }

  .task-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .task-icon {
    width: 20px;
    height: 20px;
  }

  .task-icon.warning {
    color: #F44336;
  }

  .task-icon.success {
    color: #4CAF50;
  }

  .task-title {
    font-weight: 600;
    color: #333;
  }

  .task-count {
    font-size: 2rem;
    font-weight: bold;
    color: #333;
  }

  .task-count.warning {
    color: #F44336;
  }

  .task-count.success {
    color: #4CAF50;
  }

  .task-detail {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #666;
  }

  .task-item {
    padding: 0.25rem 0;
  }

  .changes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .change-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 6px;
  }

  .change-info {
    display: flex;
    gap: 1rem;
  }

  .change-room {
    font-weight: 600;
  }

  .change-status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .change-status.available {
    background: #E8F5E9;
    color: #4CAF50;
  }

  .change-status.occupied {
    background: #E3F2FD;
    color: #2196F3;
  }

  .change-status.cleaning {
    background: #FFF3E0;
    color: #FF9800;
  }

  .change-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #999;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #999;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .stat-card {
    text-align: center;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #4CAF50;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.5rem;
  }
</style>