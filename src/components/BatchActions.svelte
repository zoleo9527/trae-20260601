<script>
  export let orders = []
  export let batchUpdateStatus
  export let selectedCount = 0

  let tasks = [
    { id: 1, name: '批量确认汇率差异', type: 'normal', desc: '将选中订单的汇率差异标记为已确认', status: 'ready', progress: 0 },
    { id: 2, name: '批量标记为退回补充', type: 'returned', desc: '将选中订单标记为需要退回补充资料', status: 'ready', progress: 0 },
    { id: 3, name: '批量标记逾期', type: 'overdue', desc: '将选中订单标记为逾期未处理', status: 'ready', progress: 0 },
    { id: 4, name: '批量导出报关资料', type: 'export', desc: '导出选中订单的报关资料', status: 'ready', progress: 0 },
    { id: 5, name: '批量生成利润报表', type: 'report', desc: '生成选中订单的利润核算报表', status: 'ready', progress: 0 }
  ]

  function runTask(task) {
    if (selectedCount === 0 && task.type !== 'export' && task.type !== 'report') {
      alert('请先在订单列表中选择要操作的订单')
      return
    }
    task.status = 'running'
    task.progress = 0
    
    const interval = setInterval(() => {
      task.progress += Math.random() * 20
      if (task.progress >= 100) {
        task.progress = 100
        clearInterval(interval)
        setTimeout(() => {
          task.status = 'completed'
          if (task.type === 'normal' || task.type === 'returned' || task.type === 'overdue') {
            batchUpdateStatus(task.type)
          }
          setTimeout(() => {
            task.status = 'ready'
            task.progress = 0
            tasks = tasks
          }, 1500)
        }, 500)
      }
      tasks = tasks
    }, 300)
  }
</script>

<style>
  .container { background: white; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; }
  .header { padding: 16px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
  .header h3 { font-size: 16px; font-weight: 600; }
  .selected-info { padding: 12px 20px; background: #eff6ff; border-bottom: 1px solid #dbeafe; font-size: 13px; color: #1e40af; }
  .task-list { padding: 16px 20px; }
  .task-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; }
  .task-card:hover { border-color: #2563eb; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1); }
  .task-card.running { border-color: #2563eb; background: #eff6ff; }
  .task-card.completed { border-color: #10b981; background: #f0fdf4; }
  .task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .task-name { font-weight: 600; font-size: 14px; }
  .task-desc { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
  .task-status { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
  .status-ready { background: #f3f4f6; color: #374151; }
  .status-running { background: #dbeafe; color: #1e40af; }
  .status-completed { background: #d1fae5; color: #065f46; }
  .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #3b82f6); border-radius: 3px; transition: width 0.3s; }
  .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; }
  .btn-primary { background: #2563eb; color: white; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .history { padding: 16px 20px; border-top: 1px solid #e5e7eb; }
  .history h4 { font-size: 14px; font-weight: 600; margin-bottom: 12px; }
  .history-item { padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; display: flex; justify-content: space-between; }
  .history-item:last-child { border-bottom: none; }
</style>

<div class="container">
  <div class="header">
    <h3>⚡ 批量动作中心</h3>
    <span style="font-size: 12px; color: #6b7280;">提高处理效率</span>
  </div>

  <div class="selected-info">
    📋 当前已选择 <strong>{selectedCount}</strong> 个订单，请选择要执行的批量操作
  </div>

  <div class="task-list">
    {#each tasks as task (task.id)}
      <div class="task-card {task.status}">
        <div class="task-header">
          <span class="task-name">{task.name}</span>
          <span class="task-status status-{task.status}">
            {task.status === 'ready' ? '待执行' : task.status === 'running' ? '执行中...' : '✓ 已完成'}
          </span>
        </div>
        <div class="task-desc">{task.desc}</div>
        {#if task.status === 'running'}
          <div class="progress-bar">
            <div class="progress-fill" style="width: {task.progress}%"></div>
          </div>
        {/if}
        <div style="display: flex; justify-content: flex-end;">
          <button 
            class="btn btn-primary"
            disabled={task.status !== 'ready'}
            on:click={() => runTask(task)}
          >
            {task.status === 'running' ? '执行中...' : task.status === 'completed' ? '✓ 完成' : '开始执行'}
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div class="history">
    <h4>📜 最近执行记录</h4>
    <div class="history-item">
      <span>批量导出报关资料</span>
      <span style="color: #6b7280;">2026-06-05 16:20 · 45条</span>
    </div>
    <div class="history-item">
      <span>批量确认汇率差异</span>
      <span style="color: #6b7280;">2026-06-05 14:30 · 12条</span>
    </div>
    <div class="history-item">
      <span>批量生成利润报表</span>
      <span style="color: #6b7280;">2026-06-04 17:00 · 30条</span>
    </div>
  </div>
</div>
