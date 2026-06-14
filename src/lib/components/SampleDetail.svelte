<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { getSample, getSampleFlows, getAppraisers, receiveSample, processSample, completeSample, returnSample, rejectSample, assignAppraiser, requestSupplementary, receiveSupplementary, statusLabels, statusColors, priorityLabels, priorityColors, actionTypeLabels, roleLabels, getOpinionDocuments, createOpinionDocument, submitOpinionDocumentForReview, reviewOpinionDocument, createUrgencyReminder, documentStatusLabels, reminderTypeLabels } from '$lib/api.js';
  import { user, showNotification } from '$lib/stores.js';
  import SampleReception from './SampleReception.svelte';

  export let sampleId;

  const dispatch = createEventDispatcher();

  let sample = null;
  let flows = [];
  let appraisers = [];
  let opinionDocs = [];
  let loading = true;
  let error = '';

  let showAssignModal = false;
  let selectedAppraiser = '';
  let assignRemarks = '';

  let showSupplementaryModal = false;
  let suppReason = '';
  let suppItems = '';

  let showRemarksModal = false;
  let currentAction = '';
  let actionRemarks = '';

  let showOpinionDocModal = false;
  let docTitle = '';
  let docContent = '';

  let showReviewDocModal = false;
  let selectedDocId = '';
  let reviewStatus = 'approved';
  let reviewComments = '';

  let showReminderModal = false;
  let reminderType = 'deadline';
  let reminderTitle = '';
  let reminderMessage = '';
  let reminderTargetUserId = '';

  let showReception = false;

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';
    try {
      const [sampleRes, flowsRes, appraisersRes, docsRes] = await Promise.all([
        getSample(sampleId),
        getSampleFlows(sampleId),
        getAppraisers(),
        getOpinionDocuments(sampleId)
      ]);
      sample = sampleRes.sample;
      flows = flowsRes.flows;
      appraisers = appraisersRes.appraisers;
      opinionDocs = docsRes.documents || [];
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  }

  function getDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  }

  async function handleAction(action, remarks = '') {
    try {
      let result;
      switch (action) {
        case 'receive':
          result = await receiveSample(sampleId, remarks);
          break;
        case 'process':
          result = await processSample(sampleId, remarks);
          break;
        case 'complete':
          result = await completeSample(sampleId, remarks);
          break;
        case 'return':
          result = await returnSample(sampleId, remarks);
          break;
        case 'reject':
          result = await rejectSample(sampleId, remarks);
          break;
      }
      
      if (result.success) {
        showNotification({
          id: Date.now(),
          title: '操作成功',
          message: actionTypeLabels[action] + '完成',
          type: 'success'
        });
        showRemarksModal = false;
        await loadData();
        dispatch('refresh');
      }
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '操作失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleAssign() {
    if (!selectedAppraiser) return;
    
    try {
      const result = await assignAppraiser(sampleId, selectedAppraiser, assignRemarks);
      if (result.success) {
        showNotification({
          id: Date.now(),
          title: '分配成功',
          message: '已分配给鉴定人',
          type: 'success'
        });
        showAssignModal = false;
        await loadData();
        dispatch('refresh');
      }
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '分配失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleSupplementary() {
    if (!suppReason || !suppItems) return;
    
    try {
      const result = await requestSupplementary(sampleId, suppReason, suppItems);
      if (result.success) {
        showNotification({
          id: Date.now(),
          title: '已发起补充请求',
          message: '等待委托人补充材料',
          type: 'warning'
        });
        showSupplementaryModal = false;
        await loadData();
        dispatch('refresh');
      }
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '操作失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleCreateOpinionDoc() {
    if (!docTitle) return;
    
    try {
      await createOpinionDocument(sampleId, docTitle, docContent);
      showNotification({
        id: Date.now(),
        title: '意见书已创建',
        message: '新版本意见书已保存',
        type: 'success'
      });
      showOpinionDocModal = false;
      docTitle = '';
      docContent = '';
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '创建失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleSubmitForReview(docId) {
    try {
      await submitOpinionDocumentForReview(docId);
      showNotification({
        id: Date.now(),
        title: '已提交审核',
        message: '意见书已提交质控审核',
        type: 'success'
      });
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '提交失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleReviewDoc() {
    try {
      await reviewOpinionDocument(selectedDocId, reviewStatus, reviewComments);
      showNotification({
        id: Date.now(),
        title: '审核完成',
        message: `意见书审核结果：${documentStatusLabels[reviewStatus]}`,
        type: reviewStatus === 'approved' ? 'success' : 'warning'
      });
      showReviewDocModal = false;
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '审核失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleCreateReminder() {
    if (!reminderTitle || !reminderMessage || !reminderTargetUserId) return;
    
    try {
      await createUrgencyReminder(sampleId, reminderType, reminderTitle, reminderMessage, reminderTargetUserId);
      showNotification({
        id: Date.now(),
        title: '催办已发送',
        message: '催办提醒已发送给目标人员',
        type: 'warning'
      });
      showReminderModal = false;
      reminderTitle = '';
      reminderMessage = '';
      reminderTargetUserId = '';
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '发送失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  function canPerformAction(action) {
    const role = $user?.role;
    const status = sample?.reception_status;

    switch (action) {
      case 'receive':
        return role === 'acceptor' && status === 'pending';
      case 'process':
        return role === 'appraiser' && (status === 'received' || status === 'supplementary');
      case 'complete':
        return role === 'appraiser' && status === 'processing';
      case 'return':
        return (role === 'appraiser' || role === 'quality_controller') && status !== 'completed' && status !== 'returned';
      case 'reject':
        return role === 'acceptor' && status === 'pending';
      case 'supplementary':
        return role === 'appraiser' && status === 'processing';
      case 'assign':
        return (role === 'acceptor' || role === 'admin') && !sample?.assigned_appraiser_id;
      case 'createOpinionDoc':
        return role === 'appraiser' && status === 'processing';
      case 'reviewOpinionDoc':
        return role === 'quality_controller';
      case 'createReminder':
        return role === 'appraiser' || role === 'quality_controller';
      default:
        return false;
    }
  }

  function openActionModal(action) {
    currentAction = action;
    actionRemarks = '';
    showRemarksModal = true;
  }

  function openReviewModal(docId) {
    selectedDocId = docId;
    reviewStatus = 'approved';
    reviewComments = '';
    showReviewDocModal = true;
  }
</script>

<div class="sample-detail">
  <div class="detail-header">
    <button class="back-btn" on:click={() => dispatch('close')}>← 返回列表</button>
    <h2>{sample?.case_number}</h2>
    {#if sample}
      <div class="pressure-indicator">
        {#if getDaysRemaining(sample.due_date) < 0}
          <span class="overdue-badge">⚠️ 已逾期 {Math.abs(getDaysRemaining(sample.due_date))} 天</span>
        {:else if getDaysRemaining(sample.due_date) <= 1}
          <span class="critical-badge">🔥 剩余 {getDaysRemaining(sample.due_date)} 天</span>
        {:else if getDaysRemaining(sample.due_date) <= 3}
          <span class="urgent-badge">⚡ 剩余 {getDaysRemaining(sample.due_date)} 天</span>
        {/if}
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if sample}
    <div class="detail-content">
      {#if $user?.role === 'acceptor' && sample.reception_status === 'pending'}
        <button class="toggle-reception-btn" on:click={() => showReception = !showReception}>
          {showReception ? '隐藏接收流程' : '展开接收流程（样本检查、拍照、异常登记）'}
        </button>
        {#if showReception}
          <SampleReception {sampleId} on:refresh={() => loadData()} />
        {/if}
      {/if}

      <div class="info-section">
        <h3>📋 基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">案件名称</span>
            <span class="value">{sample.case_name}</span>
          </div>
          <div class="info-item">
            <span class="label">委托人</span>
            <span class="value">{sample.client_name || '-'}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{sample.client_phone || '-'}</span>
          </div>
          <div class="info-item">
            <span class="label">样本类型</span>
            <span class="value">{sample.sample_type}</span>
          </div>
          <div class="info-item">
            <span class="label">样本数量</span>
            <span class="value">{sample.sample_count} 份</span>
          </div>
          <div class="info-item">
            <span class="label">分配鉴定人</span>
            <span class="value highlight">{sample.appraiser_name || '未分配'}</span>
          </div>
          <div class="info-item">
            <span class="label">当前状态</span>
            <span class="value">
              <span class="status-badge" style="background: {statusColors[sample.reception_status]}">
                {statusLabels[sample.reception_status]}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="label">优先级</span>
            <span class="value">
              <span class="priority-badge" style="background: {priorityColors[sample.priority]}">
                {priorityLabels[sample.priority]}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="label">截止日期</span>
            <span class="value" class:urgent={isUrgent(sample.due_date)}>
              {formatDateTime(sample.due_date)}
            </span>
          </div>
          <div class="info-item">
            <span class="label">创建时间</span>
            <span class="value">{formatDateTime(sample.created_at)}</span>
          </div>
        </div>

        {#if sample.sample_description}
          <div class="description">
            <span class="label">样本描述</span>
            <p>{sample.sample_description}</p>
          </div>
        {/if}
      </div>

      <div class="actions-section">
        <h3>⚡ 可执行操作</h3>
        <div class="action-buttons">
          {#if canPerformAction('assign')}
            <button class="action-btn assign" on:click={() => showAssignModal = true}>
              👤 分配鉴定人
            </button>
          {/if}
          {#if canPerformAction('receive')}
            <button class="action-btn receive" on:click={() => openActionModal('receive')}>
              📥 接收样本
            </button>
          {/if}
          {#if canPerformAction('process')}
            <button class="action-btn process" on:click={() => openActionModal('process')}>
              🔬 开始检测
            </button>
          {/if}
          {#if canPerformAction('supplementary')}
            <button class="action-btn supplementary" on:click={() => showSupplementaryModal = true}>
              📝 要求补充材料
            </button>
          {/if}
          {#if canPerformAction('complete')}
            <button class="action-btn complete" on:click={() => openActionModal('complete')}>
              ✅ 完成鉴定
            </button>
          {/if}
          {#if canPerformAction('return')}
            <button class="action-btn return" on:click={() => openActionModal('return')}>
              ↩️ 退回样本
            </button>
          {/if}
          {#if canPerformAction('reject')}
            <button class="action-btn reject" on:click={() => openActionModal('reject')}>
              ❌ 驳回
            </button>
          {/if}
          {#if canPerformAction('createOpinionDoc')}
            <button class="action-btn opinion-doc" on:click={() => showOpinionDocModal = true}>
              📄 创建意见书
            </button>
          {/if}
          {#if canPerformAction('createReminder')}
            <button class="action-btn reminder" on:click={() => showReminderModal = true}>
              🔔 发送催办
            </button>
          {/if}
        </div>
      </div>

      {#if opinionDocs.length > 0}
        <div class="opinion-docs-section">
          <h3>📄 意见书版本管理</h3>
          <div class="docs-list">
            {#each opinionDocs as doc (doc.id)}
              <div class="doc-item {doc.status}">
                <div class="doc-header">
                  <span class="doc-version">版本 {doc.version_number}</span>
                  <span class="doc-title">{doc.document_title}</span>
                  <span class="doc-status-badge {doc.status}">
                    {documentStatusLabels[doc.status]}
                  </span>
                </div>
                <div class="doc-body">
                  {#if doc.document_content}
                    <p class="doc-content-preview">{doc.document_content.substring(0, 100)}...</p>
                  {/if}
                </div>
                <div class="doc-footer">
                  <span class="doc-creator">创建人: {doc.created_by_name}</span>
                  <span class="doc-time">{formatDateTime(doc.created_at)}</span>
                </div>
                {#if doc.review_comments}
                  <div class="doc-review">
                    <span class="review-label">审核意见:</span>
                    <p class="review-comments">{doc.review_comments}</p>
                    {#if doc.reviewed_by_name}
                      <span class="reviewer">审核人: {doc.reviewed_by_name}</span>
                    {/if}
                  </div>
                {/if}
                <div class="doc-actions">
                  {#if doc.status === 'draft' && $user?.role === 'appraiser'}
                    <button class="doc-action-btn" on:click={() => handleSubmitForReview(doc.id)}>
                      提交审核
                    </button>
                  {/if}
                  {#if doc.status === 'reviewing' && $user?.role === 'quality_controller'}
                    <button class="doc-action-btn review" on:click={() => openReviewModal(doc.id)}>
                      审核
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="flows-section">
        <h3>📜 流转留痕记录</h3>
        {#if flows.length === 0}
          <p class="no-flows">暂无流转记录</p>
        {:else}
          <div class="timeline">
            {#each flows as flow, i}
              <div class="timeline-item" class:last={i === flows.length - 1}>
                <div class="timeline-marker" style="background: {getActionColor(flow.action_type)}">
                  {getActionIcon(flow.action_type)}
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <span class="action-type">{actionTypeLabels[flow.action_type] || flow.action_type}</span>
                    <span class="flow-time">{formatDateTime(flow.created_at)}</span>
                  </div>
                  <div class="timeline-body">
                    <span class="operator">{flow.operator_name}</span>
                    <span class="role-badge">{roleLabels[flow.operator_role]}</span>
                  </div>
                  {#if flow.remarks}
                    <p class="flow-remarks">{flow.remarks}</p>
                  {/if}
                  <div class="status-change">
                    <span class="from">{statusLabels[flow.from_status] || flow.from_status}</span>
                    <span class="arrow">→</span>
                    <span class="to">{statusLabels[flow.to_status] || flow.to_status}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if showRemarksModal}
  <div class="modal-overlay" on:click={() => showRemarksModal = false}>
    <div class="modal-content small" on:click|stopPropagation>
      <h3>{actionTypeLabels[currentAction]}</h3>
      <textarea
        bind:value={actionRemarks}
        placeholder="请输入操作备注（可选）"
        rows="3"
      ></textarea>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showRemarksModal = false}>取消</button>
        <button class="btn-primary" on:click={() => handleAction(currentAction, actionRemarks)}>确认</button>
      </div>
    </div>
  </div>
{/if}

{#if showAssignModal}
  <div class="modal-overlay" on:click={() => showAssignModal = false}>
    <div class="modal-content small" on:click|stopPropagation>
      <h3>👤 分配鉴定人</h3>
      <select bind:value={selectedAppraiser}>
        <option value="">请选择鉴定人</option>
        {#each appraisers as appraiser}
          <option value={appraiser.id}>{appraiser.real_name} - {appraiser.department}</option>
        {/each}
      </select>
      <textarea
        bind:value={assignRemarks}
        placeholder="分配备注（可选）"
        rows="2"
      ></textarea>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showAssignModal = false}>取消</button>
        <button class="btn-primary" on:click={handleAssign}>确认分配</button>
      </div>
    </div>
  </div>
{/if}

{#if showSupplementaryModal}
  <div class="modal-overlay" on:click={() => showSupplementaryModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>📝 补充材料请求</h3>
      <div class="form-group">
        <label>补充原因</label>
        <textarea
          bind:value={suppReason}
          placeholder="请说明需要补充材料的原因"
          rows="2"
        ></textarea>
      </div>
      <div class="form-group">
        <label>所需材料清单</label>
        <textarea
          bind:value={suppItems}
          placeholder="请列出需要补充的具体材料"
          rows="3"
        ></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showSupplementaryModal = false}>取消</button>
        <button class="btn-primary" on:click={handleSupplementary}>发起补充请求</button>
      </div>
    </div>
  </div>
{/if}

{#if showOpinionDocModal}
  <div class="modal-overlay" on:click={() => showOpinionDocModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>📄 创建意见书</h3>
      <div class="form-group">
        <label>意见书标题</label>
        <input type="text" bind:value={docTitle} placeholder="如：法医临床鉴定意见书" />
      </div>
      <div class="form-group">
        <label>意见书内容</label>
        <textarea
          bind:value={docContent}
          placeholder="请输入意见书主要内容"
          rows="5"
        ></textarea>
      </div>
      <div class="version-hint">
        <p>📝 系统将自动生成新版本号，防止版本混乱</p>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showOpinionDocModal = false}>取消</button>
        <button class="btn-primary" on:click={handleCreateOpinionDoc}>创建意见书</button>
      </div>
    </div>
  </div>
{/if}

{#if showReviewDocModal}
  <div class="modal-overlay" on:click={() => showReviewDocModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>🔍 审核意见书</h3>
      <div class="form-group">
        <label>审核结果</label>
        <select bind:value={reviewStatus}>
          <option value="approved">✅ 通过</option>
          <option value="rejected">❌ 驳回</option>
          <option value="draft">📝 需修改</option>
        </select>
      </div>
      <div class="form-group">
        <label>审核意见</label>
        <textarea
          bind:value={reviewComments}
          placeholder="请输入审核意见和修改建议"
          rows="3"
        ></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showReviewDocModal = false}>取消</button>
        <button class="btn-primary" on:click={handleReviewDoc}>确认审核</button>
      </div>
    </div>
  </div>
{/if}

{#if showReminderModal}
  <div class="modal-overlay" on:click={() => showReminderModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>🔔 发送催办提醒</h3>
      <div class="form-group">
        <label>催办类型</label>
        <select bind:value={reminderType}>
          {#each Object.entries(reminderTypeLabels) as [value, label]}
            <option value={value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>催办标题</label>
        <input type="text" bind:value={reminderTitle} placeholder="如：截止日期临近提醒" />
      </div>
      <div class="form-group">
        <label>催办内容</label>
        <textarea
          bind:value={reminderMessage}
          placeholder="请输入催办的具体内容和要求"
          rows="3"
        ></textarea>
      </div>
      <div class="form-group">
        <label>发送给</label>
        <select bind:value={reminderTargetUserId}>
          <option value="">请选择接收人</option>
          {#each appraisers as appraiser}
            <option value={appraiser.id}>{appraiser.real_name} - {appraiser.department}</option>
          {/each}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showReminderModal = false}>取消</button>
        <button class="btn-warning" on:click={handleCreateReminder}>发送催办</button>
      </div>
    </div>
  </div>
{/if}

<script context="module">
  function isUrgent(dateStr) {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const now = new Date();
    const diff = (due - now) / (1000 * 60 * 60 * 24);
    return diff <= 3;
  }

  function getActionColor(action) {
    const colors = {
      receive: '#409EFF',
      process: '#E6A23C',
      complete: '#67C23A',
      return: '#909399',
      supplementary: '#F56C6C',
      assign: '#9C27B0',
      quality_check: '#00BCD4',
      reject: '#F44336'
    };
    return colors[action] || '#909399';
  }

  function getActionIcon(action) {
    const icons = {
      receive: '📥',
      process: '🔬',
      complete: '✅',
      return: '↩️',
      supplementary: '📝',
      assign: '👤',
      quality_check: '🔍',
      reject: '❌'
    };
    return icons[action] || '📋';
  }
</script>

<style>
  .sample-detail {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
  }

  .back-btn {
    background: #f5f5f5;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    color: #666;
  }

  .back-btn:hover {
    background: #eee;
  }

  .detail-header h2 {
    margin: 0;
    color: #1a1a2e;
    font-size: 1.5rem;
    flex: 1;
  }

  .pressure-indicator {
    display: flex;
    gap: 0.5rem;
  }

  .overdue-badge {
    background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    animation: pulse 2s infinite;
  }

  .critical-badge {
    background: #F56C6C;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
  }

  .urgent-badge {
    background: #E6A23C;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .toggle-reception-btn {
    width: 100%;
    background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 1rem;
    transition: all 0.2s;
  }

  .toggle-reception-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }

  .loading, .error {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .error {
    color: #F56C6C;
  }

  .info-section, .actions-section, .flows-section, .opinion-docs-section {
    margin-bottom: 2rem;
  }

  h3 {
    color: #1a1a2e;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .label {
    font-size: 0.85rem;
    color: #999;
  }

  .value {
    font-size: 0.95rem;
    color: #333;
    font-weight: 500;
  }

  .value.highlight {
    color: #409EFF;
  }

  .value.urgent {
    color: #F56C6C;
    font-weight: 600;
  }

  .status-badge, .priority-badge {
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .description {
    margin-top: 1rem;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .description p {
    margin: 0.5rem 0 0 0;
    color: #666;
    line-height: 1.6;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .action-btn {
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .action-btn.assign { background: #9C27B0; color: white; }
  .action-btn.receive { background: #409EFF; color: white; }
  .action-btn.process { background: #E6A23C; color: white; }
  .action-btn.supplementary { background: #F56C6C; color: white; }
  .action-btn.complete { background: #67C23A; color: white; }
  .action-btn.return { background: #909399; color: white; }
  .action-btn.reject { background: #F44336; color: white; }
  .action-btn.opinion-doc { background: #00BCD4; color: white; }
  .action-btn.reminder { background: #FF9800; color: white; }

  .opinion-docs-section {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
  }

  .docs-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .doc-item {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #409EFF;
  }

  .doc-item.reviewing {
    border-left-color: #E6A23C;
    background: #FDF6EC;
  }

  .doc-item.approved {
    border-left-color: #67C23A;
    background: #F0F9EB;
  }

  .doc-item.rejected {
    border-left-color: #F56C6C;
    background: #FEF0F0;
  }

  .doc-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .doc-version {
    background: #409EFF;
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .doc-title {
    font-weight: 600;
    color: #333;
    flex: 1;
  }

  .doc-status-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }

  .doc-status-badge.draft { background: #909399; }
  .doc-status-badge.reviewing { background: #E6A23C; }
  .doc-status-badge.approved { background: #67C23A; }
  .doc-status-badge.rejected { background: #F56C6C; }
  .doc-status-badge.final { background: #00BCD4; }

  .doc-content-preview {
    color: #666;
    font-size: 0.85rem;
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }

  .doc-review {
    background: #F0F9EB;
    padding: 0.75rem;
    border-radius: 6px;
    margin-top: 0.75rem;
  }

  .review-label {
    color: #67C23A;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .review-comments {
    color: #333;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .reviewer {
    color: #999;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  }

  .doc-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .doc-action-btn {
    background: #409EFF;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .doc-action-btn.review {
    background: #E6A23C;
  }

  .timeline {
    position: relative;
    padding-left: 2rem;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 0.5rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e0e0e0;
  }

  .timeline-item {
    position: relative;
    padding-bottom: 1.5rem;
  }

  .timeline-marker {
    position: absolute;
    left: -1.7rem;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .timeline-content {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .action-type {
    font-weight: 600;
    color: #1a1a2e;
  }

  .flow-time {
    font-size: 0.8rem;
    color: #999;
  }

  .timeline-body {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .operator {
    color: #333;
    font-weight: 500;
  }

  .role-badge {
    background: rgba(64, 158, 255, 0.1);
    color: #409EFF;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
  }

  .flow-remarks {
    margin: 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
  }

  .status-change {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #999;
    margin-top: 0.5rem;
  }

  .from { color: #999; }
  .to { color: #409EFF; font-weight: 600; }
  .arrow { color: #ccc; }

  .no-flows {
    text-align: center;
    color: #999;
    padding: 2rem;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    width: 100%;
    max-width: 400px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-content.small {
    max-width: 350px;
  }

  .modal-content h3 {
    margin: 0 0 1rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
  }

  textarea, select, input[type="text"] {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    box-sizing: border-box;
  }

  textarea:focus, select:focus, input[type="text"]:focus {
    outline: none;
    border-color: #409EFF;
  }

  .version-hint {
    background: #FDF6EC;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .version-hint p {
    margin: 0;
    color: #E6A23C;
    font-size: 0.85rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .btn-secondary {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-primary {
    background: #409EFF;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-warning {
    background: #E6A23C;
    color: white;
    border: none;
    padding: 0.6rem 1.2rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .btn-primary:hover {
    background: #66B1FF;
  }

  .btn-warning:hover {
    background: #EBB563;
  }
</style>
