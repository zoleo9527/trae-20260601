<script lang="ts">
  import type { User, WorkOrder } from '$lib/types';

  export let user: User;
  export let onClose: () => void;
  export let onSubmit: (data: Omit<WorkOrder, 'id' | 'balanceRecords' | 'inspectionRecord' | 'createdAt' | 'updatedAt'>) => void;

  let plateNumber = '';
  let customerName = '';
  let phone = '';
  let vehicleModel = '';
  let tireType = '';

  function handleSubmit() {
    if (!plateNumber || !customerName) {
      alert('请填写车牌号和客户姓名');
      return;
    }
    
    onSubmit({
      plateNumber,
      customerName,
      phone,
      vehicleModel,
      tireType,
      createdBy: user.id,
      status: '进行中'
    });
  }
</script>

<div class="modal-overlay" on:click|self={onClose}>
  <div class="modal-content">
    <div class="modal-header">
      <h2>新建工单</h2>
      <button class="modal-close" on:click={onClose}>×</button>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label>车牌号 *</label>
        <input 
          type="text" 
          bind:value={plateNumber} 
          placeholder="请输入车牌号"
        />
      </div>
      <div class="form-group">
        <label>客户姓名 *</label>
        <input 
          type="text" 
          bind:value={customerName} 
          placeholder="请输入客户姓名"
        />
      </div>
      <div class="form-group">
        <label>联系电话</label>
        <input 
          type="tel" 
          bind:value={phone} 
          placeholder="请输入联系电话"
        />
      </div>
      <div class="form-group">
        <label>车型</label>
        <input 
          type="text" 
          bind:value={vehicleModel} 
          placeholder="请输入车型"
        />
      </div>
      <div class="form-group">
        <label>轮胎型号</label>
        <input 
          type="text" 
          bind:value={tireType} 
          placeholder="请输入轮胎型号"
        />
      </div>

      <div class="flex-end mt-20">
        <button type="button" class="btn btn-outline" on:click={onClose}>
          取消
        </button>
        <button type="submit" class="btn btn-primary">
          创建工单
        </button>
      </div>
    </form>
  </div>
</div>
