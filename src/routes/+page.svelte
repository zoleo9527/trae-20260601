<script>
  import { oilIntakeRecords, currentRole, getRoleLabel, getStatusLabel, getStatusTagClass } from '$lib/stores';
  import { initDemoData } from '$lib/demoData';
  import { onMount } from 'svelte';
  
  let showDemo = false;
  
  onMount(() => {
    if ($oilIntakeRecords.length === 0) {
      showDemo = true;
    }
  });
  
  $: myTasks = $oilIntakeRecords.filter(r => {
    if ($currentRole === 'manager') {
      return r.status === 'pending_manager_approval' || 
             r.status === 'manager_review' || 
             r.status === 'returned_to_manager';
    } else if ($currentRole === 'cashier') {
      return r.status === 'pending_cashier' || 
             r.status === 'returned_to_cashier';
    } else if ($currentRole === 'measurer') {
      return r.status === 'pending_measurer' || 
             r.status === 'returned_to_measurer';
    }
    return false;
  });
  
  $: allRecords = $oilIntakeRecords.length;
  $: pendingCount = $oilIntakeRecords.filter(r => !['completed', 'closed'].includes(r.status)).length;
  $: completedCount = $oilIntakeRecords.filter(r => r.status === 'completed').length;
</script>

<div class="container">
  <div class="header">
    <div>
      <h1>工作台</h1>
      <p class="subtitle">当前角色：<span class="role-badge role-{$currentRole}">{getRoleLabel($currentRole)}</span></p>
    </div>
    {#if $currentRole === 'manager'}
      <a href="/oil-intake/new" class="btn btn-primary">+ 新建油品入库单</a>
    {/if}
  </div>
  
  {#if showDemo}
    <div class="card demo-card">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <h3 style="margin-bottom: 8px;">🎬 演示模式</h3>
          <p style="color: var(--text-secondary); font-size: 14px;">检测到暂无数据，是否加载演示数据？包含完整的创建、处理、退回、差异标记等流程样例。</p>
        </div>
        <button class="btn btn-primary" on:click={() => { initDemoData(); showDemo = false; }}>加载演示数据</button>
      </div>
    </div>
  {/if}
  
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon blue">📋</div>
      <div class="stat-info">
        <div class="stat-value">{allRecords}</div>
        <div class="stat-label">全部单据</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">⏳</div>
      <div class="stat-info">
        <div class="stat-value">{pendingCount}</div>
        <div class="stat-label">待处理</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">✅</div>
      <div class="stat-info">
        <div class="stat-value">{completedCount}</div>
        <div class="stat-label">已完成</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">⚠️</div>
      <div class="stat-info">
        <div class="stat-value">{$oilIntakeRecords.filter(r => r.hasDispute).length}</div>
        <div class="stat-label">责任待澄清</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <div class="card-header">
      <h2>我的待办 ({myTasks.length})</h2>
    </div>
    
    {#if myTasks.length === 0}
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <p>暂无待处理任务</p>
      </div>
    {:else}
      <table class="table">
        <thead>
          <tr>
            <th>单据编号</th>
            <th>油品类型</th>
            <th>数量(升)</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each myTasks as record}
            <tr>
              <td><strong>{record.orderNo}</strong></td>
              <td>{record.oilType}</td>
              <td>{record.quantity}</td>
              <td><span class="tag {getStatusTagClass(record.status)}">{getStatusLabel(record.status)}</span></td>
              <td>{new Date(record.createdAt).toLocaleDateString('zh-CN')}</td>
              <td>
                <a href="/oil-intake/{record.id}" class="btn btn-secondary" style="padding: 4px 12px; font-size: 13px;">处理</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
  
  <div class="card">
    <div class="card-header">
      <h2>⚠️ 责任不清提示</h2>
    </div>
    <div class="alert alert-warning">
      <strong>重要提示：</strong>油品入库与罐存校验环节可能存在责任边界模糊问题。
      <ul style="margin-top: 8px; padding-left: 20px;">
        <li>油品入库数量以 <strong>油库出库单</strong> 还是 <strong>油罐实收</strong> 为准？</li>
        <li>罐存校验差异在 ±0.3% 以内时，由谁最终确认？</li>
        <li>超耗索赔发起的时限和责任方如何界定？</li>
      </ul>
      <p style="margin-top: 12px;">系统已在流程中预设标记点，请各岗位注意确认责任边界。</p>
    </div>
  </div>
</div>

<style>
  .subtitle {
    color: var(--text-secondary);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  
  .stat-icon.blue {
    background: var(--primary-light);
  }
  
  .stat-icon.orange {
    background: #FFF7E8;
  }
  
  .stat-icon.green {
    background: #E8FFEA;
  }
  
  .stat-icon.red {
    background: #FFECE8;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
  }
  
  .stat-label {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .card-header h2 {
    font-size: 18px;
    font-weight: 600;
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
  
  .demo-card {
    background: linear-gradient(135deg, #E8F3FF 0%, #FFF7E8 100%);
    border: 1px solid #BEDAFF;
  }
</style>
