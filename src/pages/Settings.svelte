<script lang="ts">
  import { onMount } from 'svelte'
  import { 
    getAllUsers, 
    getAllLogs, 
    resetData,
    getRoomById
  } from '$lib/database'
  import { 
    Settings, Users, FileText, Database,
    RefreshCw, Calendar, User, Clock
  } from 'lucide-svelte'
  
  let users: any[] = []
  let logs: any[] = []
  let activeTab = 'users'
  
  onMount(async () => {
    await loadData()
  })
  
  async function loadData() {
    users = await getAllUsers()
    logs = await getAllLogs()
    
    for (const log of logs) {
      const room = await getRoomById(log.room_id)
      if (room) {
        log.room_name = room.name
      }
    }
    
    logs = logs.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at.getTime())).slice(0, 20)
  }
  
  async function handleResetData() {
    if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
      resetData()
      await loadData()
      alert('数据已重置')
    }
  }
  
  const statusLabels: Record<string, string> = {
    available: '空闲',
    occupied: '入住中',
    reserved: '已预订',
    cleaning: '打扫中'
  }
  
  const roleLabels: Record<string, string> = {
    boss: '老板',
    chef: '后厨',
    housekeeper: '客房阿姨',
    staff: '员工'
  }
</script>

<div class="settings-page">
  <div class="page-header">
    <div class="header-info">
      <h1>系统设置</h1>
      <p>用户管理与系统维护</p>
    </div>
  </div>
  
  <div class="tabs-container">
    <div class="tabs">
      <button 
        class="tab {activeTab === 'users' ? 'active' : ''}"
        on:click={() => activeTab = 'users'}
      >
        <Users class="tab-icon" />
        用户管理
      </button>
      <button 
        class="tab {activeTab === 'logs' ? 'active' : ''}"
        on:click={() => activeTab = 'logs'}
      >
        <FileText class="tab-icon" />
        房态日志
      </button>
      <button 
        class="tab {activeTab === 'maintenance' ? 'active' : ''}"
        on:click={() => activeTab = 'maintenance'}
      >
        <Database class="tab-icon" />
        系统维护
      </button>
    </div>
    
    <div class="tab-content">
      {#if activeTab === 'users'}
        <div class="users-section">
          <div class="section-header">
            <h2>用户列表</h2>
          </div>
          <div class="users-grid">
            {#each users as user}
              <div class="user-card">
                <div class="user-icon-wrapper">
                  <User class="user-icon" />
                </div>
                <div class="user-info">
                  <div class="user-name">{user.username}</div>
                  <div class="user-role">{roleLabels[user.role]}</div>
                </div>
                <div class="user-actions">
                  <button class="edit-btn">编辑</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'logs'}
        <div class="logs-section">
          <div class="section-header">
            <h2>房态变更日志</h2>
            <span class="log-count">最近 {logs.length} 条记录</span>
          </div>
          <div class="logs-list">
            {#each logs as log}
              <div class="log-item">
                <div class="log-time">
                  <Clock class="time-icon" />
                  <span>{new Date(log.changed_at).toLocaleString('zh-CN')}</span>
                </div>
                <div class="log-content">
                  <span class="log-room">{log.room_name || `房间 ${log.room_id}`}</span>
                  <span class="log-action">状态变更为</span>
                  <span class="log-status">{statusLabels[log.status] || log.status}</span>
                </div>
                <div class="log-meta">
                  <span class="log-operator">{log.changed_by}</span>
                  {#if log.note}
                    <span class="log-note">{log.note}</span>
                  {/if}
                </div>
              </div>
            {/each}
            
            {#if logs.length === 0}
              <div class="empty-state">
                <FileText class="empty-icon" />
                <span>暂无房态变更记录</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}
      
      {#if activeTab === 'maintenance'}
        <div class="maintenance-section">
          <div class="section-header">
            <h2>系统维护</h2>
          </div>
          <div class="maintenance-card">
            <div class="card-header">
              <Database class="card-icon" />
              <div>
                <h3>数据管理</h3>
                <p>管理系统数据和备份</p>
              </div>
            </div>
            <div class="card-content">
              <div class="action-item">
                <RefreshCw class="action-icon" />
                <div class="action-info">
                  <span class="action-title">重置数据</span>
                  <span class="action-desc">将所有数据恢复为初始状态，包含示例数据</span>
                </div>
                <button class="btn-danger" on:click={handleResetData}>
                  重置数据
                </button>
              </div>
            </div>
          </div>
          
          <div class="maintenance-card">
            <div class="card-header">
              <Calendar class="card-icon" />
              <div>
                <h3>系统信息</h3>
                <p>查看系统版本和状态</p>
              </div>
            </div>
            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">系统版本</span>
                  <span class="info-value">1.0.0</span>
                </div>
                <div class="info-item">
                  <span class="info-label">数据存储</span>
                  <span class="info-value">本地存储</span>
                </div>
                <div class="info-item">
                  <span class="info-label">上次更新</span>
                  <span class="info-value">{new Date().toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-page {
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .page-header {
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
  
  .tabs-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.95rem;
    color: #666;
    transition: all 0.3s;
    position: relative;
  }
  
  .tab:hover {
    background: #f5f5f5;
  }
  
  .tab.active {
    color: #4CAF50;
    font-weight: 600;
  }
  
  .tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #4CAF50;
  }
  
  .tab-icon {
    width: 18px;
    height: 18px;
  }
  
  .tab-content {
    padding: 1.5rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .section-header h2 {
    font-size: 1.1rem;
    margin: 0;
    color: #333;
  }
  
  .log-count {
    font-size: 0.85rem;
    color: #999;
  }
  
  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .user-icon-wrapper {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-icon {
    width: 24px;
    height: 24px;
    color: white;
  }
  
  .user-info {
    flex: 1;
  }
  
  .user-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .user-role {
    font-size: 0.85rem;
    color: #666;
  }
  
  .user-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .edit-btn {
    padding: 0.5rem 1rem;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  
  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .log-item {
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .log-time {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #999;
    margin-bottom: 0.5rem;
  }
  
  .time-icon {
    width: 14px;
    height: 14px;
  }
  
  .log-content {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .log-room {
    font-weight: 600;
    color: #333;
  }
  
  .log-action {
    color: #666;
  }
  
  .log-status {
    padding: 0.2rem 0.5rem;
    background: #E8F5E9;
    color: #4CAF50;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
  }
  
  .log-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    color: #999;
  }
  
  .log-operator {
    padding: 0.2rem 0.5rem;
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  .log-note {
    font-style: italic;
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
  
  .maintenance-card {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
    color: #4CAF50;
  }
  
  .card-header h3 {
    margin: 0 0 0.25rem 0;
    color: #333;
  }
  
  .card-header p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: white;
    border-radius: 8px;
  }
  
  .action-icon {
    width: 24px;
    height: 24px;
    color: #F44336;
    margin-right: 1rem;
  }
  
  .action-info {
    flex: 1;
  }
  
  .action-title {
    display: block;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }
  
  .action-desc {
    font-size: 0.85rem;
    color: #666;
  }
  
  .btn-danger {
    padding: 0.75rem 1.5rem;
    background: #F44336;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-danger:hover {
    background: #E53935;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .info-item {
    padding: 1rem;
    background: white;
    border-radius: 8px;
  }
  
  .info-label {
    display: block;
    font-size: 0.85rem;
    color: #999;
    margin-bottom: 0.25rem;
  }
  
  .info-value {
    font-weight: 600;
    color: #333;
  }
</style>
