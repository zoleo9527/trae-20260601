<script lang="ts">
  import { reactive } from 'svelte';
  import type { User, WorkOrder } from '../lib/types';

  export let user: User;

  const emit = defineEmits<{
    close: [];
    submit: [data: Omit<WorkOrder, 'id' | 'balanceRecords' | 'inspectionRecord' | 'createdAt' | 'updatedAt'>];
  }>();

  const form = reactive({
    plateNumber: '',
    customerName: '',
    phone: '',
    vehicleModel: '',
    tireType: ''
  });

  function handleSubmit() {
    if (!form.plateNumber || !form.customerName) {
      alert('请填写车牌号和客户姓名');
      return;
    }
    
    emit('submit', {
      plateNumber: form.plateNumber,
      customerName: form.customerName,
      phone: form.phone,
      vehicleModel: form.vehicleModel,
      tireType: form.tireType,
      createdBy: user.id,
      status: '进行中'
    });
  }
</script>

<div class="modal-overlay" on:click|self={() => emit('close')}>
  <div class="modal-content">
    <div class="modal-header">
      <h2>新建工单</h2>
      <button class="modal-close" on:click={() => emit('close')}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label>车牌号 *</label>
        <input 
          type="text" 
          bind:value={form.plateNumber} 
          placeholder="请输入车牌号"
        />
      </div>
      <div class="form-group">
        <label>客户姓名 *</label>
        <input 
          type="text" 
          bind:value={form.customerName} 
          placeholder="请输入客户姓名"
        />
      </div>
      <div class="form-group">
        <label>联系电话</label>
        <input 
          type="tel" 
          bind:value={form.phone} 
          placeholder="请输入联系电话"
        />
      </div>
      <div class="form-group">
        <label>车型</label>
        <input 
          type="text" 
          bind:value={form.vehicleModel} 
          placeholder="请输入车型"
        />
      </div>
      <div class="form-group">
        <label>轮胎型号</label>
        <input 
          type="text" 
          bind:value={form.tireType} 
          placeholder="请输入轮胎型号"
        />
      </div>

      <div class="flex-end mt-20">
        <button type="button" class="btn btn-outline" on:click={() => emit('close')}>
          取消
        </button>
        <button type="submit" class="btn btn-primary">
          创建工单
        </button>
      </div>
    </form>
  </div>
</div>
