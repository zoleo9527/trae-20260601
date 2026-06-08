<script>
  import { schedules, handlers } from "./stores.js";
  import { selectedScheduleId, currentView } from "./stores.js";
  let schedule; let activeTab = "progress";
  $: { const id = $selectedScheduleId; if (id) schedule = $schedules.find(s => s.id === id); }
  function goBack() { currentView.set("list"); selectedScheduleId.set(null); }
  function getStatusBadge(status) { return handlers[status] || { role: "未知", color: "#9CA3AF" }; }
</script>

<style>
  .page { min-height: 100vh; background: #F3F4F6; font-family: sans-serif; }
  .header { background: linear-gradient(135deg, #0D9488, #059669); color: white; padding: 16px 32px; }
  .back-btn { cursor: pointer; margin-bottom: 8px; opacity: 0.9; }
  .container { max-width: 1100px; margin: 0 auto; padding: 24px 32px; }
  .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .badge { padding: 8px 16px; border-radius: 20px; font-size: 14px; color: white; }
  .handler-box { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
  .blocker-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
  .tabs { display: flex; border-bottom: 2px solid #E5E7EB; margin-bottom: 20px; }
  .tab { padding: 12px 24px; cursor: pointer; color: #6B7280; border-bottom: 2px solid transparent; margin-bottom: -2px; }
  .tab.active { color: #0D9488; border-bottom-color: #0D9488; }
  .timeline { position: relative; padding-left: 32px; }
  .timeline::before { content: ""; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #E5E7EB; }
  .timeline-item { position: relative; padding-bottom: 24px; }
  .timeline-dot { position: absolute; left: -32px; top: 2px; width: 20px; height: 20px; border-radius: 50%; background: #0D9488; border: 3px solid #CCFBF1; }
  .record-item { background: #F9FAFB; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
  .acceptance-card { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; }
  .action-bar { position: sticky; bottom: 0; background: white; padding: 16px 24px; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 12px; }
  .btn { padding: 10px 24px; border-radius: 8px; font-size: 15px; cursor: pointer; border: none; }
  .btn-primary { background: #0D9488; color: white; }
  .btn-secondary { background: white; color: #0D9488; border: 1px solid #0D9488; }
</style>

{#if schedule}
  <div class="page">
    <div class="header">
      <div class="back-btn" on:click={goBack}>← 返回列表</div>
      <h1 style="margin:0;font-size:20px;">出塘排期详情</h1>
    </div>
    <div class="container">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
          <div><h2 style="margin:0 0 8px;">{schedule.id}</h2>
            <span style="background:#ECFDF5;color:#059669;padding:4px 12px;border-radius:6px;margin-right:8px;">{schedule.pondNo}</span>
            <span style="background:#EFF6FF;color:#2563EB;padding:4px 12px;border-radius:6px;">{schedule.species}</span>
          </div>
          <span class="badge" style="background:{getStatusBadge(schedule.status).color}">{getStatusBadge(schedule.status).role}</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">
          <div><div style="font-size:13px;color:#6B7280;">客户名称</div><div style="font-size:16px;font-weight:600;">{schedule.customer}</div></div>
          <div><div style="font-size:13px;color:#6B7280;">预计产量</div><div style="font-size:16px;font-weight:600;">{schedule.estimatedWeight} 斤</div></div>
          <div><div style="font-size:13px;color:#6B7280;">计划出塘</div><div style="font-size:16px;font-weight:600;">{schedule.planDate}</div></div>
          <div><div style="font-size:13px;color:#6B7280;">联系方式</div><div style="font-size:16px;font-weight:600;">{schedule.contact}</div></div>
        </div>
      </div>

      {#if schedule.status !== "completed"}
        <div class="handler-box">
          <div style="width:48px;height:48px;border-radius:50%;background:#059669;color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;">{schedule.handlerName.charAt(0)}</div>
          <div><div style="font-size:13px;color:#059669;">当前责任人 · {schedule.currentHandler}</div><div style="font-size:18px;font-weight:600;">{schedule.handlerName}</div></div>
        </div>
      {/if}

      {#if schedule.blocker}
        <div class="blocker-box">
          <div style="font-size:14px;font-weight:600;color:#B91C1C;margin-bottom:4px;">⚠️ 当前卡点</div>
          <div style="font-size:15px;color:#7F1D1D;">{schedule.blocker}</div>
        </div>
      {/if}

      <div class="card">
        <div class="tabs">
          <div class="tab {activeTab === "progress" ? "active" : ""}" on:click={() => activeTab = "progress"}>处理进度</div>
          <div class="tab {activeTab === "inspection" ? "active" : ""}" on:click={() => activeTab = "inspection"}>塘口巡检</div>
          <div class="tab {activeTab === "feed" ? "active" : ""}" on:click={() => activeTab = "feed"}>投喂记录</div>
          <div class="tab {activeTab === "medicine" ? "active" : ""}" on:click={() => activeTab = "medicine"}>药品台账</div>
          {#if schedule.acceptance}<div class="tab {activeTab === "acceptance" ? "active" : ""}" on:click={() => activeTab = "acceptance"}>客户验收</div>{/if}
        </div>

        {#if activeTab === "progress"}
          <div class="timeline">
            {#each schedule.history as item}
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div style="font-size:13px;color:#6B7280;margin-bottom:4px;">{item.time}</div>
                <div style="font-size:14px;font-weight:600;">{item.actor}</div>
                <div style="font-size:14px;color:#0D9488;font-weight:500;">{item.action}</div>
                <div style="font-size:14px;color:#4B5563;">{item.remark}</div>
              </div>
            {/each}
          </div>
        {/if}

        {#if activeTab === "inspection"}
          <h3 style="font-size:16px;margin:0 0 12px;">塘口巡检记录</h3>
          {#if schedule.inspectionRecords.length === 0}
            <p style="color:#6B7280;font-size:14px;">暂无巡检记录</p>
          {:else}
            {#each schedule.inspectionRecords as r}
              <div class="record-item">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-size:14px;font-weight:600;">{r.date}</span>
                  <span style="font-size:13px;color:#6B7280;">记录人: {r.recorder}</span>
                </div>
                <div style="font-size:14px;color:#4B5563;">{r.content}</div>
              </div>
            {/each}
          {/if}
        {/if}

        {#if activeTab === "feed"}
          <h3 style="font-size:16px;margin:0 0 12px;">投喂记录</h3>
          {#if schedule.feedRecords.length === 0}
            <p style="color:#6B7280;font-size:14px;">暂无投喂记录</p>
          {:else}
            {#each schedule.feedRecords as r}
              <div class="record-item">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-size:14px;font-weight:600;">{r.date}</span>
                  <span style="font-size:13px;color:#6B7280;">记录人: {r.recorder}</span>
                </div>
                <div style="font-size:14px;color:#4B5563;">{r.type} · {r.amount}kg</div>
              </div>
            {/each}
          {/if}
        {/if}

        {#if activeTab === "medicine"}
          <h3 style="font-size:16px;margin:0 0 12px;">药品台账</h3>
          {#if schedule.medicineRecords.length === 0}
            <p style="color:#6B7280;font-size:14px;">暂无用药记录</p>
          {:else}
            {#each schedule.medicineRecords as r}
              <div class="record-item">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-size:14px;font-weight:600;">{r.date}</span>
                  <span style="font-size:13px;color:#6B7280;">记录人: {r.recorder}</span>
                </div>
                <div style="font-size:14px;color:#4B5563;">{r.type} · {r.amount}</div>
                <div style="font-size:13px;color:#6B7280;margin-top:4px;">用途: {r.purpose}</div>
              </div>
            {/each}
          {/if}
        {/if}

        {#if activeTab === "acceptance" && schedule.acceptance}
          <div class="acceptance-card">
            <h3 style="margin:0 0 16px;color:#065F46;font-size:16px;">客户验收单</h3>
            <div style="margin-bottom:12px;">
              <span style="font-size:14px;color:#065F46;">实际重量: </span>
              <span style="font-size:16px;font-weight:600;color:#065F46;">{schedule.acceptance.actualWeight} 斤</span>
            </div>
            {#each schedule.acceptance.checkItems as item}
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #D1FAE5;">
                <div><div style="font-weight:500;color:#065F46;">{item.name}</div><div style="font-size:13px;color:#047857;margin-top:4px;">{item.remark}</div></div>
                <span style="padding:4px 10px;border-radius:6px;font-size:13px;font-weight:500;background:{item.result === "pass" ? "#D1FAE5" : item.result === "fail" ? "#FEE2E2" : "#FEF3C7"};color:{item.result === "pass" ? "#065F46" : item.result === "fail" ? "#991B1B" : "#92400E"};">
                  {item.result === "pass" ? "通过" : item.result === "fail" ? "不通过" : "待定"}
                </span>
              </div>
            {/each}
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid #D1FAE5;display:flex;justify-content:space-between;align-items:center;">
              <div style="font-size:14px;color:#065F46;">
                {#if schedule.acceptance.completed}
                  ✅ 已签字确认 · {schedule.acceptance.acceptedBy} · {schedule.acceptance.acceptTime}
                {:else}
                  ⏳ 待客户签字确认
                {/if}
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if schedule.status !== "completed"}
      <div class="action-bar">
        <button class="btn btn-secondary" on:click={goBack}>返回</button>
      </div>
    {/if}
  </div>
{/if}
