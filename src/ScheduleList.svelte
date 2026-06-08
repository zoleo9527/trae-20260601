<script>
  import { schedules, handlers } from "./stores.js";
  import { selectedScheduleId, currentView } from "./stores.js";

  let statusFilter = "all";
  let handlerFilter = "all";
  let quickView = "all";
  let sortKey = "planDateAsc";

  function viewDetail(id) {
    selectedScheduleId.set(id);
    currentView.set("detail");
  }

  function getStatusBadge(status) {
    return handlers[status] || { role: "未知", color: "#9CA3AF" };
  }

  const statusOptions = [
    { value: "all", label: "全部" },
    { value: "pending_tech", label: "养殖技术员" },
    { value: "pending_feed", label: "饲料仓管" },
    { value: "pending_manager", label: "场长" },
    { value: "pending_accept", label: "客户验收" },
    { value: "completed", label: "已完成" }
  ];

  const statusCounts = ["pending_tech", "pending_feed", "pending_manager", "pending_accept", "completed"];

  const handlerRoles = ["养殖技术员", "饲料仓管", "场长", "客户验收"];

  const sortOptions = [
    { value: "planDateAsc", label: "计划出塘日期 ↑" },
    { value: "planDateDesc", label: "计划出塘日期 ↓" },
    { value: "blockerDesc", label: "卡点天数 ↓" },
    { value: "updatedDesc", label: "最近更新 ↓" }
  ];

  function daysRemaining(planDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plan = new Date(planDate);
    plan.setHours(0, 0, 0, 0);
    return Math.ceil((plan - today) / (1000 * 60 * 60 * 24));
  }

  function blockerDays(history) {
    let earliest = null;
    for (const h of history) {
      if (h.action === "异常提醒") {
        const t = new Date(h.time.replace(/-/g, "/"));
        if (!earliest || t < earliest) earliest = t;
      }
    }
    if (!earliest) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    earliest.setHours(0, 0, 0, 0);
    return Math.ceil((today - earliest) / (1000 * 60 * 60 * 24));
  }

  function truncate(str, len) {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "…" : str;
  }

  function lastHistorySummary(history) {
    if (!history || history.length === 0) return "";
    const last = history[history.length - 1];
    return `${last.actor} · ${last.action}：${truncate(last.remark, 20)}`;
  }

  function latestUpdateTime(history) {
    if (!history || history.length === 0) return 0;
    return new Date(history[history.length - 1].time.replace(/-/g, "/")).getTime();
  }

  $: filtered = $schedules.filter(s => {
    if (quickView === "abnormal" && !s.isAbnormal) return false;
    if (quickView === "mine" && s.status === "completed") return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (handlerFilter !== "all" && s.currentHandler !== handlerFilter) return false;
    return true;
  });

  $: sorted = [...filtered].sort((a, b) => {
    if (sortKey === "planDateAsc") return new Date(a.planDate) - new Date(b.planDate);
    if (sortKey === "planDateDesc") return new Date(b.planDate) - new Date(a.planDate);
    if (sortKey === "blockerDesc") return blockerDays(b.history) - blockerDays(a.history);
    if (sortKey === "updatedDesc") return latestUpdateTime(b.history) - latestUpdateTime(a.history);
    return 0;
  });

  $: abnormalItems = $schedules.filter(s => s.isAbnormal);
  $: abnormalCount = abnormalItems.length;
  $: maxBlockerDays = abnormalItems.reduce((max, s) => {
    const d = blockerDays(s.history);
    return d > max ? d : max;
  }, 0);
  $: abnormalHandlers = [...new Set(abnormalItems.map(s => s.currentHandler))];
  $: firstAbnormalId = abnormalItems.length > 0 ? abnormalItems[0].id : null;

  $: mineItems = $schedules.filter(s => s.status !== "completed");
  $: mineCount = mineItems.length;
  $: mineAbnormalCount = mineItems.filter(s => s.isAbnormal).length;

  $: statusDistribution = statusCounts.map(st => ({
    status: st,
    count: $schedules.filter(s => s.status === st).length,
    ...getStatusBadge(st)
  }));

  function setQuickView(view) {
    quickView = view;
    statusFilter = "all";
    handlerFilter = "all";
  }

  function jumpToFirstAbnormal() {
    if (firstAbnormalId) viewDetail(firstAbnormalId);
  }
</script>

