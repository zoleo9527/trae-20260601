<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();

  let isResetting = $state(false);
  let showConfirm = $state(false);

  async function handleReset() {
    isResetting = true;

    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });

      if (response.ok) {
        alert('数据重置成功！');
        showConfirm = false;
        await invalidateAll();
      } else {
        const error = await response.json();
        alert(error.error || '重置失败');
      }
    } catch (error) {
      alert('网络错误，请重试');
    } finally {
      isResetting = false;
    }
  }
</script>

<svelte:head>
  <title>系统管理 - 科技馆展教管理系统</title>
</svelte:head>

<div class="admin-page">
  <div class="page-header">
    <h1 class="page-title">系统管理</h1>
    <p class="page-subtitle">管理员功能：数据管理与系统设置</p>
  </div>

  <div class="admin-grid">
    <div class="admin-card">
      <h2 class="card-title">📊 数据统计</h2>

      <div class="stats-list">
        <div class="stat-item">
          <span class="stat-label">用户</span>
          <span class="stat-value">{data.stats.users.count}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">展项</span>
          <span class="stat-value">{data.stats.exhibits.count}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">巡检记录</span>
          <span class="stat-value">{data.stats.inspections.count}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">故障报修</span>
          <span class="stat-value">{data.stats.faultReports.count}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">操作日志</span>
          <span class="stat-value">{data.stats.operationLogs.count}</span>
        </div>
      </div>
    </div>

    <div class="admin-card danger">
      <h2 class="card-title">⚠️ 数据重置</h2>

      <div class="warning-box">
        <p class="warning-text">
          <strong>警告：</strong>此操作将清空所有业务数据，包括：
        </p>
        <ul class="warning-list">
          <li>所有巡检记录</li>
          <li>所有故障报修</li>
          <li>所有操作日志</li>
        </ul>
        <p class="warning-text">
          展项和用户信息将保留，但状态将重置为初始状态。
        </p>
        <p class="warning-text">
          此操作不可撤销，请谨慎操作！
        </p>
      </div>

      {#if showConfirm}
        <div class="confirm-box">
          <p class="confirm-text">确定要重置所有数据吗？</p>
          <div class="confirm-buttons">
            <button class="btn cancel" onclick={() => showConfirm = false} disabled={isResetting}>
              取消
            </button>
            <button class="btn danger" onclick={handleReset} disabled={isResetting}>
              {isResetting ? '重置中...' : '确认重置'}
            </button>
          </div>
        </div>
      {:else}
        <button class="btn danger-outline" onclick={() => showConfirm = true}>
          重置数据
        </button>
      {/if}
    </div>

    <div class="admin-card">
      <h2 class="card-title">ℹ️ 系统信息</h2>

      <div class="info-list">
        <div class="info-item">
          <span class="info-label">系统版本</span>
          <span class="info-value">1.0.0</span>
        </div>
        <div class="info-item">
          <span class="info-label">数据库</span>
          <span class="info-value">SQLite 3</span>
        </div>
        <div class="info-item">
          <span class="info-label">技术栈</span>
          <span class="info-value">SvelteKit</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .admin-page {
    max-width: 1200px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a202c;
  }

  .page-subtitle {
    margin: 0;
    color: #64748b;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .admin-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .admin-card.danger {
    border: 2px solid #fee2e2;
  }

  .card-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .stats-list, .info-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .stat-item, .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .stat-label, .info-label {
    color: #64748b;
  }

  .stat-value, .info-value {
    font-weight: 600;
    color: #1a202c;
  }

  .warning-box {
    background: #fef2f2;
    border: 1px solid #fee2e2;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .warning-text {
    color: #991b1b;
    margin: 0 0 1rem 0;
    line-height: 1.6;
  }

  .warning-text:last-child {
    margin-bottom: 0;
  }

  .warning-list {
    margin: 1rem 0;
    padding-left: 1.5rem;
    color: #991b1b;
  }

  .warning-list li {
    margin-bottom: 0.5rem;
  }

  .confirm-box {
    background: white;
    border: 2px solid #ef4444;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  }

  .confirm-text {
    margin: 0 0 1.5rem 0;
    color: #1a202c;
    font-weight: 600;
  }

  .confirm-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.cancel {
    background: #e2e8f0;
    color: #475569;
  }

  .btn.cancel:hover:not(:disabled) {
    background: #cbd5e1;
  }

  .btn.danger {
    background: #ef4444;
    color: white;
  }

  .btn.danger:hover:not(:disabled) {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  }

  .btn.danger-outline {
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: 2px solid #ef4444;
    border-radius: 8px;
    color: #ef4444;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn.danger-outline:hover {
    background: #ef4444;
    color: white;
  }
</style>
