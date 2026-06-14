<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { getReceptionChecks, addReceptionCheck, getSamplePhotos, addSamplePhoto, getAbnormalities, reportAbnormality, handleAbnormality, checkItems, photoTypes, abnormalityTypes, severityLevels } from '$lib/api.js';
  import { user, showNotification } from '$lib/stores.js';

  export let sampleId;

  const dispatch = createEventDispatcher();

  let checks = [];
  let photos = [];
  let abnormalities = [];
  let loading = true;
  let error = '';

  let showAddCheckModal = false;
  let selectedCheckItem = '';
  let checkResult = 'pending';
  let checkRemarks = '';

  let showAddPhotoModal = false;
  let selectedPhotoType = 'overview';
  let photoDescription = '';

  let showReportAbnormalityModal = false;
  let selectedAbnormalityType = 'damage';
  let abnormalityDescription = '';
  let severity = 'medium';

  let showHandleAbnormalityModal = false;
  let selectedAbnormalityId = '';
  let handlingResult = '';

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';
    try {
      const [checksRes, photosRes, abnormalitiesRes] = await Promise.all([
        getReceptionChecks(sampleId),
        getSamplePhotos(sampleId),
        getAbnormalities(sampleId)
      ]);
      checks = checksRes.checks;
      photos = photosRes.photos;
      abnormalities = abnormalitiesRes.abnormalities;
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

  async function handleAddCheck() {
    if (!selectedCheckItem) return;
    
    try {
      await addReceptionCheck(sampleId, selectedCheckItem, checkResult, checkRemarks);
      showNotification({
        id: Date.now(),
        title: '检查项已添加',
        message: `${selectedCheckItem} - ${checkResult === 'pass' ? '通过' : '不合格'}`,
        type: 'success'
      });
      showAddCheckModal = false;
      selectedCheckItem = '';
      checkResult = 'pending';
      checkRemarks = '';
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '添加失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleAddPhoto() {
    try {
      await addSamplePhoto(sampleId, selectedPhotoType, photoDescription);
      showNotification({
        id: Date.now(),
        title: '照片已上传',
        message: `${photoTypes[selectedPhotoType]} 已保存`,
        type: 'success'
      });
      showAddPhotoModal = false;
      selectedPhotoType = 'overview';
      photoDescription = '';
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '上传失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleReportAbnormality() {
    if (!abnormalityDescription) return;
    
    try {
      await reportAbnormality(sampleId, selectedAbnormalityType, abnormalityDescription, severity);
      showNotification({
        id: Date.now(),
        title: '异常已报告',
        message: `${abnormalityTypes[selectedAbnormalityType]} - ${severityLevels[severity]}`,
        type: severity === 'critical' || severity === 'high' ? 'urgent' : 'warning'
      });
      showReportAbnormalityModal = false;
      selectedAbnormalityType = 'damage';
      abnormalityDescription = '';
      severity = 'medium';
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '报告失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  async function handleAbnormality() {
    if (!handlingResult) return;
    
    try {
      await handleAbnormality(selectedAbnormalityId, handlingResult);
      showNotification({
        id: Date.now(),
        title: '异常已处理',
        message: '处理结果已记录',
        type: 'success'
      });
      showHandleAbnormalityModal = false;
      selectedAbnormalityId = '';
      handlingResult = '';
      await loadData();
      dispatch('refresh');
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '处理失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  $: canAddCheck = $user?.role === 'acceptor';
  $: canAddPhoto = $user?.role === 'acceptor';
  $: canReportAbnormality = $user?.role === 'acceptor' || $user?.role === 'appraiser';
  $: canHandleAbnormality = $user?.role === 'acceptor';
</script>

<div class="sample-reception">
  <div class="reception-header">
    <h3>📋 样本接收流程</h3>
    <p class="subtitle">样本检查、拍照留痕、异常登记</p>
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="reception-content">
      <div class="section checks-section">
        <div class="section-header">
          <h4>✅ 样本检查项</h4>
          {#if canAddCheck}
            <button class="add-btn" on:click={() => showAddCheckModal = true}>
              + 添加检查项
            </button>
          {/if}
        </div>
        
        {#if checks.length === 0}
          <div class="empty-message">暂无检查记录</div>
        {:else}
          <div class="checks-list">
            {#each checks as check (check.id)}
              <div class="check-item {check.check_result}">
                <div class="check-header">
                  <span class="check-item-name">{check.check_item}</span>
                  <span class="check-result-badge {check.check_result}">
                    {#if check.check_result === 'pass'}✅ 通过{:else if check.check_result === 'fail'}❌ 不合格{:else}⏳ 待检查{/if}
                  </span>
                </div>
                {#if check.remarks}
                  <p class="check-remarks">{check.remarks}</p>
                {/if}
                <div class="check-footer">
                  <span class="check-operator">检查人: {check.checked_by_name}</span>
                  <span class="check-time">{formatDateTime(check.checked_at)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="section photos-section">
        <div class="section-header">
          <h4>📸 样本照片</h4>
          {#if canAddPhoto}
            <button class="add-btn" on:click={() => showAddPhotoModal = true}>
              + 上传照片
            </button>
          {/if}
        </div>
        
        {#if photos.length === 0}
          <div class="empty-message">暂无照片记录</div>
        {:else}
          <div class="photos-grid">
            {#each photos as photo (photo.id)}
              <div class="photo-item">
                <div class="photo-placeholder">
                  <span class="photo-icon">📷</span>
                  <span class="photo-type">{photoTypes[photo.photo_type]}</span>
                </div>
                {#if photo.description}
                  <p class="photo-description">{photo.description}</p>
                {/if}
                <div class="photo-footer">
                  <span class="photo-operator">{photo.uploaded_by_name}</span>
                  <span class="photo-time">{formatDateTime(photo.uploaded_at)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="section abnormalities-section">
        <div class="section-header">
          <h4>⚠️ 异常登记</h4>
          {#if canReportAbnormality}
            <button class="add-btn warning" on:click={() => showReportAbnormalityModal = true}>
              + 报告异常
            </button>
          {/if}
        </div>
        
        {#if abnormalities.length === 0}
          <div class="empty-message success">✅ 无异常记录</div>
        {:else}
          <div class="abnormalities-list">
            {#each abnormalities as abnormality (abnormality.id)}
              <div class="abnormality-item {abnormality.severity} {abnormality.status}">
                <div class="abnormality-header">
                  <span class="abnormality-type">{abnormalityTypes[abnormality.abnormality_type]}</span>
                  <span class="severity-badge {abnormality.severity}">
                    {severityLevels[abnormality.severity]}
                  </span>
                  <span class="status-badge {abnormality.status}">
                    {#if abnormality.status === 'pending'}待处理{:else if abnormality.status === 'handling'}处理中{:else if abnormality.status === 'resolved'}已解决{:else}已关闭{/if}
                  </span>
                </div>
                <p class="abnormality-description">{abnormality.description}</p>
                {#if abnormality.handling_result}
                  <div class="handling-result">
                    <span class="handling-label">处理结果:</span>
                    <p class="handling-text">{abnormality.handling_result}</p>
                    <span class="handling-operator">处理人: {abnormality.handled_by_name}</span>
                  </div>
                {:else if canHandleAbnormality && abnormality.status === 'pending'}
                  <button 
                    class="handle-btn" 
                    on:click={() => {
                      selectedAbnormalityId = abnormality.id;
                      showHandleAbnormalityModal = true;
                    }}
                  >
                    处理异常
                  </button>
                {/if}
                <div class="abnormality-footer">
                  <span class="reporter">报告人: {abnormality.reported_by_name}</span>
                  <span class="report-time">{formatDateTime(abnormality.created_at)}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if showAddCheckModal}
  <div class="modal-overlay" on:click={() => showAddCheckModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>添加检查项</h3>
      <div class="form-group">
        <label>检查项</label>
        <select bind:value={selectedCheckItem}>
          <option value="">请选择检查项</option>
          {#each checkItems as item}
            <option value={item}>{item}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>检查结果</label>
        <select bind:value={checkResult}>
          <option value="pass">✅ 通过</option>
          <option value="fail">❌ 不合格</option>
          <option value="pending">⏳ 待检查</option>
        </select>
      </div>
      <div class="form-group">
        <label>备注</label>
        <textarea bind:value={checkRemarks} placeholder="检查备注（可选）" rows="2"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showAddCheckModal = false}>取消</button>
        <button class="btn-primary" on:click={handleAddCheck}>确认</button>
      </div>
    </div>
  </div>
{/if}

{#if showAddPhotoModal}
  <div class="modal-overlay" on:click={() => showAddPhotoModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>上传样本照片</h3>
      <div class="form-group">
        <label>照片类型</label>
        <select bind:value={selectedPhotoType}>
          {#each Object.entries(photoTypes) as [value, label]}
            <option value={value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>照片描述</label>
        <textarea bind:value={photoDescription} placeholder="照片说明（可选）" rows="2"></textarea>
      </div>
      <div class="photo-upload-hint">
        <p>📸 模拟上传功能 - 系统将生成照片路径记录</p>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showAddPhotoModal = false}>取消</button>
        <button class="btn-primary" on:click={handleAddPhoto}>确认上传</button>
      </div>
    </div>
  </div>
{/if}

{#if showReportAbnormalityModal}
  <div class="modal-overlay" on:click={() => showReportAbnormalityModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>报告样本异常</h3>
      <div class="form-group">
        <label>异常类型</label>
        <select bind:value={selectedAbnormalityType}>
          {#each Object.entries(abnormalityTypes) as [value, label]}
            <option value={value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>严重程度</label>
        <select bind:value={severity}>
          {#each Object.entries(severityLevels) as [value, label]}
            <option value={value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="form-group">
        <label>异常描述</label>
        <textarea bind:value={abnormalityDescription} placeholder="请详细描述异常情况" rows="3"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showReportAbnormalityModal = false}>取消</button>
        <button class="btn-warning" on:click={handleReportAbnormality}>报告异常</button>
      </div>
    </div>
  </div>
{/if}

{#if showHandleAbnormalityModal}
  <div class="modal-overlay" on:click={() => showHandleAbnormalityModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <h3>处理异常</h3>
      <div class="form-group">
        <label>处理结果</label>
        <textarea bind:value={handlingResult} placeholder="请描述处理措施和结果" rows="3"></textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" on:click={() => showHandleAbnormalityModal = false}>取消</button>
        <button class="btn-primary" on:click={handleAbnormality}>确认处理</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .sample-reception {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .reception-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
  }

  .reception-header h3 {
    margin: 0;
    color: #1a1a2e;
    font-size: 1.2rem;
  }

  .subtitle {
    margin: 0.5rem 0 0 0;
    color: #666;
    font-size: 0.9rem;
  }

  .loading, .error {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .error {
    color: #F56C6C;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header h4 {
    margin: 0;
    color: #1a1a2e;
    font-size: 1rem;
    font-weight: 600;
  }

  .add-btn {
    background: #409EFF;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: #66B1FF;
  }

  .add-btn.warning {
    background: #E6A23C;
  }

  .add-btn.warning:hover {
    background: #EBB563;
  }

  .empty-message {
    text-align: center;
    padding: 1.5rem;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .empty-message.success {
    color: #67C23A;
    background: #F0F9EB;
  }

  .checks-list, .abnormalities-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .check-item {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #909399;
  }

  .check-item.pass {
    border-left-color: #67C23A;
    background: #F0F9EB;
  }

  .check-item.fail {
    border-left-color: #F56C6C;
    background: #FEF0F0;
  }

  .check-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .check-item-name {
    font-weight: 600;
    color: #333;
  }

  .check-result-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .check-result-badge.pass {
    background: #67C23A;
    color: white;
  }

  .check-result-badge.fail {
    background: #F56C6C;
    color: white;
  }

  .check-result-badge.pending {
    background: #909399;
    color: white;
  }

  .check-remarks {
    color: #666;
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }

  .check-footer {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 0.8rem;
    margin-top: 0.5rem;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .photo-item {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }

  .photo-placeholder {
    background: #e0e0e0;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }

  .photo-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .photo-type {
    font-size: 0.9rem;
    color: #666;
  }

  .photo-description {
    color: #333;
    font-size: 0.85rem;
    margin: 0.5rem 0;
  }

  .photo-footer {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }

  .abnormality-item {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #E6A23C;
  }

  .abnormality-item.critical {
    border-left-color: #F56C6C;
    background: #FEF0F0;
  }

  .abnormality-item.high {
    border-left-color: #E6A23C;
    background: #FDF6EC;
  }

  .abnormality-item.resolved {
    border-left-color: #67C23A;
    background: #F0F9EB;
  }

  .abnormality-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .abnormality-type {
    font-weight: 600;
    color: #333;
    flex: 1;
  }

  .severity-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }

  .severity-badge.critical {
    background: #F56C6C;
  }

  .severity-badge.high {
    background: #E6A23C;
  }

  .severity-badge.medium {
    background: #409EFF;
  }

  .severity-badge.low {
    background: #67C23A;
  }

  .status-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-badge.pending {
    background: #F56C6C;
    color: white;
  }

  .status-badge.handling {
    background: #E6A23C;
    color: white;
  }

  .status-badge.resolved {
    background: #67C23A;
    color: white;
  }

  .status-badge.closed {
    background: #909399;
    color: white;
  }

  .abnormality-description {
    color: #333;
    font-size: 0.9rem;
    margin: 0.5rem 0;
    line-height: 1.5;
  }

  .handling-result {
    background: #F0F9EB;
    padding: 0.75rem;
    border-radius: 6px;
    margin-top: 0.5rem;
  }

  .handling-label {
    color: #67C23A;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .handling-text {
    color: #333;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .handling-operator {
    color: #999;
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  }

  .handle-btn {
    background: #409EFF;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .abnormality-footer {
    display: flex;
    justify-content: space-between;
    color: #999;
    font-size: 0.8rem;
    margin-top: 0.75rem;
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

  textarea, select {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.95rem;
    box-sizing: border-box;
  }

  textarea:focus, select:focus {
    outline: none;
    border-color: #409EFF;
  }

  .photo-upload-hint {
    background: #FDF6EC;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
  }

  .photo-upload-hint p {
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