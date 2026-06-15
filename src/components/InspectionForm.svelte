<script lang="ts">
  import { reactive, onMount } from 'svelte';
  import type { User, InspectionRecord } from '../lib/types';

  export let inspection: InspectionRecord | null;
  export let user: User;

  const emit = defineEmits<{
    close: [];
    submit: [data: {
      checkItems: string[];
      passedItems: string[];
      failedItems: string[];
      remark: string;
    }];
  }>();

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

  const form = reactive({
    checkItems: [] as string[],
    passedItems: [] as string[],
    failedItems: [] as string[],
    remark: ''
  });

  onMount(() => {
    if (inspection) {
      form.checkItems = [...inspection.checkItems];
      form.passedItems = [...inspection.passedItems];
      form.failedItems = [...inspection.failedItems];
      form.remark = inspection.remark;
    } else {
      form.checkItems = [...defaultCheckItems];
    }
  });

  function toggleItem(item: string, isPassed: boolean) {
    const passedIndex = form.passedItems.indexOf(item);
    const failedIndex = form.failedItems.indexOf(item);

    if (isPassed) {
      if (passedIndex === -1) {
        form.passedItems.push(item);
      } else {
        form.passedItems.splice(passedIndex, 1);
      }
      if (failedIndex !== -1) {
        form.failedItems.splice(failedIndex, 1);
      }
    } else {
      if (failedIndex === -1) {
        form.failedItems.push(item);
      } else {
        form.failedItems.splice(failedIndex, 1);
      }
      if (passedIndex !== -1) {
        form.passedItems.splice(passedIndex, 1);
      }
    }
  }

  function isPassed(item: string) {
    return form.passedItems.includes(item);
  }

  function isFailed(item: string) {
    return form.failedItems.includes(item);
  }

  function handleSubmit() {
    if (form.passedItems.length + form.failedItems.length === 0) {
      alert('请至少选择一项检查结果');
      return;
    }

    emit('submit', {
      checkItems: form.checkItems,
      passedItems: form.passedItems,
      failedItems: form.failedItems,
      remark: form.remark
    });
  }
</script>

<div class="modal-overlay" on:click|self={() => emit('close')}>
  <div class="modal-content" style="max-width: 600px;">
    <div class="modal-header">
      <h2>质检检查</h2>
      <button class="modal-close" on:click={() => emit('close')}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label>检查项目</label>
        <div class="check-list">
          {#each form.checkItems as item}
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
        <textarea bind:value={form.remark} placeholder="质检备注信息"></textarea>
      </div>

      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-label">合格项</span>
          <span class="summary-value success">{form.passedItems.length} 项</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">不合格项</span>
          <span class="summary-value danger">{form.failedItems.length} 项</span>
        </div>
      </div>

      <div class="flex-end mt-20">
        <button type="button" class="btn btn-outline" on:click={() => emit('close')}>
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
