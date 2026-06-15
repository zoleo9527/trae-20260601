<script lang="ts">
  import type { User, InspectionRecord } from '$lib/types';

  export let inspection: InspectionRecord | null;
  export let user: User;
  export let onClose: () => void;
  export let onSubmit: (data: {
    checkItems: string[];
    passedItems: string[];
    failedItems: string[];
    remark: string;
  }) => void;

  const defaultCheckItems = [
    '动平衡值检查',
    '轮胎安装紧固',
    '轮胎磨损检查',
    '胎压检测',
    '气门嘴检查',
    '轮毂清洁度',
    '配重块安装',
    '轮胎动平衡测试'
  ];

  let checkItems: string[] = inspection ? [...inspection.checkItems] : [...defaultCheckItems];
  let passedItems: string[] = inspection ? [...inspection.passedItems] : [];
  let failedItems: string[] = inspection ? [...inspection.failedItems] : [];
  let remark = inspection?.remark || '';

  function toggleItem(item: string, isPassed: boolean) {
    const passedIndex = passedItems.indexOf(item);
    const failedIndex = failedItems.indexOf(item);

    if (isPassed) {
      if (passedIndex === -1) {
        passedItems = [...passedItems, item];
      } else {
        passedItems = passedItems.filter(i => i !== item);
      }
      failedItems = failedItems.filter(i => i !== item);
    } else {
      if (failedIndex === -1) {
        failedItems = [...failedItems, item];
      } else {
        failedItems = failedItems.filter(i => i !== item);
      }
      passedItems = passedItems.filter(i => i !== item);
    }
  }

  function isPassed(item: string) {
    return passedItems.includes(item);
  }

  function isFailed(item: string) {
    return failedItems.includes(item);
  }

  function handleSubmit() {
    if (passedItems.length + failedItems.length === 0) {
      alert('请至少选择一项检查结果');
      return;
    }

    onSubmit({
      checkItems,
      passedItems,
      failedItems,
      remark
    });
  }
</script>

<div class="modal-overlay" on:click|self={onClose}>
  <div class="modal-content" style="max-width: 600px;">
    <div class="modal-header">
      <h2>质检检查</h2>
      <button class="modal-close" on:click={onClose}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label>检查项目</label>
        <div class="check-list">
          {#each checkItems as item}
            <div class="check-item">
              <button 
                type="button" 
                class={`check-btn ${isPassed(item) ? 'btn-success' : isFailed(item) ? 'btn-danger' : 'btn-outline'}`}
                on:click={() => toggleItem(item, !isPassed(item))}
              >
                {item}
              </button>
              <span class="check-status">
                {#if isPassed(item)}✓ 合格{:else if isFailed(item)}✗ 不合格{:else}未检查{/if}
              </span>
            </div>
          {/each}
        </div>
      </div>
      
      <div class="form-group">
        <label>备注</label>
        <textarea bind:value={remark} placeholder="质检备注信息"></textarea>
      </div>

      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">合格项</span>
          <span class="summary-value success">{passedItems.length} 项</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">不合格项</span>
          <span class="summary-value danger">{failedItems.length} 项</span>
        </div>
      </div>

      <div class="flex-end mt-20">
        <button type="button" class="btn btn-outline" on:click={onClose}>
          取消
        </button>
        <button type="submit" class="btn btn-primary">
          提交质检结果
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .check-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
  }

  .check-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .check-btn {
    flex: 1;
    text-align: left;
    padding: 10px 12px;
    font-size: 14px;
  }

  .check-status {
    font-size: 12px;
    color: #64748b;
    min-width: 60px;
    text-align: right;
  }

  .summary-row {
    display: flex;
    justify-content: center;
    gap: 40px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .summary-item {
    text-align: center;
  }

  .summary-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .summary-value {
    font-size: 20px;
    font-weight: 600;
  }

  .summary-value.success {
    color: #16a34a;
  }

  .summary-value.danger {
    color: #dc2626;
  }

  .mt-20 {
    margin-top: 20px;
  }
</style>
