<script>
  import { reports, auditStatus, roles } from '../stores/reportStore'

  export let selectedId
  export let onSelect

  let activeFilter = 'all'
  let searchQuery = ''

  const filters = [
    { id: 'all', name: '全部' },
    { id: 'pending', name: '待处理' },
    { id: 'stuck', name: '卡住' },
    { id: 'audit', name: '审核中' },
    { id: 'delivery', name: '发放中' },
    { id: 'done', name: '已完成' }
  ]

  $: filteredReports = $reports.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!r.patientName.toLowerCase().includes(q) && 
          !r.id.toLowerCase().includes(q) &&
          !r.examType.toLowerCase().includes(q)) {
        return false
      }
    }

    switch (activeFilter) {
      case 'pending':
        return r.currentHandler !== null
      case 'stuck':
        return r.isStuck
      case 'audit':
        return ['primary_audit', 'secondary_audit', 'final_audit', 'department_review'].includes(r.currentStatus)
      case 'delivery':
        return ['pending_delivery', 'delivery_scheduled'].includes(r.currentStatus)
      case 'done':
        return r.currentStatus === 'delivered'
      default:
        return true
    }
  })

  $: filterCounts = {
    all: $reports.length,
    pending: $reports.filter(r => r.currentHandler !== null).length,
    stuck: $reports.filter(r => r.isStuck).length,
    audit: $reports.filter(r => ['primary_audit', 'secondary_audit', 'final_audit', 'department_review'].includes(r.currentStatus)).length,
    delivery: $reports.filter(r => ['pending_delivery', 'delivery_scheduled'].includes(r.currentStatus)).length,
    done: $reports.filter(r => r.currentStatus === 'delivered').length
  }

  function getStatusName(statusId) {
    const key = statusId.toUpperCase()
    return auditStatus[key]?.name || statusId
  }

  function getStatusColor(statusId) {
    const key = statusId.toUpperCase()
    return auditStatus[key]?.color || '#8c8c8c'
  }

  function getHandlerColor(roleId) {
    const key = Object.keys(roles).find(k => roles[k].id === roleId)
    return roles[key]?.color || '#8c8c8c'
  }

  function getRoleName(roleId) {
    const key = Object.keys(roles).find(k => roles[k].id === roleId)
    return roles[key]?.name || roleId
  }

  function getInitial(name) {
    return name ? name.charAt(0) : '?'
  }
</script>

<div class="report-list-section">
  <div class="list-filters">
    {#each filters as filter (filter.id)}
      <button 
        class="filter-btn {activeFilter === filter.id ? 'active' : ''} {filterCounts[filter.id] > 0 ? 'has-count' : ''}"
        data-count="{filterCounts[filter.id]}"
        on:click={() => activeFilter = filter.id}
      >
        {filter.name}
      </button>
    {/each}
  </div>

  <div class="search-box">
    <input 
      type="text" 
      placeholder="🔍 搜索患者姓名、报告编号、体检类型..."
      bind:value={searchQuery}
    />
  </div>

  <div class="report-list">
    {#each filteredReports as report (report.id)}
      <div 
        class="report-item {selectedId === report.id ? 'selected' : ''} {report.priority === 'urgent' ? 'urgent' : ''}"
        on:click={() => onSelect(report.id)}
      >
        <div class="report-item-header">
          <span class="report-id">{report.id}</span>
          <span class="status-tag" style="color: {getStatusColor(report.currentStatus)}">
            {getStatusName(report.currentStatus)}
          </span>
        </div>
        
        <div class="patient-info">
          <span class="patient-name">{report.patientName}</span>
          <span class="patient-meta">{report.patientGender} · {report.patientAge}岁</span>
          {#if report.priority === 'urgent'}
            <span style="font-size: 11px; color: #fff; background: #ff4d4f; padding: 1px 6px; border-radius: 3px;">紧急</span>
          {/if}
        </div>
        
        <div class="report-type">{report.examType}</div>
        
        <div class="report-footer">
          {#if report.assignee}
            <div class="handler-info">
              <span class="handler-avatar" style="background: {getHandlerColor(report.currentHandler)}">
                {getInitial(report.assignee)}
              </span>
              <span>{getRoleName(report.currentHandler)}: {report.assignee}</span>
            </div>
          {:else}
            <span style="color: #bfbfbf;">暂无处理人</span>
          {/if}
          <span>{report.lastModified}</span>
        </div>
        
        {#if report.isStuck}
          <div class="stuck-indicator" style="margin-top: 6px;">
            {report.stuckReason}
          </div>
        {/if}
      </div>
    {/each}
    
    {#if filteredReports.length === 0}
      <div class="empty-state">
        <div class="icon">📭</div>
        <div>暂无符合条件的报告</div>
      </div>
    {/if}
  </div>
</div>
