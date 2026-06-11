<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { currentUser, ROLE_CONFIG } from '$lib/stores.js';

  let reports = [];
  let loading = true;
  let activeFilter = 'all';

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'pending_signature', label: '待签收' },
    { key: 'report_submitted', label: '待审核' },
    { key: 'report_rejected', label: '被驳回' },
    { key: 'signed', label: '已完成' }
  ];

  const loadReports = async () => {
    loading = true;
    const params = new URLSearchParams({
      role: $currentUser.role,
      userId: $currentUser.id
    });
    if (activeFilter !== 'all') {
      params.append('status', activeFilter);
    }
    const res = await fetch(`/api/reports?${params}`);
    const data = await res.json();
    reports = data.reports;
    loading = false;
  };

  onMount(() => {
    loadReports();
  });

  $: if ($currentUser) {
    loadReports();
  }

  $: filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter(r => r.current_status === activeFilter);

  const openReport = (id) => {
    goto(`/reports/${id}`);
  };

  const getStats = () => {
    const total = reports.length;
    const pending = reports.filter(r => r.current_status === 'pending_signature').length;
    const processing = reports.filter(r =>
      ['report_submitted', 'report_rejected', 'report_approved', 'disputed'].includes(r.current_status)
    ).length;
    const completed = reports.filter(r => r.current_status === 'signed' || r.current_status === 'archived').length;
    return { total, pending, processing, completed };
  };

  $: stats = getStats();
</script>

<div class="page">
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value">{stats.total}</div>
      <div class="stat-label">全部报告</div>
    </div>
    <div class="stat-card warning">
      <div class="stat-value">{stats.pending}</div>
      <div class="stat-label">待我签收</div>
    </div>
    <div class="stat-card info">
      <div class="stat-value">{stats.processing}</div>
      <div class="stat-label">处理中</div>
    </div>
    <div class="stat-card success">
      <div class="stat-value">{stats.completed}</div>
      <div class="stat-label">已完成</div>
    </div>
  </div>

  <div class="content-card">
    <div class="card-header">
      <h2>维保报告列表</h2>
      <div class="filters">
        {#each filters as filter}
          <button
            class="filter-btn"
            class:active={activeFilter === filter.key}
            on:click={() => { activeFilter = filter.key; loadReports(); }}
          >
            {filter.label}
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="loading">加载中...</div>
    {:else if reports.length === 0}
      <div class="empty">暂无维保报告</div>
    {:else}
      <div class="table-wrapper">
        <table class="reports-table">
          <thead>
            <tr>
              <th>报告编号</th>
              <th>建筑名称</th>
              <th>巡检日期</th>
              <th>巡检工程师</th>
              <th>发现问题</th>
              <th>当前状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredReports as report}
              <tr on:click={() => openReport(report.id)} class="clickable">
                <td class="report-no">{report.report_no}</td>
                <td>
                  <div class="building-name">{report.building_name}</div>
                  <div class="building-addr">{report.address}</div>
                </td>
                <td>{report.inspection_date}</td>
                <td>{report.inspector_name}</td>
                <td class="problems">
                  {#if report.problems_found && report.problems_found !== '无'}
                    <span class="problem-tag">有问题</span>
                  {:else}
                    <span class="no-problem">正常</span>
                  {/if}
                </td>
                <td>
                  <StatusBadge
                    status={report.current_status}
                    label={report.status_label}
                    color={report.status_color}
                    showResponsible={true}
                    responsibleRole={report.responsible_role}
                  />
                </td>
                <td>
                  <button class="view-btn">查看详情</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <div class="content-card legend-card">
    <h3>状态流转说明</h3>
    <div class="status-flow">
      <div class="flow-item">
        <span class="flow-dot" style="background: #6b7280"></span>
        <span class="flow-label">巡检完成</span>
        <span class="flow-role">巡检工程师</span>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-item">
        <span class="flow-dot" style="background: #3b82f6"></span>
        <span class="flow-label">报告提交</span>
        <span class="flow-role">巡检工程师</span>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-item">
        <span class="flow-dot" style="background: #10b981"></span>
        <span class="flow-label">报告审核</span>
        <span class="flow-role">维保主管</span>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-item">
        <span class="flow-dot" style="background: #f59e0b"></span>
        <span class="flow-label">待签收</span>
        <span class="flow-role">物业联系人</span>
      </div>
      <div class="flow-arrow">→</div>
      <div class="flow-item">
        <span class="flow-dot" style="background: #22c55e"></span>
        <span class="flow-label">已签收</span>
        <span class="flow-role">完成</span>
      </div>
    </div>
  </div>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .stat-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    border-left: 4px solid #3b82f6;
  }

  .stat-card.warning {
    border-left-color: #f59e0b;
  }

  .stat-card.info {
    border-left-color: #06b6d4;
  }

  .stat-card.success {
    border-left-color: #22c55e;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #1e293b;
  }

  .stat-label {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
  }

  .content-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .card-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .filters {
    display: flex;
    gap: 8px;
  }

  .filter-btn {
    padding: 6px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .filter-btn.active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
    font-weight: 500;
  }

  .loading, .empty {
    text-align: center;
    padding: 40px;
    color: #94a3b8;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .reports-table {
    width: 100%;
    border-collapse: collapse;
  }

  .reports-table th {
    text-align: left;
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .reports-table td {
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
    color: #334155;
  }

  .reports-table tr.clickable {
    cursor: pointer;
    transition: background 0.2s;
  }

  .reports-table tr.clickable:hover {
    background: #f8fafc;
  }

  .report-no {
    font-family: monospace;
    font-weight: 500;
    color: #2563eb;
  }

  .building-name {
    font-weight: 500;
    color: #1e293b;
  }

  .building-addr {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .problem-tag {
    background: #fef2f2;
    color: #dc2626;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .no-problem {
    background: #f0fdf4;
    color: #16a34a;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }

  .view-btn {
    padding: 6px 14px;
    background: #eff6ff;
    color: #2563eb;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .view-btn:hover {
    background: #dbeafe;
  }

  .legend-card h3 {
    margin: 0 0 16px;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  .status-flow {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .flow-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 16px;
    background: #f8fafc;
    border-radius: 8px;
    min-width: 100px;
  }

  .flow-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .flow-label {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
  }

  .flow-role {
    font-size: 11px;
    color: #94a3b8;
  }

  .flow-arrow {
    color: #cbd5e1;
    font-size: 18px;
  }
</style>
