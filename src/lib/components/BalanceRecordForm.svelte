<script lang="ts">
  import type { User, BalanceRecord } from '$lib/types';

  export let record: BalanceRecord | null = null;
  export let wheelPositions: string[];
  export let user: User;
  export let onClose: () => void;
  export let onSubmit: (data: Omit<BalanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  export let onUpdate: (data: Partial<BalanceRecord>) => void;

  let wheelPosition = '';
  let beforeValue = 0;
  let balanceValue = 0;
  let status: BalanceRecord['status'] = '处理中';
  let remark = '';

  if (record) {
    wheelPosition = record.wheelPosition;
    beforeValue = record.beforeValue;
    balanceValue = record.balanceValue;
    status = record.status;
    remark = record.remark;
  }

  function handleSubmit() {
    if (!wheelPosition) {
      alert('请选择车轮位置');
      return;
    }
    if (balanceValue < 0) {
      alert('平衡值不能为负数');
      return;
    }

    if (record) {
      onUpdate({
        wheelPosition,
        beforeValue,
        balanceValue,
        status,
        technicianId: user.id,
        remark
      });
    } else {
      onSubmit({
        wheelPosition,
        beforeValue,
        balanceValue,
        status,
        technicianId: user.id,
        remark
      });
    }
  }
</script>

<div class="modal-overlay" on:click|self={onClose}>
  <div class="modal-content">
    <div class="modal-header">
      <h2>{record ? '编辑动平衡记录' : '添加动平衡记录'}</h2>
      <button class="modal-close" on:click={onClose}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label>车轮位置 *</label>
        <select bind:value={wheelPosition}>
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
          bind:value={beforeValue} 
          min="0"
          placeholder="平衡前重量"
        />
      </div>
      
      <div class="form-group">
        <label>平衡后 (g) *</label>
        <input 
          type="number" 
          bind:value={balanceValue} 
          min="0"
          placeholder="平衡后重量"
        />
      </div>
      
      <div class="form-group">
        <label>状态</label>
        <select bind:value={status}>
          <option value="待处理">待处理</option>
          <option value="处理中">处理中</option>
          <option value="已完成">已完成</option>
          <option value="需复检">需复检</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>备注</label>
        <textarea bind:value={remark} placeholder="备注信息"></textarea>
      </div>

      <div class="flex-end mt-20">
        <button type="button" class="btn btn-outline" on:click={onClose}>
          取消
        </button>
        <button type="submit" class="btn btn-primary">
          {record ? '保存修改' : '添加记录'}
        </button>
      </div>
    </form>
  </div>
</div>
