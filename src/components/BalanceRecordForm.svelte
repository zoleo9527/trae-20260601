<script lang="ts">
  import { reactive, onMount } from 'svelte';
  import type { User, BalanceRecord } from '../lib/types';

  export let record: BalanceRecord | null = null;
  export let wheelPositions: string[];
  export let user: User;

  const emit = defineEmits<{
    close: [];
    submit: [data: Omit<BalanceRecord, 'id' | 'createdAt' | 'updatedAt'>];
    update: [data: Partial<BalanceRecord>];
  }>();

  const form = reactive({
    wheelPosition: '',
    beforeValue: 0,
    balanceValue: 0,
    status: '处理中' as BalanceRecord['status'],
    remark: ''
  });

  onMount(() => {
    if (record) {
      form.wheelPosition = record.wheelPosition;
      form.beforeValue = record.beforeValue;
      form.balanceValue = record.balanceValue;
      form.status = record.status;
      form.remark = record.remark;
    }
  });

  function handleSubmit() {
    if (!form.wheelPosition) {
      alert('请选择车轮位置');
      return;
    }
    if (form.balanceValue < 0) {
      alert('平衡值不能为负数');
      return;
    }

    if (record) {
      emit('update', {
        wheelPosition: form.wheelPosition,
        beforeValue: form.beforeValue,
        balanceValue: form.balanceValue,
        status: form.status,
        technicianId: user.id,
        remark: form.remark
      });
    } else {
      emit('submit', {
        wheelPosition: form.wheelPosition,
        beforeValue: form.beforeValue,
        balanceValue: form.balanceValue,
        status: form.status,
        technicianId: user.id,
        remark: form.remark
      });
    }
  }
</script>

<div class="modal-overlay" on:click|self={() => emit('close')}>
  <div class="modal-content">
    <div class="modal-header">
      <h2>{record ? '编辑动平衡记录' : '添加动平衡记录'}</h2>
      <button class="modal-close" on:click={() => emit('close')}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label>车轮位置 *</label>
        <select bind:value={form.wheelPosition}>
          <option value="">请选择位置</option>
          {#each wheelPositions as pos}
            <option value={pos}>{pos}</option>
          {/each}
        </select>
      </div>
      
      <div class="form-group">
        <label>平衡前 (g)</label>
        <input 
          type="number" 
          bind:value={form.beforeValue} 
          min="0"
          placeholder="平衡前重量"
        />
      </div>
      
      <div class="form-group">
        <label>平衡后 (g) *</label>
        <input 
          type="number" 
          bind:value={form.balanceValue} 
          min="0"
          placeholder="平衡后重量"
        />
      </div>
      
      <div class="form-group">
        <label>状态</label>
        <select bind:value={form.status}>
          <option value="待处理">待处理</option>
          <option value="处理中">处理中</option>
          <option value="已完成">已完成</option>
          <option value="需复检">需复检</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>备注</label>
        <textarea bind:value={form.remark} placeholder="备注信息"></textarea>
      </div>

      <div class="flex-end mt-20">
        <button type="button" class="btn btn-outline" on:click={() => emit('close')}>
          取消
        </button>
        <button type="submit" class="btn btn-primary">
          {record ? '保存修改' : '添加记录'}
        </button>
      </div>
    </form>
  </div>
</div>