<style>
  .page { min-height: 100vh; background: #F3F4F6; font-family: sans-serif; }
  .header { background: linear-gradient(135deg, #0D9488, #059669); color: white; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 22px; }
  .container { max-width: 1200px; margin: 0 auto; padding: 24px 32px; }
  .summary-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 16px; }
  .summary-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
  .summary-icon.abnormal { background: #FEE2E2; }
  .summary-info { flex: 1; }
  .summary-info h3 { margin: 0 0 6px; font-size: 16px; color: #1F2937; }
  .summary-info p { margin: 0; font-size: 13px; color: #6B7280; }
  .summary-action { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; background: #EF4444; color: white; transition: background 0.2s; flex-shrink: 0; }
  .summary-action:hover { background: #DC2626; }
  .summary-action:disabled { background: #D1D5DB; color: #9CA3AF; cursor: default; }
  .filter-bar { background: white; border-radius: 12px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .quick-views { display: flex; gap: 8px; margin-bottom: 12px; }
  .quick-btn { padding: 7px 16px; border-radius: 20px; border: 1px solid #D1D5DB; background: white; font-size: 13px; cursor: pointer; color: #4B5563; transition: all 0.2s; }
  .quick-btn:hover { border-color: #0D9488; color: #0D9488; }
  .quick-btn.active { background: #0D9488; color: white; border-color: #0D9488; }
  .filter-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
  .status-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
  .status-tab { padding: 6px 14px; border-radius: 6px; border: none; background: #F3F4F6; font-size: 13px; cursor: pointer; color: #4B5563; transition: all 0.2s; }
  .status-tab:hover { background: #E5E7EB; }
  .status-tab.active { color: white; }
  .handler-filter { display: flex; align-items: center; gap: 8px; }
  .handler-filter label { font-size: 13px; color: #6B7280; white-space: nowrap; }
  .handler-select { padding: 7px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 13px; color: #374151; background: white; cursor: pointer; min-width: 140px; }
  .handler-select:focus { outline: none; border-color: #0D9488; }
  .sort-filter { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .sort-filter label { font-size: 13px; color: #6B7280; white-space: nowrap; }
  .sort-select { padding: 7px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 13px; color: #374151; background: white; cursor: pointer; min-width: 160px; }
  .sort-select:focus { outline: none; border-color: #0D9488; }
  .distribution-bar { background: white; border-radius: 12px; padding: 14px 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .dist-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-size: 13px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; background: #F9FAFB; color: #4B5563; }
  .dist-badge:hover { border-color: #D1D5DB; }
  .dist-badge.active { border-color: currentColor; font-weight: 600; }
  .dist-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .dist-count { font-weight: 700; font-size: 14px; }
  .mine-tags { display: flex; gap: 8px; margin-left: auto; }
  .mine-tag { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
  .mine-tag.total { background: #EFF6FF; color: #2563EB; }
  .mine-tag.abn { background: #FEF2F2; color: #991B1B; }
  .list-item { background: white; border-radius: 12px; padding: 20px; margin-bottom: 12px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; transition: transform 0.15s, box-shadow 0.15s; }
  .list-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .list-item.abnormal { border-left: 4px solid #EF4444; background: #FEF2F2; }
  .item-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
  .item-title { font-size: 16px; font-weight: 600; color: #1F2937; margin: 0; }
  .item-meta { font-size: 13px; color: #6B7280; margin-top: 4px; }
  .item-handler { font-size: 13px; color: #374151; margin-top: 8px; }
  .item-blocker { font-size: 13px; color: #EF4444; margin-top: 6px; }
  .item-latest { font-size: 12px; color: #9CA3AF; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #E5E7EB; }
  .badge { padding: 6px 12px; border-radius: 20px; font-size: 13px; color: white; display: inline-block; }
  .days-badge { position: absolute; top: 12px; right: 12px; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
  .days-badge.overdue { background: #FEE2E2; color: #991B1B; }
  .days-badge.urgent { background: #FEF3C7; color: #92400E; }
  .days-badge.normal { background: #ECFDF5; color: #065F46; }
  .days-badge.done { background: #F3F4F6; color: #6B7280; }
  .empty-state { text-align: center; padding: 60px 20px; color: #9CA3AF; }
  .empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state h3 { margin: 0 0 8px; font-size: 16px; color: #6B7280; }
  .empty-state p { margin: 0; font-size: 14px; }
</style>

<div class="page">
  <div class="header">
    <h1>🐟 出塘排期与客户验收</h1>
  </div>
  <div class="container">
    {#if abnormalCount > 0}
      <div class="summary-card">
        <div class="summary-icon abnormal">⚠️</div>
        <div class="summary-info">
          <h3>异常排期提醒（{abnormalCount} 条）</h3>
          <p>卡点最长 {maxBlockerDays} 天{#if abnormalHandlers.length > 0} · 涉及 {abnormalHandlers.join("、")}{/if}</p>
        </div>
        <button class="summary-action" on:click={jumpToFirstAbnormal} disabled={!firstAbnormalId}>查看详情</button>
      </div>
    {/if}

    <div class="distribution-bar">
      {#each statusDistribution as sd}
        <button class="dist-badge {statusFilter === sd.status ? 'active' : ''}" style={statusFilter === sd.status ? 'color:' + sd.color : ''} on:click={() => { statusFilter = statusFilter === sd.status ? 'all' : sd.status; quickView = 'all'; }}>
          <span class="dist-dot" style="background:{sd.color}"></span>
          <span>{sd.role}</span>
          <span class="dist-count">{sd.count}</span>
        </button>
      {/each}
      {#if quickView === "mine"}
        <div class="mine-tags">
          <span class="mine-tag total">我负责 {mineCount} 条</span>
          <span class="mine-tag abn">异常 {mineAbnormalCount} 条</span>
        </div>
      {/if}
    </div>

    <div class="filter-bar">
      <div class="quick-views">
        <button class="quick-btn {quickView === 'all' ? 'active' : ''}" on:click={() => setQuickView("all")}>全部</button>
        <button class="quick-btn {quickView === 'abnormal' ? 'active' : ''}" on:click={() => setQuickView("abnormal")}>异常</button>
        <button class="quick-btn {quickView === 'mine' ? 'active' : ''}" on:click={() => setQuickView("mine")}>我负责</button>
      </div>
      <div class="filter-row">
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <div class="status-tabs">
            {#each statusOptions as opt}
              <button class="status-tab {statusFilter === opt.value ? 'active' : ''}" style={statusFilter === opt.value ? 'background:' + (opt.value === 'all' ? '#0D9488' : getStatusBadge(opt.value).color) : ''} on:click={() => { statusFilter = opt.value; quickView = 'all'; }}>
                {opt.label}
              </button>
            {/each}
          </div>
          <div class="handler-filter">
            <label>按责任人角色：</label>
            <select class="handler-select" bind:value={handlerFilter}>
              <option value="all">全部角色</option>
              {#each handlerRoles as role}
                <option value={role}>{role}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="sort-filter">
          <label>排序：</label>
          <select class="sort-select" bind:value={sortKey}>
            {#each sortOptions as so}
              <option value={so.value}>{so.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    {#if sorted.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>暂无匹配的排期记录</h3>
        <p>试试调整筛选条件或切换快捷视图</p>
      </div>
    {:else}
      {#each sorted as s}
        {@const days = daysRemaining(s.planDate)}
        <div class="list-item {s.isAbnormal ? 'abnormal' : ''}" on:click={() => viewDetail(s.id)}>
          {#if s.status === "completed"}
            <span class="days-badge done">已完结</span>
          {:else if days < 0}
            <span class="days-badge overdue">已超期 {Math.abs(days)} 天</span>
          {:else if days === 0}
            <span class="days-badge urgent">今日出塘</span>
          {:else if days <= 2}
            <span class="days-badge urgent">剩 {days} 天</span>
          {:else}
            <span class="days-badge normal">剩 {days} 天</span>
          {/if}
          <div class="item-header">
            <div>
              <h3 class="item-title">{s.id} · {s.pondNo} {s.species}</h3>
              <p class="item-meta">客户: {s.customer} | 预计: {s.estimatedWeight}斤 | 计划出塘: {s.planDate}</p>
            </div>
            <span class="badge" style="background:{getStatusBadge(s.status).color}">{getStatusBadge(s.status).role}</span>
          </div>
          <div class="item-handler">当前处理: {s.handlerName}（{s.currentHandler}）</div>
          {#if s.blocker}
            <div class="item-blocker">⚠️ 卡点: {s.blocker}</div>
          {/if}
          {#if s.history && s.history.length > 0}
            <div class="item-latest">📋 {lastHistorySummary(s.history)}</div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>
</div>
