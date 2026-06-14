<script>
  import { getStatistics } from '$lib/api.js';
  import { onMount } from 'svelte';

  let stats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    supplementary: 0,
    urgent: 0,
    dueSoon: 0
  };

  onMount(async () => {
    try {
      const data = await getStatistics();
      stats = data.statistics;
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  });

  export function refresh() {
    getStatistics().then(data => {
      stats = data.statistics;
    }).catch(console.error);
  }
</script>

<div class="statistics-bar">
  <div class="stat-card total">
    <div class="stat-icon">📋</div>
    <div class="stat-content">
      <div class="stat-value">{stats.total}</div>
      <div class="stat-label">总样本数</div>
    </div>
  </div>

  <div class="stat-card pending">
    <div class="stat-icon">⏳</div>
    <div class="stat-content">
      <div class="stat-value">{stats.pending}</div>
      <div class="stat-label">待接收</div>
    </div>
  </div>

  <div class="stat-card processing">
    <div class="stat-icon">🔬</div>
    <div class="stat-content">
      <div class="stat-value">{stats.processing}</div>
      <div class="stat-label">检测中</div>
    </div>
  </div>

  <div class="stat-card supplementary">
    <div class="stat-icon">📝</div>
    <div class="stat-content">
      <div class="stat-value">{stats.supplementary}</div>
      <div class="stat-label">需补充</div>
    </div>
  </div>

  <div class="stat-card urgent">
    <div class="stat-icon">🚨</div>
    <div class="stat-content">
      <div class="stat-value">{stats.urgent}</div>
      <div class="stat-label">特急案件</div>
    </div>
  </div>

  <div class="stat-card due-soon">
    <div class="stat-icon">⏰</div>
    <div class="stat-content">
      <div class="stat-value">{stats.dueSoon}</div>
      <div class="stat-label">3天内到期</div>
    </div>
  </div>

  <div class="stat-card completed">
    <div class="stat-icon">✅</div>
    <div class="stat-content">
      <div class="stat-value">{stats.completed}</div>
      <div class="stat-label">已完成</div>
    </div>
  </div>
</div>

<style>
  .statistics-bar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 10px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s;
  }

  .stat-card:hover {
    transform: translateY(-2px);
  }

  .stat-icon {
    font-size: 2rem;
    line-height: 1;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #666;
    margin-top: 0.25rem;
  }

  .urgent .stat-value,
  .due-soon .stat-value {
    color: #F56C6C;
  }

  .supplementary .stat-value {
    color: #E6A23C;
  }
</style>
