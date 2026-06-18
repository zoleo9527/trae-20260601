<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();

  let selectedExhibitId = $state(data.selectedExhibitId || '');
  let result = $state('normal');
  let notes = $state('');
  let isSubmitting = $state(false);
  let message = $state('');
  let messageType = $state<'success' | 'error'>('success');

  async function handleSubmit() {
    if (!selectedExhibitId) {
      message = '请选择展项';
      messageType = 'error';
      return;
    }

    isSubmitting = true;
    message = '';

    try {
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `insp-${Date.now()}`,
          exhibit_id: selectedExhibitId,
          inspector_id: data.user.id,
          result,
          notes
        })
      });

      if (response.ok) {
        const result2 = await response.json();
        message = result === 'normal' ? '巡检提交成功！' : '巡检提交成功，已自动创建故障报修单';
        messageType = 'success';

        setTimeout(() => {
          if (result2.faultId) {
            goto(`/fault-reports/${result2.faultId}`);
          } else {
            goto('/exhibits');
          }
        }, 1500);
      } else {
        const error = await response.json();
        message = error.error || '提交失败';
        messageType = 'error';
      }
    } catch (error) {
      message = '网络错误，请重试';
      messageType = 'error';
    } finally {
      isSubmitting = false;
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN');
  }

  const selectedExhibit = $derived(
    data.exhibits.find((e: any) => e.id === selectedExhibitId)
  );
</script>

<svelte:head>
  <title>展项巡检 - 科技馆展教管理系统</title>
</svelte:head>

<div class="inspection-page">
  <div class="page-header">
    <h1 class="page-title">展项巡检</h1>
    <p class="page-subtitle">提交巡检记录，发现异常将自动创建故障报修</p>
  </div>

  <div class="inspection-form">
    <div class="form-card">
      <h2 class="form-title">巡检信息</h2>

      <div class="form-group">
        <label class="form-label">选择展项 *</label>
        <select
          class="form-select"
          bind:value={selectedExhibitId}
        >
          <option value="">请选择展项</option>
          {#each data.exhibits as exhibit}
            <option value={exhibit.id}>
              {exhibit.name} - {exhibit.location}
            </option>
          {/each}
        </select>
      </div>

      {#if selectedExhibit}
        <div class="exhibit-info">
          <div class="info-row">
            <span class="info-label">展项名称：</span>
            <span class="info-value">{selectedExhibit.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">位置：</span>
            <span class="info-value">{selectedExhibit.location}</span>
          </div>
          <div class="info-row">
            <span class="info-label">当前状态：</span>
            <span class="info-value status-badge" class:normal={selectedExhibit.status === 'normal'} class:fault={selectedExhibit.status !== 'normal'}>
              {selectedExhibit.status === 'normal' ? '正常' : selectedExhibit.status === 'fault_pending' ? '故障待修' : selectedExhibit.status === 'repairing' ? '维修中' : '巡检中'}
            </span>
          </div>
        </div>
      {/if}

      <div class="form-group">
        <label class="form-label">巡检结果 *</label>
        <div class="radio-group">
          <label class="radio-item">
            <input type="radio" bind:group={result} value="normal" />
            <span class="radio-label">
              <span class="radio-icon">✅</span>
              正常
            </span>
          </label>
          <label class="radio-item">
            <input type="radio" bind:group={result} value="abnormal" />
            <span class="radio-label">
              <span class="radio-icon">⚠️</span>
              异常
            </span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">备注说明</label>
        <textarea
          class="form-textarea"
          bind:value={notes}
          placeholder={result === 'normal' ? '可选：填写巡检备注' : '必填：详细描述发现的问题'}
          rows="4"
        ></textarea>
      </div>

      {#if message}
        <div class="message" class:success={messageType === 'success'} class:error={messageType === 'error'}>
          {message}
        </div>
      {/if}

      <button
        class="submit-btn"
        onclick={handleSubmit}
        disabled={isSubmitting || !selectedExhibitId || (result === 'abnormal' && !notes.trim())}
      >
        {isSubmitting ? '提交中...' : '提交巡检'}
      </button>
    </div>

    <div class="history-card">
      <h2 class="form-title">最近巡检记录</h2>

      {#if data.recentInspections.length === 0}
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">暂无巡检记录</div>
        </div>
      {:else}
        <div class="history-list">
          {#each data.recentInspections as inspection}
            <div class="history-item">
              <div class="history-header">
                <span class="history-exhibit">{inspection.exhibit_name}</span>
                <span class="history-result" class:normal={inspection.result === 'normal'} class:abnormal={inspection.result === 'abnormal'}>
                  {inspection.result === 'normal' ? '正常' : '异常'}
                </span>
              </div>
              {#if inspection.notes}
                <div class="history-notes">{inspection.notes}</div>
              {/if}
              <div class="history-time">{formatDate(inspection.created_at)}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .inspection-page {
    max-width: 1200px;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a202c;
  }

  .page-subtitle {
    margin: 0;
    color: #64748b;
  }

  .inspection-form {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
  }

  @media (max-width: 1024px) {
    .inspection-form {
      grid-template-columns: 1fr;
    }
  }

  .form-card, .history-card {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .form-title {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
    color: #1a202c;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-select, .form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  .exhibit-info {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .info-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .info-row:last-child {
    margin-bottom: 0;
  }

  .info-label {
    color: #64748b;
    min-width: 80px;
  }

  .info-value {
    color: #1a202c;
    font-weight: 500;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.875rem;
  }

  .status-badge.normal {
    background: #d1fae5;
    color: #065f46;
  }

  .status-badge.fault {
    background: #fee2e2;
    color: #991b1b;
  }

  .radio-group {
    display: flex;
    gap: 1rem;
  }

  .radio-item {
    flex: 1;
    cursor: pointer;
  }

  .radio-item input {
    display: none;
  }

  .radio-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .radio-item input:checked + .radio-label {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }

  .radio-icon {
    font-size: 1.5rem;
  }

  .message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  .message.success {
    background: #d1fae5;
    color: #065f46;
  }

  .message.error {
    background: #fee2e2;
    color: #991b1b;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .history-item {
    padding: 1rem;
    background: #f8fafc;
    border-radius: 8px;
  }

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .history-exhibit {
    font-weight: 600;
    color: #1a202c;
  }

  .history-result {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .history-result.normal {
    background: #d1fae5;
    color: #065f46;
  }

  .history-result.abnormal {
    background: #fee2e2;
    color: #991b1b;
  }

  .history-notes {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .history-time {
    font-size: 0.75rem;
    color: #94a3b8;
  }
</style>
