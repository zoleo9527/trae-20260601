<script>
  import { schedules, handlers } from "./stores.js";
  import { selectedScheduleId, currentView } from "./stores.js";
  function viewDetail(id) { selectedScheduleId.set(id); currentView.set("detail"); }
  function getStatusBadge(status) { return handlers[status] || { role: "未知", color: "#9CA3AF" }; }
</script>

<style>
  .page { min-height: 100vh; background: #F3F4F6; font-family: sans-serif; }
  .header { background: linear-gradient(135deg, #0D9488, #059669); color: white; padding: 24px 32px; }
  .container { max-width: 1200px; margin: 0 auto; padding: 24px 32px; }
  .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .abnormal { border-left: 4px solid #EF4444; background: #FEF2F2; }
  .badge { padding: 6px 12px; border-radius: 20px; font-size: 13px; color: white; display: inline-block; }
</style>

<div class="page">
  <div class="header"><h1>🐟 出塘排期与客户验收</h1></div>
  <div class="container">
    {#each $schedules as s}
      <div class="card {s.isAbnormal ? "abnormal" : ""}" on:click={() => viewDetail(s.id)}>
        <h3>{s.id} - {s.pondNo} {s.species}</h3>
        <span class="badge" style="background:{getStatusBadge(s.status).color}">{getStatusBadge(s.status).role}</span>
        <p>客户: {s.customer} | 预计: {s.estimatedWeight}斤 | 计划: {s.planDate}</p>
        <p>当前处理: {s.handlerName} ({s.currentHandler})</p>
        {#if s.blocker}<p style="color:#EF4444">卡点: {s.blocker}</p>{/if}
      </div>
    {/each}
  </div>
</div>
