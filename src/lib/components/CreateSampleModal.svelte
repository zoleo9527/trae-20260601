<script>
  import { createEventDispatcher } from 'svelte';
  import { createSample, sampleTypes } from '$lib/api.js';

  const dispatch = createEventDispatcher();

  let formData = {
    caseNumber: '',
    caseName: '',
    clientName: '',
    clientPhone: '',
    sampleType: '血液',
    sampleCount: 1,
    sampleDescription: '',
    priority: 'normal'
  };

  let loading = false;
  let error = '';

  async function handleSubmit() {
    if (!formData.caseNumber || !formData.caseName || !formData.sampleType) {
      error = '请填写必填项';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await createSample(formData);
      if (result.success) {
        dispatch('success', result.id);
        dispatch('close');
        formData = {
          caseNumber: '',
          caseName: '',
          clientName: '',
          clientPhone: '',
          sampleType: '血液',
          sampleCount: 1,
          sampleDescription: '',
          priority: 'normal'
        };
      } else {
        error = result.message;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function generateCaseNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    formData.caseNumber = `${year}FJ${month}${random}`;
  }
</script>

<div class="modal-overlay" on:click={() => dispatch('close')}>
  <div class="modal-content" on:click|stopPropagation>
    <div class="modal-header">
      <h2>📝 创建新样本登记</h2>
      <button class="close-btn" on:click={() => dispatch('close')}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="form-grid">
        <div class="form-group">
          <label for="caseNumber">案号 <span class="required">*</span></label>
          <div class="input-with-btn">
            <input
              id="caseNumber"
              type="text"
              bind:value={formData.caseNumber}
              placeholder="例：2024FJ01001"
              required
            />
            <button type="button" class="gen-btn" on:click={generateCaseNumber}>自动生成</button>
          </div>
        </div>

        <div class="form-group">
          <label for="caseName">案件名称 <span class="required">*</span></label>
          <input
            id="caseName"
            type="text"
            bind:value={formData.caseName}
            placeholder="请输入案件名称"
            required
          />
        </div>

        <div class="form-group">
          <label for="clientName">委托人</label>
          <input
            id="clientName"
            type="text"
            bind:value={formData.clientName}
            placeholder="委托人姓名或单位"
          />
        </div>

        <div class="form-group">
          <label for="clientPhone">联系电话</label>
          <input
            id="clientPhone"
            type="tel"
            bind:value={formData.clientPhone}
            placeholder="手机或座机"
          />
        </div>

        <div class="form-group">
          <label for="sampleType">样本类型 <span class="required">*</span></label>
          <select id="sampleType" bind:value={formData.sampleType}>
            {#each sampleTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </div>

        <div class="form-group">
          <label for="sampleCount">样本数量</label>
          <input
            id="sampleCount"
            type="number"
            bind:value={formData.sampleCount}
            min="1"
            max="100"
          />
        </div>

        <div class="form-group full-width">
          <label for="sampleDescription">样本描述</label>
          <textarea
            id="sampleDescription"
            bind:value={formData.sampleDescription}
            placeholder="详细描述样本状态、数量、包装等情况..."
            rows="3"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="priority">优先级</label>
          <select id="priority" bind:value={formData.priority}>
            <option value="low">低 - 30天内完成</option>
            <option value="normal">普通 - 14天内完成</option>
            <option value="high">紧急 - 7天内完成</option>
            <option value="urgent">特急 - 3天内完成</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" on:click={() => dispatch('close')}>
          取消
        </button>
        <button type="submit" class="btn-primary" disabled={loading}>
          {loading ? '提交中...' : '创建登记'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #1a1a2e;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: #999;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  .close-btn:hover {
    color: #333;
  }

  form {
    padding: 1.5rem;
  }

  .error-message {
    background: #FEF0F0;
    color: #F56C6C;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  label {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .required {
    color: #F56C6C;
  }

  input, select, textarea {
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
  }

  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: #409EFF;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .input-with-btn {
    display: flex;
    gap: 0.5rem;
  }

  .input-with-btn input {
    flex: 1;
  }

  .gen-btn {
    background: #E6A23C;
    color: white;
    border: none;
    padding: 0 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  button {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
  }

  .btn-secondary:hover {
    background: #eee;
  }

  .btn-primary {
    background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
    color: white;
    border: none;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
