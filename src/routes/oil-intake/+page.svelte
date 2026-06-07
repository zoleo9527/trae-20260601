<script>
  import { oilIntakeRecords, getStatusLabel, getStatusTagClass, formatDateTime } from '$lib/stores';
  import { goto } from '$app/navigation';
  
  let filterStatus = 'all';
  let searchKeyword = '';
  
  $: filteredRecords = $oilIntakeRecords.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return r.orderNo.toLowerCase().includes(kw) || 
             r.oilType.toLowerCase().includes(kw) ||
             r.tankerNo.toLowerCase().includes(kw);
    }
    return true;
  });
</script>

<div class="container">
  <div class="header">
    <div>
      <h1>油品入库与罐存校验</h1>
      <p class="subtitle">加油站油品入库全流程管理 · 站长→收银员→计量员接力</p>
    </div>
    <a href="/oil-intake/new" class="btn btn-primary">+ 新建入库单</a>
  </div>
  
  <div class="card">
    <div class="filter-bar">
      <div class="filter-tabs">
        <button class="filter-tab {filterStatus === 'all' ? 'active' : ''}" on:click={() => filterStatus = 'all'}>
          全部 ({$oilIntakeRecords.length})
        </button>
        <button class="filter-tab {filterStatus === 'pending_manager_approval' ? 'active' : ''}" on:click={() => filterStatus = 'pending_manager_approval'}>
          待站长审核
        </button>
        <button class="filter-tab {filterStatus === 'pending_cashier' ? 'active' : ''}" on:click={() => filterStatus = 'pending_cashier'}>
          待收银录入
        </button>
        <button class="filter-tab {filterStatus === 'pending_measurer' ? 'active' : ''}" on:click={() => filterStatus = 'pending_measurer'}>
          待计量校验
        </button>
        <button class="filter-tab {filterStatus === 'completed' ? 'active' : ''}" on:click={() => filterStatus = 'completed'}>
          已完成
        </button>
      </div>
      <div class="search-box">
        <input 
          type="text" 
          class="form-input" 
          placeholder="搜索单据号、油品、罐车号..." 
          bind:value={searchKeyword}
        />
      </div>
    </div>
    
    {#if filteredRecords.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无单据记录</p>
        <a href="/oil-intake/new" class="btn btn-primary" style="margin-top: 16px;">创建第一个入库单</a>
      </div>
    {:else}
      <table class="table">
        <thead>
          <tr>
            <th>单据编号</th>
            <th>油品类型</th>
            <th>数量(升)</th>
            <th>目标罐号</th>
            <th>罐车号</th>
            <th>状态</th>
            <th>责任标记</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredRecords as record}
            <tr on:dblclick={() => goto(`/oil-intake/${record.id}`)}>
              <td><strong>{record.orderNo}</strong></td>
              <td>{record.oilType}</td>
              <td>{record.quantity?.toLocaleString()}</td>
              <td>{record.tankNo || '-'}</td>
              <td>{record.tankerNo || '-'}</td>
              <td><span class="tag {getStatusTagClass(record.status)}">{getStatusLabel(record.status)}</span></td>
              <td>
                {#if record.hasDispute}
                  <span class="tag tag-danger">⚠️ 责任待澄清</span>
                {:else}
                  <span class="tag tag-success">正常</span>
                {/if}
              </td>
              <td>{formatDateTime(record.createdAt)}</td>
              <td>
                <a href="/oil-intake/{record.id}" class="btn btn-secondary" style="padding: 4px 12px; font-size: 13px;">查看</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  
  <div class="card">
    <div class="card-header">
      <h2>📌 流程说明</h2>
    </div>
    <div class="workflow-desc">
      <div class="workflow-step">
        <div class="step-icon role-manager">👨‍💼</div>
        <div class="step-content">
          <h4>站长：创建 & 审核</h4>
          <p>创建油品入库单，审核入库信息的真实性和完整性</p>
        </div>
      </div>
      <div class="step-arrow">→</div>
      <div class="workflow-step">
        <div class="step-icon role-cashier">👩‍💳</div>
        <div class="step-content">
          <h4>收银员：录入数据</h4>
          <p>录入随货同行单、出库单等收银相关数据</p>
        </div>
      </div>
      <div class="step-arrow">→</div>
      <div class="workflow-step">
        <div class="step-icon role-measurer">👨‍🔬</div>
        <div class="step-content">
          <h4>计量员：罐存校验</h4>
          <p>计量油罐实收数据，与入库量比对，标记差异</p>
        </div>
      </div>
      <div class="step-arrow">→</div>
      <div class="workflow-step">
        <div class="step-icon role-manager">👨‍💼</div>
        <div class="step-content">
          <h4>站长：复核关闭</h4>
          <p>最终复核数据，处理差异，关闭单据</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .subtitle {
    color: var(--text-secondary);
    margin-top: 4px;
    font-size: 14px;
  }
  
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .filter-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  
  .filter-tab {
    padding: 6px 14px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .filter-tab:hover {
    background: var(--bg-light);
  }
  
  .filter-tab.active {
    background: var(--primary-light);
    color: var(--primary);
    font-weight: 500;
  }
  
  .search-box {
    width: 280px;
  }
  
  .empty-state {
    text-align: center;
    padding: 48px 0;
    color: var(--text-secondary);
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .card-header {
    margin-bottom: 16px;
  }
  
  .card-header h2 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .workflow-desc {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .workflow-step {
    flex: 1;
    min-width: 180px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
    background: var(--bg-light);
    border-radius: 8px;
  }
  
  .step-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  
  .step-icon.role-manager {
    background: var(--primary-light);
  }
  
  .step-icon.role-cashier {
    background: #E8FFEA;
  }
  
  .step-icon.role-measurer {
    background: #FFF7E8;
  }
  
  .step-content h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .step-content p {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0;
  }
  
  .step-arrow {
    font-size: 20px;
    color: var(--text-placeholder);
    flex-shrink: 0;
  }
</style>
