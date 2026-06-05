<script>
  import {
    complaintRecords, greenBeans, roastCurves,
    advanceStatus, addNote, updateReturnReason, updateRecoveryAction,
    submitFlavorReview, STATUS_MAP
  } from './store.js';
  import StatusBadge from './StatusBadge.svelte';

  let { recordId, onBack, currentRole } = $props();

  let activeTab = $state('overview');
  let noteText = $state('');
  let returnReasonText = $state('');
  let recoveryActionText = $state('');
  let reviewAcidity = $state(5);
  let reviewSweetness = $state(5);
  let reviewBody = $state(5);
  let reviewAftertaste = $state(5);
  let reviewNotes = $state('');
  let showHistory = $state(false);
  let showNotes = $state(true);

  let record = $derived($complaintRecords.find(r => r.id === recordId));
  let bean = $derived($greenBeans.find(b => b.id === record?.beanId));
  let curve = $derived($roastCurves.find(c => c.id === record?.curveId));

  let tabs = $derived([
    { key: 'overview', label: '概览' },
    { key: 'recovery', label: '客诉回收' },
    { key: 'flavor', label: '风味复盘' },
    { key: 'notes', label: '备注历史' }
  ]);

  let canAdvance = $derived(() => {
    if (!record) return false;
    const next = STATUS_MAP[record.status]?.next;
    if (!next) return false;
    if (record.status === 'pending') return currentRole === '渠道客服';
    if (record.status === 'recovering') return currentRole === '杯测员';
    if (record.status === 'reviewing') return currentRole === '烘焙师';
    return false;
  });

  function handleAddNote() {
    if (!noteText.trim()) return;
    const authorMap = { '烘焙师': '林烘焙', '杯测员': '陈杯测', '渠道客服': '李客服' };
    addNote(recordId, authorMap[currentRole], currentRole, noteText.trim());
    noteText = '';
  }

  function handleSaveReturnReason() {
    if (!returnReasonText.trim()) return;
    updateReturnReason(recordId, returnReasonText.trim());
  }

  function handleSaveRecoveryAction() {
    if (!recoveryActionText.trim()) return;
    updateRecoveryAction(recordId, recoveryActionText.trim());
  }

  function handleSubmitFlavorReview() {
    if (!reviewNotes.trim()) return;
    submitFlavorReview(recordId, {
      acidity: reviewAcidity,
      sweetness: reviewSweetness,
      body: reviewBody,
      aftertaste: reviewAftertaste,
      notes: reviewNotes.trim(),
      reviewer: '陈杯测'
    });
  }

  function handleAdvance() {
    const authorMap = { '烘焙师': '林烘焙', '杯测员': '陈杯测', '渠道客服': '李客服' };
    const statusLabels = {
      pending: '开始回收处理',
      recovering: '提交风味复盘',
      reviewing: '确认并关闭'
    };
    advanceStatus(recordId);
    addNote(recordId, authorMap[currentRole], currentRole, statusLabels[record.status] + '（状态推进）');
  }

  function flavorBar(value, color) {
    const pct = (value / 10) * 100;
    return `background: ${color}; width: ${pct}%`;
  }
</script>

