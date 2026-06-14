<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { STATUS, ROLES, FLOW, NOTIFY_METHODS, NOTIFY_CHANNELS, ABNORMAL_TRIGGERS } from '$lib/constants.js';
  import { currentRole, showToast } from '$lib/stores.js';

  let data = null;
  let role = 'APPRAISER';
  let orderId;
  let loading = true;
  let showActionModal = false;
  let showNotifyModal = false;
  let showAttachModal = false;
  let showAbnormalModal = false;
  let showNotifyHistoryModal = false;
  let selectedAction = null;
  let actionNotes = '';
  let selectedAbnormal = null;
  let abnormalNotes = '';

  let notifyMethod = 'FORMAL';
  let notifyChannels = [];
  let notifyContent = '';
  let showHistoryForNotification = null;

  let attachFileName = '';
  let attachType = 'DOC';

  $: role = $currentRole;
  $: orderId = parseInt($page.params.id);

  $: availableActions = data ? FLOW.filter(f => f.from === data.order.current_status && f.actor === role && !f.hiddenFromMain) : [];
  $: abnormalOptions = data ? ABNORMAL_TRIGGERS.filter(a => a.applyTo.includes(data.order.current_status) && a.triggerRole === role) : [];
  $: hasAbnormal = data && abnormalOptions.length > 0;

  $: notifyTemplates = data ? {
    FORMAL: `【XX典当】${data.order.customer_name}先生/女士您好，您于${data.order.pawn_date}典当的【${data.order.item_name}】（单号：${data.order.order_no}），现已逾期，请您尽快携带本人身份证及当票前往门店办理赎当/续当手续。如有疑问请联系您的柜台评估师。`,
    REMINDER: `【提醒】${data.order.customer_name}您好，您的典当物品【${data.order.item_name}】到期未处理，请合理安排时间，避免进一步产生违约金。`,
    URGENCY: `【紧急催告】${data.order.customer_name}，您典当的【${data.order.item_name}】已严重逾期，若3日内仍未处理，我方将依据合同启动公开处置程序。请务必重视。`
  } : {};

  async function load() {
    loading = true;
    data = await fetch(`/api/orders/${orderId}`).then(r => r.json());
    loading = false;
  }

  onMount(load);
  $: if (orderId) load();

  function overdueDays(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((now - due) / (1000 * 60 * 60 * 24));
  }

  function openAction(action) {
    selectedAction = action;
    actionNotes = '';
    showActionModal = true;
  }

  async function confirmAction() {
    const userName = { APPRAISER: '李评估', STORAGE: '王库管', FINANCE: '陈财务' }[role];
    const res = await fetch(`/api/orders/${orderId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: selectedAction.action,
        role,
        roleName: userName,
        notes: actionNotes,
        abnormalTrigger: selectedAction.isAbnormal ? selectedAbnormal : null
      })
    }).then(r => r.json());
    if (res.success) {
      showToast(`操作成功：${selectedAction.label}`, 'success');
      showActionModal = false;
      selectedAction = null;
      selectedAbnormal = null;
      actionNotes = '';
      load();
    } else {
      showToast('操作失败', 'error');
    }
  }

  function openNotify() {
    notifyChannels = ['WECHAT'];
    notifyMethod = 'FORMAL';
    notifyContent = notifyTemplates.FORMAL;
    showNotifyModal = true;
  }

  function toggleChannel(ch) {
    if (notifyChannels.includes(ch)) {
      notifyChannels = notifyChannels.filter(c => c !== ch);
    } else {
      notifyChannels = [...notifyChannels, ch];
    }
  }

  function applyTemplate() {
    notifyContent = notifyTemplates[notifyMethod];
  }

  async function sendNotification() {
    if (notifyChannels.length === 0) {
      showToast('请选择至少一种通知渠道', 'warn');
      return;
    }
    const userName = { APPRAISER: '李评估', STORAGE: '王库管', FINANCE: '陈财务' }[role];
    const transitionId = data.transitions[data.transitions.length - 1]?.id;
    for (const ch of notifyChannels) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          transitionId,
          method: notifyMethod,
          channel: ch,
          content: notifyContent,
          role,
          roleName: userName
        })
      }).then(r => r.json());
    }
    showToast(`已通过 ${notifyChannels.length} 种渠道发送客户通知`, 'success');
    showNotifyModal = false;
    load();
  }

  function openHistoryFor(notification) {
    showHistoryForNotification = notification;
    showNotifyHistoryModal = true;
  }

  function openAttach() {
    attachFileName = '';
    attachType = 'DOC';
    showAttachModal = true;
  }

  async function addPlaceholderAttachment() {
    if (!attachFileName) {
      showToast('请填写文件名称', 'warn');
      return;
    }
    const userName = { APPRAISER: '李评估', STORAGE: '王库管', FINANCE: '陈财务' }[role];
    const transitionId = data.transitions[data.transitions.length - 1]?.id;
    await fetch('/api/attachments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        transitionId,
        notificationId: null,
        fileName: attachFileName + (attachType === 'IMG' ? '.jpg' : attachType === 'PDF' ? '.pdf' : '.doc'),
        fileType: attachType,
        fileSize: 0,
        role,
        roleName: userName,
        isPlaceholder: true,
        storagePath: null
      })
    }).then(r => r.json());
    showToast('附件占位已添加，待后续补传原件', 'success');
    showAttachModal = false;
    load();
  }

  function openAbnormal() {
    selectedAbnormal = null;
    abnormalNotes = '';
    showAbnormalModal = true;
  }

  async function confirmAbnormal() {
    if (!selectedAbnormal) {
      showToast('请选择异常类型', 'warn');
      return;
    }
    if (!abnormalNotes.trim()) {
      showToast('请填写异常详情说明', 'warn');
      return;
    }
    const userName = { APPRAISER: '李评估', STORAGE: '王库管', FINANCE: '陈财务' }[role];
    const notes = `【异常·${selectedAbnormal.label}】${abnormalNotes}`;
    const res = await fetch(`/api/orders/${orderId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: selectedAbnormal.returnAction,
        role,
        roleName: userName,
        notes,
        abnormalTrigger: {
          key: selectedAbnormal.key,
          label: selectedAbnormal.label,
          alertMessage: selectedAbnormal.alertMessage,
          severity: selectedAbnormal.severity
        }
      })
    }).then(r => r.json());
    if (res.success) {
      showToast(`异常已上报：${selectedAbnormal.label}，已退回至 ${STATUS[selectedAbnormal.returnTo]?.label}`, 'success');
      showAbnormalModal = false;
      selectedAbnormal = null;
      abnormalNotes = '';
      load();
    } else {
      showToast(res.message || '操作失败', 'error');
    }
  }

  const FLOW_NODES = [
    { key: 'NORMAL', label: '正常在当' },
    { key: 'OVERDUE_PENDING', label: '逾期待处理' },
    { key: 'OVERDUE_CONFIRMED', label: '转核库' },
    { key: 'STORAGE_CHECKED', label: '核库完成' },
    { key: 'FINANCIAL_SETTLED', label: '结算完成' },
    { key: 'CUSTOMER_NOTIFIED', label: '已通知客户' },
    { key: 'CLOSED', label: '结案' }
  ];

  function getNodeState(nodeKey) {
    if (!data) return 'pending';
    const currentIdx = FLOW_NODES.findIndex(n => n.key === data.order.current_status);
    const idx = FLOW_NODES.findIndex(n => n.key === nodeKey);
    if (currentIdx === -1) return 'pending';
    if (idx < currentIdx) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  }

  function hasAlerts() {
    return data?.transitions.some(t => t.has_alert);
  }
