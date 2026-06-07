<script>
  import { oilIntakeRecords, operationLogs, formatDateTime, getStatusLabel, getRoleLabel } from '$lib/stores';
  
  let activeTab = 'records';
</script>

<div class="container">
  <div class="header">
    <div>
      <h1>历史记录</h1>
      <p class="subtitle">所有操作记录和历史单据</p>
    </div>
  </div>
  
  <div class="card">
    <div class="tabs">
      <button class="tab {activeTab === 'records' ? 'active' : ''}" on:click={() => activeTab = 'records'}>
        单据历史
      </button>
      <button class="tab {activeTab === 'logs' ? 'active' : ''}" on:click={() => activeTab = 'logs'}>
        操作日志
      </button>
    </div>
    
    {#if activeTab === 'records'}
      <table class="table">
        <thead>
          <tr>
            <th>单据编号</th>
            <th>油品类型</th>
            <th>数量</th>
            <th>最终状态</th>
            <th>责任标记</th>
            <th>创建时间</th>
            <th>完成时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each $oilIntakeRecords as record}
            <tr>
              <td><strong>{record.orderNo}</strong></td>
              <td>{record.oilType}</td>
              <td>{record.quantity?.toLocaleString()} 升</td>
              <td>{getStatusLabel(record.status)}</td>
              <td>
                {#if record.hasDispute}
                  <span class="tag tag-danger">有争议</span>
                {:else}
                  <span class="tag tag-success">正常</span>
                {/if}
              </td>
              <td>{formatDateTime(record.createdAt)}</td>
              <td>{record.completedAt ? formatDateTime(record.completedAt) : '-'}</td>
              <td>
                <a href="/oil-intake/{record.id}" class="btn btn-secondary" style="padding: 4px 12px; font-size: 13px;">查看</a>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="8" class="text-center">暂无记录</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="log-list">
        {#each $operationLogs as log}
          <div class="log-item">
            <div class="log-time">{formatDateTime(log.timestamp)}</div>
            <div class="log-content">
              <span class="role-badge role-{log.operator}">{getRoleLabel(log.operator)}</span>
              <span class="log-action">{log.action}</span>
              <span class="log-record">单据: {log.recordId?.slice(0, 8)}...</span>
              {#if log.details}
                <span class="log-details">- {log.details}</span>
              {/if}
            </div>
          </div>
        {:else}
          <p class="text-center text-muted">暂无操作日志</p>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .subtitle {
    color: var(--text-secondary);
    margin-top: 4px;
    font-size: 14px;
  }
  
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  
  .tab {
    padding: 10px 20px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  
  .tab:hover {
    color: var(--text-primary);
  }
  
  .tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    font-weight: 500;
  }
  
  .text-center {
    text-align: center;
    padding: 32px 0;
    color: var(--text-secondary);
  }
  
  .log-list {
    max-height: 600px;
    overflow-y: auto;
  }
  
  .log-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  
  .log-item:last-child {
    border-bottom: none;
  }
  
  .log-time {
    font-size: 12px;
    color: var(--text-placeholder);
    margin-bottom: 4px;
  }
  
  .log-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 14px;
  }
  
  .log-action {
    font-weight: 500;
  }
  
  .log-record {
    color: var(--text-secondary);
    font-size: 13px;
  }
  
  .log-details {
    color: var(--text-secondary);
    font-size: 13px;
  }
</style>
