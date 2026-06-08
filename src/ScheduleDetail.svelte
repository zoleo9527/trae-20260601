<script>
  import { schedules, handlers } from "./stores.js";
  import { selectedScheduleId, currentView } from "./stores.js";

  let schedule;
  let activeTab = "progress";
  let showActionModal = false;
  let actionRemark = "";

  let showAcceptModal = false;
  let editWeight = 0;
  let editChecks = {};

  $: {
    const id = $selectedScheduleId;
    if (id) schedule = $schedules.find(s => s.id === id);
  }

  function goBack() {
    currentView.set("list");
    selectedScheduleId.set(null);
  }

  function getStatusBadge(status) {
    return handlers[status] || { role: "未知", color: "#9CA3AF" };
  }

  const flowConfig = {
    pending_tech: {
      label: "确认出塘准备",
      nextStatus: "pending_feed",
      actor: "养殖技术员",
      nextHandler: "饲料仓管",
      nextHandlerName: "王仓管",
      nextBlocker: "待确认停料时间与出塘前饲料库存"
    },
    pending_feed: {
      label: "确认停料安排",
      nextStatus: "pending_manager",
      actor: "饲料仓管",
      nextHandler: "场长",
      nextHandlerName: "陈场长",
      nextBlocker: "待场长组织捕捞安排"
    },
    pending_manager: {
      label: "组织捕捞完成",
      nextStatus: "pending_accept",
      actor: "场长",
      nextHandler: "客户验收",
      nextHandlerName: "待客户确认",
      nextBlocker: "待客户现场验收确认"
    }
  };

  function openActionModal() {
    actionRemark = "";
    showActionModal = true;
  }

  function submitAction() {
    if (!schedule) return;
    const cfg = flowConfig[schedule.status];
    if (!cfg) return;
    const now = new Date().toLocaleString("zh-CN");
    schedules.update(items =>
      items.map(s => {
        if (s.id !== schedule.id) return s;
        return {
          ...s,
          status: cfg.nextStatus,
          currentHandler: cfg.nextHandler,
          handlerName: cfg.nextHandlerName,
          blocker: cfg.nextBlocker,
          isAbnormal: false,
          history: [
            ...s.history,
            {
              time: now,
              actor: `${cfg.actor} ${s.handlerName}`,
              action: cfg.label,
              remark: actionRemark || "已完成处理"
            }
          ]
        };
      })
    );
    showActionModal = false;
  }

  function openAcceptModal() {
    if (!schedule || !schedule.acceptance) return;
    editWeight = schedule.acceptance.actualWeight;
    editChecks = {};
    schedule.acceptance.checkItems.forEach(item => {
      editChecks[item.name] = item.result;
    });
    showAcceptModal = true;
  }

  function submitAcceptance() {
    if (!schedule || !schedule.acceptance) return;
    const now = new Date().toLocaleString("zh-CN");
    const updatedItems = schedule.acceptance.checkItems.map(item => ({
      ...item,
      result: editChecks[item.name] || item.result
    }));
    const allPass = updatedItems.every(i => i.result === "pass");

    schedules.update(items =>
      items.map(s => {
        if (s.id !== schedule.id) return s;
        return {
          ...s,
          status: allPass ? "completed" : s.status,
          currentHandler: allPass ? "已完成" : s.currentHandler,
          handlerName: allPass ? "-" : s.handlerName,
          blocker: allPass ? null : s.blocker,
          history: [
            ...s.history,
            {
              time: now,
              actor: "客户验收",
              action: allPass ? "验收签字确认" : "验收检查更新",
              remark: allPass
                ? `实际重量${editWeight}斤，全部检查项通过，已签字确认`
                : `实际重量${editWeight}斤，部分检查项待确认`
            }
          ],
          acceptance: {
            ...s.acceptance,
            actualWeight: editWeight,
            checkItems: updatedItems,
            completed: allPass,
            signUrl: allPass ? "已电子签字" : null,
            acceptTime: now,
            acceptedBy: allPass ? "客户（在线确认）" : s.acceptance.acceptedBy
          }
        };
      })
    );
    showAcceptModal = false;
  }

  function resultLabel(r) {
    return r === "pass" ? "通过" : r === "fail" ? "不通过" : "待定";
  }
  function resultBg(r) {
    return r === "pass" ? "#D1FAE5" : r === "fail" ? "#FEE2E2" : "#FEF3C7";
  }
  function resultColor(r) {
    return r === "pass" ? "#065F46" : r === "fail" ? "#991B1B" : "#92400E";
  }
</script>

