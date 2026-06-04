<script>
  import { reports } from '../stores/reportStore'
  import { auditStatus, roles } from '../stores/reportStore'

  export let onSelectReport

  $: urgentReports = $reports.filter(r => r.priority === 'urgent').slice(0, 3)
  $: stuckReports = $reports.filter(r => r.isStuck).slice(0, 3)
  $: recentReports = [...$reports].sort((a, b) => 
    new Date(b.lastModified) - new Date(a.lastModified)
  ).slice(0, 3)

  function getStatusName(statusId) {
    const key = statusId.toUpperCase()
    return auditStatus[key]?.name || statusId
  }

  function getStatusColor(statusId) {
    const key = statusId.toUpperCase()
    return auditStatus[key]?.color || '#8c8c8c'
  }
</script>

<aside class="dashboard-section">
  <div class="dashboard-header">
    <span class="icon">⚡</span>
    优先级概览
  </div>

  <div class="priority-section">
    <div class="section-title">🔴 紧急处理</div>
    {#each urgentReports as report (report.id)}
      <div class="priority-card urgent" on:click={() => onSelectReport(report.id)}>
        <div class="priority-card-header">
          <span class="priority-patient">{report.patientName}</span>
          <span class="priority-badge" style="color: #cf1322; background: #ffccc7;">
            紧急
          </span>
        </div>
        <div class="priority-desc">
          {report.exception?.description || report.stuckReason || getStatusName(report.currentStatus)}
        </div>
        <div class="priority-meta">
          <span>{report.examType}</span>
          <span>{report.lastModified}</span>
        </div>
      </div>
    {/each}
    {#if urgentReports.length === 0}
      <div style="font-size: 12px; color: #bfbfbf; text-align: center; padding: 8px 0;">
        暂无紧急事项
      </div>
    {/if}
  </div>

  <div class="priority-section">
    <div class="section-title">🟡 卡住状态</div>
    {#each stuckReports as report (report.id)}
      <div class="priority-card stuck" on:click={() => onSelectReport(report.id)}>
        <div class="priority-card-header">
          <span class="priority-patient">{report.patientName}</span>
          <span class="priority-badge">
            {getStatusName(report.currentStatus)}
          </span>
        </div>
        <div class="priority-desc">{report.stuckReason}</div>
        <div class="priority-meta">
          <span>处理人：{report.assignee}</span>
          <span>{report.lastModified}</span>
        </div>
      </div>
    {/each}
    {#if stuckReports.length === 0}
      <div style="font-size: 12px; color: #bfbfbf; text-align: center; padding: 8px 0;">
        暂无卡住报告
      </div>
    {/if}
  </div>

  <div class="priority-section">
    <div class="section-title">🔵 最近更新</div>
    {#each recentReports as report (report.id)}
      <div class="priority-card recent" on:click={() => onSelectReport(report.id)}>
        <div class="priority-card-header">
          <span class="priority-patient">{report.patientName}</span>
          <span class="priority-badge" style="color: #096dd9; background: #bae0ff;">
            {getStatusName(report.currentStatus)}
          </span>
        </div>
        <div class="priority-desc">{report.examType}</div>
        <div class="priority-meta">
          <span>{report.lastModifier}</span>
          <span>{report.lastModified}</span>
        </div>
      </div>
    {/each}
  </div>
</aside>