{#if record}
  <div class="detail-page">
    <div class="detail-topbar">
      <button class="back-btn" onclick={onBack}>← 返回待办</button>
      <div class="detail-topbar-center">
        <span class="detail-id">{record.id}</span>
        <StatusBadge status={record.status} />
      </div>
      <div></div>
    </div>

    <div class="detail-meta">
      <div class="meta-row">
        <span class="meta-label">客户</span>
        <span class="meta-value">{record.customer}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">生豆</span>
        <span class="meta-value">{bean?.name || record.beanId}{#if bean?.fifoAlert} <span class="alert-tag">FIFO预警</span>{/if}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">烘焙曲线</span>
        <span class="meta-value">{curve?.name || record.curveId}{#if curve?.alert} <span class="alert-tag">版本混乱</span>{/if}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">投诉日期</span>
        <span class="meta-value">{record.complaintDate}</span>
      </div>
    </div>

    <div class="detail-feedback">
      <div class="section-label">客户反馈</div>
      <p>{record.customerFeedback}</p>
    </div>

    <div class="tab-bar">
      {#each tabs as tab}
        <button
          class="tab-btn"
          class:active={activeTab === tab.key}
          onclick={() => activeTab = tab.key}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="tab-content">
      {#if activeTab === 'overview'}
        <div class="overview-grid">
          <div class="overview-card">
            <div class="section-label">退回原因</div>
            {#if record.returnReason}
              <p>{record.returnReason}</p>
            {:else}
              <p class="placeholder">尚未填写</p>
            {/if}
          </div>
          <div class="overview-card">
            <div class="section-label">回收动作</div>
            {#if record.recoveryAction}
              <p>{record.recoveryAction}</p>
            {:else}
              <p class="placeholder">尚未填写</p>
            {/if}
          </div>
          <div class="overview-card">
            <div class="section-label">风味复盘</div>
            {#if record.flavorReview}
              <div class="mini-flavor">
                <div class="mini-bar-row"><span>酸度</span><div class="mini-bar"><div style={flavorBar(record.flavorReview.acidity, '#f59e0b')}></div></div><span>{record.flavorReview.acidity}</span></div>
                <div class="mini-bar-row"><span>甜度</span><div class="mini-bar"><div style={flavorBar(record.flavorReview.sweetness, '#10b981')}></div></div><span>{record.flavorReview.sweetness}</span></div>
                <div class="mini-bar-row"><span>醇度</span><div class="mini-bar"><div style={flavorBar(record.flavorReview.body, '#6366f1')}></div></div><span>{record.flavorReview.body}</span></div>
                <div class="mini-bar-row"><span>余韵</span><div class="mini-bar"><div style={flavorBar(record.flavorReview.aftertaste, '#ec4899')}></div></div><span>{record.flavorReview.aftertaste}</span></div>
                <p class="mini-notes">{record.flavorReview.notes}</p>
              </div>
            {:else}
              <p class="placeholder">尚未复盘</p>
            {/if}
          </div>

          <button class="history-toggle" onclick={() => showHistory = !showHistory}>
            {showHistory ? '▼ 收起推进记录' : '▶ 展开推进记录'} ({record.history.length})
          </button>

          {#if showHistory}
            <div class="history-timeline">
              {#each record.history as item, i}
                <div class="history-item">
                  <div class="history-dot"></div>
                  <div class="history-content">
                    <span class="history-action">{item.action}</span>
                    <span class="history-meta">{item.by}（{item.role}）· {item.timestamp}</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'recovery'}
        <div class="recovery-section">
          <div class="form-group">
            <label>退回原因</label>
            {#if record.returnReason}
              <p class="form-value">{record.returnReason}</p>
            {:else}
              <textarea bind:value={returnReasonText} placeholder="填写退回原因…"></textarea>
              <button class="btn-sm" onclick={handleSaveReturnReason} disabled={!returnReasonText.trim()}>保存</button>
            {/if}
          </div>
          <div class="form-group">
            <label>回收动作</label>
            {#if record.recoveryAction}
              <p class="form-value">{record.recoveryAction}</p>
            {:else}
              <textarea bind:value={recoveryActionText} placeholder="填写回收处理动作…"></textarea>
              <button class="btn-sm" onclick={handleSaveRecoveryAction} disabled={!recoveryActionText.trim()}>保存</button>
            {/if}
          </div>

          {#if record.returnReason && record.recoveryAction}
            <div class="recovery-done">
              ✓ 回收信息已完整，可推进状态
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'flavor'}
        <div class="flavor-section">
          {#if record.flavorReview}
            <div class="flavor-result">
              <div class="section-label">复盘结果（{record.flavorReview.reviewer} · {record.flavorReview.date}）</div>
              <div class="flavor-bars">
                <div class="bar-row">
                  <span class="bar-label">酸度</span>
                  <div class="bar-track"><div class="bar-fill acid" style="width:{record.flavorReview.acidity * 10}%"></div></div>
                  <span class="bar-num">{record.flavorReview.acidity}/10</span>
                </div>
                <div class="bar-row">
                  <span class="bar-label">甜度</span>
                  <div class="bar-track"><div class="bar-fill sweet" style="width:{record.flavorReview.sweetness * 10}%"></div></div>
                  <span class="bar-num">{record.flavorReview.sweetness}/10</span>
                </div>
                <div class="bar-row">
                  <span class="bar-label">醇度</span>
                  <div class="bar-track"><div class="bar-fill body" style="width:{record.flavorReview.body * 10}%"></div></div>
                  <span class="bar-num">{record.flavorReview.body}/10</span>
                </div>
                <div class="bar-row">
                  <span class="bar-label">余韵</span>
                  <div class="bar-track"><div class="bar-fill after" style="width:{record.flavorReview.aftertaste * 10}%"></div></div>
                  <span class="bar-num">{record.flavorReview.aftertaste}/10</span>
                </div>
              </div>
              <p class="flavor-notes">{record.flavorReview.notes}</p>
            </div>
          {:else if currentRole === '杯测员'}
            <div class="flavor-form">
              <div class="section-label">录入风味复盘</div>
              <div class="slider-group">
                <label>酸度：{reviewAcidity}</label>
                <input type="range" min="1" max="10" bind:value={reviewAcidity} />
              </div>
              <div class="slider-group">
                <label>甜度：{reviewSweetness}</label>
                <input type="range" min="1" max="10" bind:value={reviewSweetness} />
              </div>
              <div class="slider-group">
                <label>醇度：{reviewBody}</label>
                <input type="range" min="1" max="10" bind:value={reviewBody} />
              </div>
              <div class="slider-group">
                <label>余韵：{reviewAftertaste}</label>
                <input type="range" min="1" max="10" bind:value={reviewAftertaste} />
              </div>
              <div class="form-group">
                <label>杯测评语</label>
                <textarea bind:value={reviewNotes} placeholder="描述风味特征、异常点、对比参照…"></textarea>
              </div>
              <button class="btn-primary" onclick={handleSubmitFlavorReview} disabled={!reviewNotes.trim()}>提交复盘</button>
            </div>
          {:else}
            <p class="placeholder">等待杯测员提交复盘结果</p>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'notes'}
        <div class="notes-section">
          <button class="notes-toggle" onclick={() => showNotes = !showNotes}>
            {showNotes ? '▼ 收起补充备注' : '▶ 展开补充备注'} ({record.supplementaryNotes.length})
          </button>

          {#if showNotes}
            <div class="notes-list">
              {#each record.supplementaryNotes as note}
                <div class="note-item">
                  <div class="note-head">
                    <span class="note-author">{note.author}</span>
                    <span class="note-role">{note.role}</span>
                    <span class="note-time">{note.timestamp}</span>
                  </div>
                  <p class="note-content">{note.content}</p>
                </div>
              {/each}
            </div>
          {/if}

          <div class="note-input-area">
            <textarea bind:value={noteText} placeholder="添加补充备注…" rows="3"></textarea>
            <button class="btn-primary" onclick={handleAddNote} disabled={!noteText.trim()}>添加备注</button>
          </div>
        </div>
      {/if}
    </div>

    {#if record.status !== 'resolved'}
      <div class="action-bar">
        <div class="action-info">
          <span>当前状态：</span>
          <StatusBadge status={record.status} />
          {#if canAdvance()}
            <span class="action-hint">→ 可推进至 <strong>{STATUS_MAP[STATUS_MAP[record.status].next]?.label}</strong></span>
          {/if}
        </div>
        <button
          class="btn-advance"
          onclick={handleAdvance}
          disabled={!canAdvance()}
        >
          {#if record.status === 'pending'}开始回收处理{:else if record.status === 'recovering'}提交复盘并推进{:else if record.status === 'reviewing'}确认关闭{:else}已完成{/if}
        </button>
      </div>
    {:else}
      <div class="action-bar resolved-bar">
        <span class="resolved-text">✓ 此客诉已完成处理</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .detail-page {
    padding: 0 24px 100px;
  }
  .detail-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }
  .back-btn {
    background: none;
    border: 1px solid #e5e7eb;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #555;
  }
  .back-btn:hover {
    border-color: #6366f1;
    color: #6366f1;
  }
  .detail-topbar-center {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .detail-id {
    font-weight: 700;
    color: #1a1a1a;
    font-size: 16px;
  }
  .detail-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: #f9fafb;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 16px;
  }
  .meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }
  .meta-label {
    color: #888;
    width: 70px;
    flex-shrink: 0;
  }
  .meta-value {
    color: #1a1a1a;
    font-weight: 500;
  }
  .alert-tag {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    margin-left: 4px;
  }
  .detail-feedback {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }
  .detail-feedback p {
    margin: 8px 0 0;
    font-size: 14px;
    color: #333;
    line-height: 1.6;
  }
  .section-label {
    font-size: 13px;
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 6px;
  }
  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 2px solid #f0f0f0;
    margin-bottom: 20px;
  }
  .tab-btn {
    background: none;
    border: none;
    padding: 10px 20px;
    font-size: 14px;
    color: #888;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: all 0.15s;
  }
  .tab-btn:hover {
    color: #444;
  }
  .tab-btn.active {
    color: #6366f1;
    border-bottom-color: #6366f1;
    font-weight: 600;
  }
  .placeholder {
    color: #bbb;
    font-style: italic;
  }
  .overview-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .overview-card {
    background: #f9fafb;
    border-radius: 10px;
    padding: 14px 16px;
  }
  .overview-card p {
    margin: 4px 0 0;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }
  .mini-flavor {
    margin-top: 6px;
  }
  .mini-bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    margin-bottom: 4px;
  }
  .mini-bar-row span:first-child {
    width: 30px;
    color: #666;
  }
  .mini-bar-row span:last-child {
    width: 16px;
    text-align: right;
    color: #444;
    font-weight: 600;
  }
  .mini-bar {
    flex: 1;
    height: 8px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
  }
  .mini-bar div {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s;
  }
  .mini-notes {
    margin-top: 8px;
    font-size: 13px;
    color: #555;
    line-height: 1.5;
  }
  .history-toggle {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 0;
    font-weight: 500;
  }
  .history-toggle:hover {
    text-decoration: underline;
  }
  .history-timeline {
    padding-left: 16px;
    border-left: 2px solid #e5e7eb;
    margin-left: 4px;
  }
  .history-item {
    position: relative;
    padding: 8px 0 8px 20px;
  }
  .history-dot {
    position: absolute;
    left: -7px;
    top: 12px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #6366f1;
    border: 2px solid #fff;
  }
  .history-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .history-action {
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
  }
  .history-meta {
    font-size: 12px;
    color: #999;
  }

  .recovery-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .form-group label {
    font-size: 13px;
    font-weight: 600;
    color: #444;
  }
  .form-value {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    background: #f9fafb;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  textarea {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
    line-height: 1.5;
  }
  textarea:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .btn-sm {
    align-self: flex-start;
    padding: 6px 16px;
    border-radius: 6px;
    border: none;
    background: #6366f1;
    color: #fff;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
  }
  .btn-sm:disabled {
    background: #c7c7c7;
    cursor: not-allowed;
  }
  .recovery-done {
    background: #ecfdf5;
    color: #059669;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
  }

  .flavor-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .flavor-result {
    background: #f9fafb;
    border-radius: 10px;
    padding: 16px;
  }
  .flavor-bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 10px 0;
  }
  .bar-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .bar-label {
    width: 36px;
    font-size: 13px;
    color: #666;
    text-align: right;
  }
  .bar-track {
    flex: 1;
    height: 14px;
    background: #e5e7eb;
    border-radius: 7px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 7px;
    transition: width 0.4s;
  }
  .bar-fill.acid { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  .bar-fill.sweet { background: linear-gradient(90deg, #34d399, #10b981); }
  .bar-fill.body { background: linear-gradient(90deg, #818cf8, #6366f1); }
  .bar-fill.after { background: linear-gradient(90deg, #f472b6, #ec4899); }
  .bar-num {
    width: 40px;
    font-size: 12px;
    color: #555;
    font-weight: 600;
  }
  .flavor-notes {
    font-size: 14px;
    color: #444;
    line-height: 1.6;
    margin-top: 10px;
    padding: 10px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }
  .flavor-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .slider-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .slider-group label {
    font-size: 13px;
    color: #555;
    font-weight: 500;
  }
  .slider-group input[type="range"] {
    width: 100%;
    accent-color: #6366f1;
  }
  .btn-primary {
    align-self: flex-start;
    padding: 10px 24px;
    border-radius: 8px;
    border: none;
    background: #6366f1;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-primary:hover:not(:disabled) {
    background: #4f46e5;
  }
  .btn-primary:disabled {
    background: #c7c7c7;
    cursor: not-allowed;
  }

  .notes-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .notes-toggle {
    background: none;
    border: none;
    color: #6366f1;
    font-size: 13px;
    cursor: pointer;
    font-weight: 500;
    padding: 4px 0;
  }
  .notes-toggle:hover {
    text-decoration: underline;
  }
  .notes-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .note-item {
    background: #f9fafb;
    border-radius: 8px;
    padding: 10px 14px;
  }
  .note-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .note-author {
    font-weight: 600;
    font-size: 13px;
    color: #1a1a1a;
  }
  .note-role {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    background: #eef2ff;
    color: #6366f1;
  }
  .note-time {
    font-size: 11px;
    color: #aaa;
    margin-left: auto;
  }
  .note-content {
    font-size: 13px;
    color: #444;
    line-height: 1.5;
    margin: 0;
  }
  .note-input-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }

  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    border-top: 1px solid #e5e7eb;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  }
  .action-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #555;
  }
  .action-hint {
    font-size: 13px;
    color: #888;
  }
  .action-hint strong {
    color: #6366f1;
  }
  .btn-advance {
    padding: 10px 28px;
    border-radius: 8px;
    border: none;
    background: #6366f1;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-advance:hover:not(:disabled) {
    background: #4f46e5;
  }
  .btn-advance:disabled {
    background: #c7c7c7;
    cursor: not-allowed;
  }
  .resolved-bar {
    justify-content: center;
  }
  .resolved-text {
    font-size: 15px;
    color: #059669;
    font-weight: 600;
  }
</style>