<style>
  .page { min-height: 100vh; background: #F3F4F6; font-family: sans-serif; }
  .header { background: linear-gradient(135deg, #0D9488, #059669); color: white; padding: 16px 32px; }
  .back-btn { cursor: pointer; margin-bottom: 8px; opacity: 0.9; }
  .container { max-width: 1100px; margin: 0 auto; padding: 24px 32px; padding-bottom: 80px; }
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
  .action-bar { position: sticky; bottom: 0; background: white; padding: 16px 24px; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 12px; box-shadow: 0 -2px 8px rgba(0,0,0,0.06); }
  .btn { padding: 10px 24px; border-radius: 8px; font-size: 15px; cursor: pointer; border: none; transition: background 0.2s; }
  .btn-primary { background: #0D9488; color: white; }
  .btn-primary:hover { background: #0F766E; }
  .btn-secondary { background: white; color: #0D9488; border: 1px solid #0D9488; }
  .btn-secondary:hover { background: #F0FDFA; }
  .btn-danger { background: #EF4444; color: white; }
  .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal { background: white; border-radius: 12px; padding: 24px; width: 520px; max-width: 92vw; max-height: 90vh; overflow-y: auto; }
  .modal h3 { margin: 0 0 16px; font-size: 18px; color: #1F2937; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
  .form-label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px; }
  .form-input { width: 100%; padding: 10px 12px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 14px; font-family: inherit; box-sizing: border-box; }
  .form-input:focus { outline: none; border-color: #0D9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
  .form-group { margin-bottom: 16px; }
  textarea.form-input { resize: vertical; min-height: 80px; }
  .check-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #E5E7EB; }
  .check-row:last-child { border-bottom: none; }
  .check-select { padding: 6px 10px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 13px; cursor: pointer; }
  .completed-tag { background: #F3F4F6; color: #6B7280; padding: 8px 16px; border-radius: 8px; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
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
          <div>
            <h2 style="margin:0 0 8px;">{schedule.id}</h2>
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
          <div>
            <div style="font-size:13px;color:#059669;">当前责任人 · {schedule.currentHandler}</div>
            <div style="font-size:18px;font-weight:600;">{schedule.handlerName}</div>
          </div>
        </div>
      {:else}
        <div style="background:#F3F4F6;border-radius:10px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
          <span class="completed-tag">✅ 本排期已完成全流程</span>
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
          <div class="tab {activeTab === 'progress' ? 'active' : ''}" on:click={() => activeTab = 'progress'}>处理进度</div>
          <div class="tab {activeTab === 'inspection' ? 'active' : ''}" on:click={() => activeTab = 'inspection'}>塘口巡检</div>
          <div class="tab {activeTab === 'feed' ? 'active' : ''}" on:click={() => activeTab = 'feed'}>投喂记录</div>
          <div class="tab {activeTab === 'medicine' ? 'active' : ''}" on:click={() => activeTab = 'medicine'}>药品台账</div>
          {#if schedule.acceptance}
            <div class="tab {activeTab === 'acceptance' ? 'active' : ''}" on:click={() => activeTab = 'acceptance'}>客户验收</div>
          {/if}
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
            <div style="margin-bottom:16px;">
              <span style="font-size:14px;color:#065F46;">实际重量: </span>
              <span style="font-size:16px;font-weight:600;color:#065F46;">{schedule.acceptance.actualWeight} 斤</span>
            </div>
            {#each schedule.acceptance.checkItems as item}
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #D1FAE5;">
                <div>
                  <div style="font-weight:500;color:#065F46;">{item.name}</div>
                  <div style="font-size:13px;color:#047857;margin-top:4px;">{item.remark}</div>
                </div>
                <span style="padding:4px 10px;border-radius:6px;font-size:13px;font-weight:500;background:{resultBg(item.result)};color:{resultColor(item.result)};">
                  {resultLabel(item.result)}
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
              {#if !schedule.acceptance.completed && schedule.status === "pending_accept"}
                <button class="btn btn-primary" on:click={openAcceptModal}>客户签字确认</button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if schedule.status !== "completed"}
      <div class="action-bar">
        <button class="btn btn-secondary" on:click={goBack}>返回</button>
        {#if flowConfig[schedule.status]}
          <button class="btn btn-primary" on:click={openActionModal}>{flowConfig[schedule.status].label}</button>
        {/if}
      </div>
    {/if}
  </div>

  {#if showActionModal && flowConfig[schedule.status]}
    <div class="overlay" on:click|self={() => showActionModal = false}>
      <div class="modal">
        <h3>{flowConfig[schedule.status].label}</h3>
        <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">
          当前处理人：{schedule.handlerName}（{schedule.currentHandler}）<br>
          处理后将流转至：{flowConfig[schedule.status].nextHandler}
        </p>
        <div class="form-group">
          <label class="form-label">处理备注</label>
          <textarea class="form-input" bind:value={actionRemark} placeholder="请输入处理备注（可选）"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => showActionModal = false}>取消</button>
          <button class="btn btn-primary" on:click={submitAction}>确认提交</button>
        </div>
      </div>
    </div>
  {/if}

  {#if showAcceptModal && schedule.acceptance}
    <div class="overlay" on:click|self={() => showAcceptModal = false}>
      <div class="modal">
        <h3>客户验收签字确认</h3>
        <p style="margin:0 0 16px;font-size:14px;color:#6B7280;">
          请确认实际重量和各项检查结果，全部通过后即可签字完成验收。
        </p>
        <div class="form-group">
          <label class="form-label">实际重量（斤）</label>
          <input type="number" class="form-input" bind:value={editWeight} />
        </div>
        <div class="form-group">
          <label class="form-label">检查项结果</label>
          {#each schedule.acceptance.checkItems as item}
            <div class="check-row">
              <div>
                <div style="font-weight:500;color:#1F2937;">{item.name}</div>
                <div style="font-size:13px;color:#6B7280;">{item.remark}</div>
              </div>
              <select class="check-select" bind:value={editChecks[item.name]}>
                <option value="pass">通过</option>
                <option value="fail">不通过</option>
                <option value="pending">待定</option>
              </select>
            </div>
          {/each}
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" on:click={() => showAcceptModal = false}>取消</button>
          <button class="btn btn-primary" on:click={submitAcceptance}>确认签字</button>
        </div>
      </div>
    </div>
  {/if}
{/if}