</script>

<div class="max-w-7xl mx-auto px-6 py-6">
  {#if loading}
    <div class="text-center text-slate-400 py-20">加载中...</div>
  {:else if data}
    <div class="mb-5">
      <div class="flex items-center gap-3 mb-1">
        <a href="/orders" class="text-slate-500 hover:text-slate-700">← 返回列表</a>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-800">
              <span class="font-mono text-blue-700">{data.order.order_no}</span>
            </h1>
            <span class="status-pill" style="background: {STATUS[data.order.current_status]?.color}">
              {STATUS[data.order.current_status]?.label}
            </span>
            {#if hasAlerts()}
              <span class="status-pill bg-red-600">⚠️ 有异常</span>
            {/if}
          </div>
          <p class="text-sm text-slate-500 mt-1">{STATUS[data.order.current_status]?.description}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          {#each availableActions as a}
            <button on:click={() => openAction(a)} class="btn {a.isAbnormal ? 'btn-danger' : 'btn-primary'}">
              {a.isAbnormal ? '⚠️ ' : ''}{a.label}
            </button>
          {/each}
          {#if data.order.current_status !== 'NORMAL' && data.order.current_status !== 'CLOSED'}
            <button on:click={openNotify} class="btn btn-warn">📣 发送客户通知</button>
            <button on:click={openAttach} class="btn btn-secondary">📎 添加附件</button>
          {/if}
          {#if abnormalOptions.length > 0}
            <button on:click={openAbnormal} class="btn btn-danger">🚨 异常上报</button>
          {/if}
        </div>
      </div>
    </div>

    <div class="card p-5 mb-6">
      <div class="text-xs font-semibold text-slate-500 mb-3">接力状态流（逾期处置不是终点）</div>
      <div class="flex flex-wrap items-center gap-1 md:gap-2">
        {#each FLOW_NODES as node, i}
          {#if i > 0}
            <span class="text-slate-300 text-sm">→</span>
          {/if}
          <div class="flow-node {getNodeState(node.key)}">
            {node.label}
          </div>
        {/each}
      </div>
      <div class="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>👤 <span class="text-blue-600 font-medium">评估师</span>: 发起逾期 → 通知客户</span>
        <span>🏬 <span class="text-emerald-600 font-medium">库管</span>: 核验当物状态</span>
        <span>💰 <span class="text-amber-600 font-medium">财务</span>: 结算费用核算</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 class="font-bold text-slate-800">📋 典当信息</h2>
            <span class="text-xs text-red-600 font-semibold">
              逾期 {overdueDays(data.order.due_date)} 天
            </span>
          </div>
          <div class="p-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div class="text-xs text-slate-500 mb-1">客户</div>
              <div class="font-medium text-slate-800">{data.order.customer_name}</div>
              <div class="text-xs text-slate-500">{data.order.customer_phone}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">当物</div>
              <div class="font-medium text-slate-800">{data.order.item_name}</div>
              <div class="text-xs text-slate-500">{data.order.item_desc}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">评估值 / 当金</div>
              <div class="font-semibold text-slate-800">
                ¥{data.order.loan_amount.toLocaleString()}
                <span class="text-xs text-slate-400 font-normal"> / ¥{data.order.appraised_value.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">典当日</div>
              <div class="font-medium text-slate-800">{data.order.pawn_date}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">到期日</div>
              <div class="font-medium text-red-600">{data.order.due_date}</div>
            </div>
            <div>
              <div class="text-xs text-slate-500 mb-1">最后更新</div>
              <div class="font-medium text-slate-800">{data.order.updated_at}</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">⏱ 流转时间线（可回看客户通知）</h2>
            <p class="text-xs text-slate-500 mt-0.5">角色接力全过程，客户通知内嵌其中，非独立菜单</p>
          </div>
          <div class="p-5">
            {#if data.timeline.length === 0}
              <div class="text-center text-slate-400 py-8 text-sm">暂无流转记录</div>
            {:else}
              {#each data.timeline as item}
                {#if item.type === 'transition'}
                  <div class="timeline-item {item.data.is_abnormal ? 'is-abnormal' : ''}">
                    <div class="timeline-dot {item.data.has_alert ? 'alert' : ''}" style="background: {item.data.is_abnormal ? '#dc2626' : STATUS[item.data.to_status]?.color || '#64748b'}"></div>
                    <div class="mb-1.5 flex flex-wrap items-center gap-2">
                      <span class="status-pill" style="background: {item.data.is_abnormal ? '#dc2626' : STATUS[item.data.to_status]?.color}">
                        {item.data.is_abnormal ? '↩ ' : '→ '}{STATUS[item.data.to_status]?.label}
                      </span>
                      <span class="role-badge" style="background: {ROLES[item.data.actor_role]?.color}">{ROLES[item.data.actor_role]?.name} · {item.data.actor_name}</span>
                      {#if item.data.is_abnormal && item.data.abnormal_label}
                        <span class="status-pill bg-red-600">🚨 {item.data.abnormal_label}</span>
                      {/if}
                      {#if item.data.is_abnormal && item.data.abnormal_severity}
                        <span class="status-pill {item.data.abnormal_severity === 'critical' ? 'bg-rose-700' : item.data.abnormal_severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}">
                          {item.data.abnormal_severity === 'critical' ? '🔴 严重' : item.data.abnormal_severity === 'high' ? '🟠 高' : '🟡 中'}
                        </span>
                      {/if}
                    </div>
                    {#if item.data.from_status}
                      <div class="text-xs text-slate-500 mb-1">
                        {STATUS[item.data.from_status]?.label} {item.data.is_abnormal ? '⟵ 退回自' : '→'} {STATUS[item.data.to_status]?.label}
                        {#if item.data.is_abnormal}
                          <span class="ml-2 text-red-600 font-medium">（异常退回，退回上一环节重办）</span>
                        {/if}
                      </div>
                    {/if}
                    {#if item.data.alert_message}
                      <div class="alert-banner mb-2 text-xs">
                        <span>🚨</span>
                        <div>
                          <div class="font-semibold mb-0.5">异常提醒</div>
                          <div>{item.data.alert_message}</div>
                        </div>
                      </div>
                    {/if}
                    {#if item.data.notes}
                      <div class="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mb-1">{item.data.notes}</div>
                    {/if}
                    <div class="text-xs text-slate-400">{item.data.created_at}</div>
                  </div>
                {:else if item.type === 'notification'}
                  <div class="timeline-item">
                    <div class="timeline-dot" style="background: #8b5cf6"></div>
                    <div class="mb-1.5 flex flex-wrap items-center gap-2">
                      <span class="status-pill bg-violet-500">
                        📣 {NOTIFY_METHODS[item.data.notify_method]?.label}
                      </span>
                      <span class="status-pill" style="background: #0891b2">
                        {NOTIFY_CHANNELS[item.data.notify_channel]?.icon} {NOTIFY_CHANNELS[item.data.notify_channel]?.label}
                      </span>
                      {#if item.data.customer_ack}
                        <span class="status-pill bg-emerald-500">✓ 已签收</span>
                      {:else}
                        <span class="status-pill bg-amber-500">⏳ 待签收</span>
                      {/if}
                    </div>
                    <div class="text-sm text-slate-700 bg-violet-50 border border-violet-100 rounded-lg p-3 mb-1 whitespace-pre-wrap">
                      {item.data.content}
                    </div>
                    {#if item.data.customer_ack && item.data.ack_notes}
                      <div class="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-1">
                        <div class="text-xs font-semibold text-emerald-700 mb-1">客户反馈（{item.data.ack_method}）</div>
                        {item.data.ack_notes}
                      </div>
                    {/if}
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                      <div class="text-xs text-slate-400">{item.data.sent_by_name} 发送于 {item.data.sent_at}</div>
                      <button on:click={() => openHistoryFor(item.data)} class="text-xs text-violet-600 hover:underline">查看通知记录详情 →</button>
                    </div>
                  </div>
                {/if}
              {/each}
            {/if}
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card">
          <div class="p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">📣 客户通知记录</h2>
            <p class="text-xs text-slate-500 mt-0.5">累计 {data.notifications.length} 次</p>
          </div>
          <div class="divide-y divide-slate-100">
            {#if data.notifications.length === 0}
              <div class="p-8 text-center text-slate-400 text-sm">
                <div class="text-3xl mb-2">📭</div>
                暂未发送客户通知
              </div>
            {/if}
            {#each data.notifications as n}
              <div class="p-4 hover:bg-slate-50 cursor-pointer" on:click={() => openHistoryFor(n)}>
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="status-pill" style="background: #0891b2">
                      {NOTIFY_CHANNELS[n.notify_channel]?.icon} {NOTIFY_CHANNELS[n.notify_channel]?.label}
                    </span>
                    {#if n.customer_ack}
                      <span class="text-xs text-emerald-600 font-medium">✓ 已确认</span>
                    {:else}
                      <span class="text-xs text-amber-600 font-medium">待确认</span>
                    {/if}
                  </div>
                </div>
                <div class="text-xs text-slate-700 line-clamp-2 mb-1">{n.content}</div>
                <div class="text-xs text-slate-400">{n.sent_at}</div>
              </div>
            {/each}
          </div>
        </div>

        <div class="card">
          <div class="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 class="font-bold text-slate-800">📎 附件记录</h2>
            <button on:click={openAttach} class="text-xs text-blue-600 hover:underline">+ 添加占位</button>
          </div>
          <div class="divide-y divide-slate-100">
            {#if data.attachments.length === 0}
              <div class="p-8 text-center text-slate-400 text-sm">
                <div class="text-3xl mb-2">📎</div>
                暂无附件，可添加占位
              </div>
            {/if}
            {#each data.attachments as a}
              <div class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xl shrink-0">
                    {a.file_type === 'IMG' ? '🖼️' : a.file_type === 'PDF' ? '📄' : '📝'}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-slate-700 truncate">
                      {a.file_name}
                      {#if a.is_placeholder}
                        <span class="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">占位待补</span>
                      {/if}
                    </div>
                    <div class="text-xs text-slate-500">{a.uploaded_by_name} · {a.created_at}</div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="card">
          <div class="p-5 border-b border-slate-100">
            <h2 class="font-bold text-slate-800">🎯 我的职责</h2>
          </div>
          <div class="p-5 text-sm text-slate-600">
            <div class="mb-3 flex items-center gap-2">
              <span class="role-badge" style="background: {ROLES[role]?.color}">{ROLES[role]?.name}</span>
            </div>
            <p class="text-slate-600 mb-2">{ROLES[role]?.desc}</p>
            {#if availableActions.length > 0}
              <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div class="text-xs font-semibold text-blue-700 mb-1.5">📥 可执行操作</div>
                <ul class="text-xs text-blue-600 space-y-1">
                  {#each availableActions as a}
                    <li>• {a.label}</li>
                  {/each}
                </ul>
              </div>
            {:else if data.order.current_status !== 'NORMAL' && data.order.current_status !== 'CLOSED'}
              <div class="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500">
                当前状态下该角色无操作权限，请切换角色或等待上一环节完成
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作确认弹窗 -->
    {#if showActionModal && selectedAction}
      <div class="modal-mask" on:click|self={() => showActionModal = false}>
        <div class="modal">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-lg text-slate-800">
              {selectedAction.isAbnormal ? '🚨 ' : ''}{selectedAction.label}
            </h3>
            <p class="text-xs text-slate-500 mt-1">
              当前状态：{STATUS[selectedAction.from]?.label} → 目标状态：{STATUS[selectedAction.to]?.label}
            </p>
          </div>
          <div class="p-5 space-y-4">
            {#if selectedAction.isAbnormal && abnormalOptions.length > 0}
              <div>
                <label class="label">异常类型（触发提醒/退回）</label>
                <div class="space-y-2">
                  {#each abnormalOptions as abn}
                    <label class={`block p-3 rounded-lg border-2 cursor-pointer transition ${selectedAbnormal?.key === abn.key ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div class="flex items-start gap-2">
                        <input type="radio" bind:group={selectedAbnormal} value={abn} class="mt-1" />
                        <div class="flex-1">
                          <div class="text-sm font-medium text-slate-800">{abn.label}</div>
                          <div class="text-xs text-red-600 mt-0.5">{abn.alertMessage}</div>
                        </div>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>
            {/if}
            <div>
              <label class="label">处理说明 <span class="text-slate-400 font-normal">（必填，留痕可追溯）</span></label>
              <textarea bind:value={actionNotes} class="textarea" placeholder="请详细说明处理过程、现场情况、沟通结果等，以备后续责任追溯"></textarea>
            </div>
            {#if selectedAbnormal}
              <div class="alert-banner">
                <span>🚨</span>
                <div>
                  <div class="font-semibold mb-0.5">系统将触发异常提醒</div>
                  <div class="text-xs">{selectedAbnormal.alertMessage}</div>
                  <div class="text-xs mt-1">流程将退回至对应角色，所有相关人员可见此异常标记</div>
                </div>
              </div>
            {/if}
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button class="btn btn-secondary" on:click={() => { showActionModal = false; selectedAction = null; }}>取消</button>
            <button class="btn {selectedAction.isAbnormal ? 'btn-danger' : 'btn-primary'}" disabled={!actionNotes.trim()} on:click={confirmAction}>
              确认{selectedAction.label}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- 客户通知弹窗（非独立菜单，嵌入流程） -->
    {#if showNotifyModal}
      <div class="modal-mask" on:click|self={() => showNotifyModal = false}>
        <div class="modal max-w-lg">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-lg text-slate-800">📣 发送客户通知</h3>
            <p class="text-xs text-slate-500 mt-1">通知直接关联此单流转记录，所有记录可回溯</p>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="label">通知类型</label>
              <div class="grid grid-cols-3 gap-2">
                {#each Object.values(NOTIFY_METHODS) as m}
                  <button class={`p-3 rounded-lg border-2 text-center text-sm transition ${notifyMethod === m.key ? 'border-violet-500 bg-violet-50 text-violet-700 font-semibold' : 'border-slate-200 hover:border-slate-300'}`} on:click={() => { notifyMethod = m.key; notifyContent = notifyTemplates[m.key]; }}>
                    {m.label}
                  </button>
                {/each}
              </div>
              <button on:click={applyTemplate} class="mt-2 text-xs text-violet-600 hover:underline">使用对应模板</button>
            </div>
            <div>
              <label class="label">通知渠道（可多选）</label>
              <div class="flex flex-wrap gap-2">
                {#each Object.values(NOTIFY_CHANNELS) as ch}
                  <label class={`px-3 py-2 rounded-lg border-2 cursor-pointer text-sm transition ${notifyChannels.includes(ch.key) ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="checkbox" class="hidden" checked={notifyChannels.includes(ch.key)} on:change={() => toggleChannel(ch.key)} />
                    {ch.icon} {ch.label}
                  </label>
                {/each}
              </div>
            </div>
            <div>
              <label class="label">通知内容</label>
              <textarea bind:value={notifyContent} class="textarea" rows="6"></textarea>
            </div>
            <div class="alert-banner warn">
              <span>💡</span>
              <div class="text-xs">
                通知内容将永久留痕，不可删除。建议通过多渠道同时发送以避免责任不清。
              </div>
            </div>
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button class="btn btn-secondary" on:click={() => showNotifyModal = false}>取消</button>
            <button class="btn btn-warn" on:click={sendNotification}>发送通知（{notifyChannels.length} 渠道）</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- 附件占位弹窗 -->
    {#if showAttachModal}
      <div class="modal-mask" on:click|self={() => showAttachModal = false}>
        <div class="modal max-w-md">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-lg text-slate-800">📎 添加附件占位</h3>
            <p class="text-xs text-slate-500 mt-1">先占位记录附件位置，后续补传原件即可</p>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="label">附件类型</label>
              <div class="grid grid-cols-3 gap-2">
                {#each [{ k: 'DOC', l: '📝 文档' }, { k: 'PDF', l: '📄 PDF' }, { k: 'IMG', l: '🖼️ 图片' }] as t}
                  <button class={`p-3 rounded-lg border-2 text-sm transition ${attachType === t.k ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibard' : 'border-slate-200 hover:border-slate-300'}`} on:click={() => attachType = t.k}>
                    {t.l}
                  </button>
                {/each}
              </div>
            </div>
            <div>
              <label class="label">文件名称（无需扩展名）</label>
              <input bind:value={attachFileName} class="input" placeholder="例：现场检查记录、当物照片-正面、沟通截图-微信..."/>
            </div>
            <div class="placeholder-attach" on:click={addPlaceholderAttachment}>
              <div class="text-3xl mb-2">+</div>
              <div class="text-sm font-medium">点击创建占位记录</div>
              <div class="text-xs text-slate-400 mt-1">（暂模拟占位，待后补传原件）</div>
            </div>
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button class="btn btn-secondary" on:click={() => showAttachModal = false}>取消</button>
            <button class="btn btn-primary" disabled={!attachFileName.trim()} on:click={addPlaceholderAttachment}>确认占位</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- 异常上报弹窗 -->
    {#if showAbnormalModal}
      <div class="modal-mask" on:click|self={() => showAbnormalModal = false}>
        <div class="modal max-w-lg">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-lg text-red-700">🚨 异常上报（强制触发提醒 + 退回）</h3>
            <p class="text-xs text-slate-500 mt-1">必须选择异常类型，系统将自动退回对应环节并全程标记异常</p>
          </div>
          <div class="p-5 space-y-4">
            {#if abnormalOptions.length === 0}
              <div class="alert-banner warn">
                <span>ℹ️</span>
                <div>当前状态下该角色没有可触发的异常类型，请等待状态流转或切换角色</div>
              </div>
            {/if}
            <div class="space-y-2">
              {#each abnormalOptions as abn}
                <label class={`block p-4 rounded-lg border-2 cursor-pointer transition ${selectedAbnormal?.key === abn.key ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  <div class="flex items-start gap-3">
                    <input type="radio" bind:group={selectedAbnormal} value={abn} class="mt-1" />
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="text-sm font-semibold text-slate-800">{abn.label}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full {abn.severity === 'critical' ? 'bg-rose-100 text-rose-700' : abn.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}">
                          {abn.severity === 'critical' ? '严重' : abn.severity === 'high' ? '高' : '中'}
                        </span>
                      </div>
                      <div class="text-xs text-red-600 mb-2">{abn.alertMessage}</div>
                      <div class="text-xs text-slate-500 flex items-center gap-1">
                        <span>↩️ 退回至：</span>
                        <span class="font-medium text-slate-700">{STATUS[abn.returnTo]?.label}</span>
                        <span class="text-slate-400">·</span>
                        <span>由</span>
                        <span class="font-medium text-slate-700">{ROLES[STATUS[abn.returnTo]?.role]?.name || '相关角色'}</span>
                        <span>重新处理</span>
                      </div>
                    </div>
                  </div>
                </label>
              {/each}
            </div>
            <div>
              <label class="label">异常详情说明 <span class="text-slate-400 font-normal">（必填，留痕可追溯）</span></label>
              <textarea bind:value={abnormalNotes} class="textarea" rows="4" placeholder="请详细描述异常情况，如：损坏位置、封签编号、缺失证件名称、客户申诉内容、现场发现过程等"></textarea>
            </div>
            {#if selectedAbnormal}
              <div class="alert-banner">
                <span>⚠️</span>
                <div>
                  <div class="font-semibold mb-0.5">提交后将立即生效</div>
                  <div class="text-xs">
                    状态从 <span class="font-medium">{STATUS[data.order.current_status]?.label}</span>
                    退回至 <span class="font-medium text-red-700">{STATUS[selectedAbnormal.returnTo]?.label}</span>，
                    时间线将永久标记【{selectedAbnormal.label}】异常。
                  </div>
                </div>
              </div>
            {/if}
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button class="btn btn-secondary" on:click={() => showAbnormalModal = false}>取消</button>
            <button class="btn btn-danger" disabled={!selectedAbnormal || !abnormalNotes.trim()} on:click={confirmAbnormal}>
              确认上报并退回
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- 客户通知回看弹窗 -->
    {#if showNotifyHistoryModal && showHistoryForNotification}
      <div class="modal-mask" on:click|self={() => showNotifyHistoryModal = false}>
        <div class="modal max-w-lg">
          <div class="p-5 border-b border-slate-100">
            <h3 class="font-bold text-lg text-slate-800">📣 通知回看 · 完整细节</h3>
            <p class="text-xs text-slate-500 mt-1">客户通知记录永久留痕，责任清晰</p>
          </div>
          <div class="p-5 space-y-4">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 bg-slate-50 rounded-lg">
                <div class="text-xs text-slate-500 mb-1">通知类型</div>
                <div class="font-semibold text-slate-800">{NOTIFY_METHODS[showHistoryForNotification.notify_method]?.label}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg">
                <div class="text-xs text-slate-500 mb-1">通知渠道</div>
                <div class="font-semibold text-slate-800">{NOTIFY_CHANNELS[showHistoryForNotification.notify_channel]?.icon} {NOTIFY_CHANNELS[showHistoryForNotification.notify_channel]?.label}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg">
                <div class="text-xs text-slate-500 mb-1">发送人</div>
                <div class="font-semibold text-slate-800">{ROLES[showHistoryForNotification.sent_by_role]?.name} · {showHistoryForNotification.sent_by_name}</div>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg">
                <div class="text-xs text-slate-500 mb-1">发送时间</div>
                <div class="font-semibold text-slate-800 text-xs">{showHistoryForNotification.sent_at}</div>
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-600 mb-2">通知正文</div>
              <div class="p-4 bg-violet-50 border border-violet-100 rounded-lg text-sm whitespace-pre-wrap text-slate-800">
                {showHistoryForNotification.content}
              </div>
            </div>
            {#if showHistoryForNotification.customer_ack}
              <div>
                <div class="text-xs font-semibold text-emerald-700 mb-2">✓ 客户签收确认</div>
                <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div class="flex gap-4 text-xs mb-2">
                    <div>方式：<span class="font-medium text-slate-700">{showHistoryForNotification.ack_method}</span></div>
                    <div>时间：<span class="font-medium text-slate-700">{showHistoryForNotification.ack_at}</span></div>
                  </div>
                  {#if showHistoryForNotification.ack_notes}
                    <div class="text-sm text-slate-700 mt-2 pt-2 border-t border-emerald-200">
                      {showHistoryForNotification.ack_notes}
                    </div>
                  {/if}
                </div>
              </div>
            {:else}
              <div class="alert-banner warn">
                <span>⏳</span>
                <div class="text-xs">客户尚未确认签收，建议补发多渠道通知并记录电话沟通</div>
              </div>
            {/if}
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3">
            <button class="btn btn-secondary" on:click={() => showNotifyHistoryModal = false}>关闭</button>
            <button class="btn btn-primary" on:click={() => { showNotifyHistoryModal = false; openNotify(); }}>再次发送通知</button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
