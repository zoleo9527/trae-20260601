<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();

  const typeLabels: Record<string, string> = {
    inspection_submitted: '提交巡检',
    fault_reported: '提交故障',
    fault_received: '接收故障',
    fault_processed: '处理故障',
    fault_completed: '完成故障'
  };

  const roleLabels: Record<string, string> = {
    exhibitor: '展教员',
    engineer: '设备工程师',
    teacher: '活动老师',
    admin: '管理员'
  };

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>工作台 - 科技馆展教管理系统</title>
</svelte:head>

<div class="dashboard">
  <div class="welcome-section">
    <h1 class="welcome-title">欢迎回来，{data.user.name}</h1>
    <p class="welcome-role">{roleLabels[data.user.role]}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-icon exhibits">📦</div>
      <div class="stat-content">
        <div class="stat-value">{data.stats.totalExhibits}</div>
        <div class="stat-label">展项总数</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon normal">✅</div>
      <div class="stat-content">
        <div class="stat-value">{data.stats.normalExhibits}</div>
        <div class="stat-label">正常展项</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon fault">⚠️</div>
      <div class="stat-content">
        <div class="stat-value">{data.stats.faultExhibits}</div>
        <div class="stat-label">故障展项</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon inspections">🔍</div>
      <div class="stat-content">
        <div class="stat-value">{data.stats.todayInspections}</div>
        <div class="stat-label">今日巡检</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon pending">⏳</div>
      <div class="stat-content">
        <div class="stat-value">{data.stats.pendingFaults}</div>
        <div class="stat-label">待处理故障</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon processing">🔧</div>
      <div class="stat-content">
        <div class="stat-value">{data.stats.processingFaults}</div>
        <div class="stat-label">处理中故障</div>
      </div>
    </div>
  </div>

  <div class="dashboard-grid">
    <div class="dashboard-card todos">
      <div class="card-header">
        <h2 class="card-title">待办事项</h2>
        <span class="badge">{data.todos.length}</span>
      </div>

      <div class="card-content">
        {#if data.todos.length === 0}
          <div class="empty-state">
            <div class="empty-icon">✨</div>
            <div class="empty-text">暂无待办事项</div>
          </div>
        {:else}
          <div class="todo-list">
            {#each data.todos as todo}
              <a href={todo.type === 'fault' ? `/fault-reports/${todo.id}` : `/exhibits/${todo.id}`} class="todo-item">
                <div class="todo-indicator" class:high={todo.priority === 'high'} class:medium={todo.priority === 'medium'}></div>
                <div class="todo-content">
                  <div class="todo-title">{todo.title}</div>
                  <div class="todo-description">{todo.description}</div>
                  <div class="todo-time">{formatTime(todo.created_at)}</div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="dashboard-card risks">
      <div class="card-header">
        <h2 class="card-title">风险项</h2>
        <span class="badge risk">{data.risks.length}</span>
      </div>

      <div class="card-content">
        {#if data.risks.length === 0}
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <div class="empty-text">暂无风险项</div>
          </div>
        {:else}
          <div class="risk-list">
            {#each data.risks as risk}
              <a href="/fault-reports/{risk.id}" class="risk-item">
                <div class="risk-content">
                  <div class="risk-title">{risk.title}</div>
                  <div class="risk-meta">
                    <span class="risk-badge" class:pending={risk.status === 'pending'} class:processing={risk.status === 'processing'}>
                      {risk.risk}
                    </span>
                    <span class="risk-duration">⏱️ {risk.duration}</span>
                  </div>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="dashboard-card recent-logs">
      <div class="card-header">
        <h2 class="card-title">最近变更</h2>
      </div>

      <div class="card-content">
        {#if data.recentLogs.length === 0}
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-text">暂无变更记录</div>
          </div>
        {:else}
          <div class="log-list">
            {#each data.recentLogs as log}
              <div class="log-item">
                <div class="log-time">{formatTime(log.created_at)}</div>
                <div class="log-content">
                  <span class="log-type">{typeLabels[log.type] || log.type}</span>
                  <span class="log-operator">{log.operator_name}</span>
                  {#if log.details}
                    <span class="log-details">：{log.details}</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    {#if data.user.role === 'admin'}
      <div class="dashboard-card admin-section">
        <div class="card-header">
          <h2 class="card-title">系统管理</h2>
        </div>

        <div class="card-content">
          <div class="admin-actions">
            <a href="/admin" class="admin-action">
              <span class="action-icon">⚙️</span>
              <span class="action-text">数据管理</span>
              <span class="action-desc">数据重置、系统设置</span>
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .dashboard {
    max-width: 1400px;
  }

  .welcome-section {
    margin-bottom: 2rem;
  }

  .welcome-title {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a202c;
  }

  .welcome-role {
    margin: 0;
    color: #64748b;
    font-size: 1.125rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
  }

  .stat-icon.exhibits {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .stat-icon.normal {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .stat-icon.fault {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  }

  .stat-icon.inspections {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  }

  .stat-icon.pending {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .stat-icon.processing {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1a202c;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.5rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .dashboard-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }

  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    margin: 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .badge {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .badge.risk {
    background: #ef4444;
  }

  .card-content {
    padding: 1.5rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .empty-text {
    font-size: 0.875rem;
  }

  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .todo-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .todo-item:hover {
    background: #f1f5f9;
    transform: translateX(4px);
  }

  .todo-indicator {
    width: 4px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .todo-indicator.high {
    background: #ef4444;
  }

  .todo-indicator.medium {
    background: #f59e0b;
  }

  .todo-content {
    flex: 1;
    min-width: 0;
  }

  .todo-title {
    font-weight: 600;
    color: #1a202c;
    margin-bottom: 0.25rem;
  }

  .todo-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .todo-time {
    font-size: 0.75rem;
    color: #94a3b8;
  }

  .risk-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .risk-item {
    padding: 1rem;
    background: #fef2f2;
    border-left: 4px solid #ef4444;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .risk-item:hover {
    background: #fee2e2;
  }

  .risk-title {
    font-weight: 600;
    color: #991b1b;
    margin-bottom: 0.5rem;
  }

  .risk-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
  }

  .risk-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .risk-badge.pending {
    background: #fee2e2;
    color: #991b1b;
  }

  .risk-badge.processing {
    background: #fef3c7;
    color: #92400e;
  }

  .risk-duration {
    color: #64748b;
  }

  .log-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .log-item {
    display: flex;
    gap: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .log-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .log-time {
    font-size: 0.75rem;
    color: #94a3b8;
    white-space: nowrap;
  }

  .log-content {
    flex: 1;
    font-size: 0.875rem;
  }

  .log-type {
    color: #667eea;
    font-weight: 600;
  }

  .log-operator {
    color: #1a202c;
    font-weight: 500;
  }

  .log-details {
    color: #64748b;
  }

  .admin-section {
    border-left: 4px solid #8b5cf6;
  }

  .admin-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .admin-action {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #f5f3ff;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
  }

  .admin-action:hover {
    background: #ede9fe;
    transform: translateX(4px);
  }

  .admin-action .action-icon {
    font-size: 1.5rem;
  }

  .admin-action .action-text {
    font-weight: 600;
    color: #4c1d95;
    font-size: 1rem;
  }

  .admin-action .action-desc {
    flex: 1;
    font-size: 0.75rem;
    color: #7c3aed;
    text-align: right;
  }
</style>
