<script>
  import { createOilIntakeRecord } from '$lib/workflow';
  import { currentRole } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let formData = {
    oilType: '92#汽油',
    quantity: 0,
    tankerNo: '',
    driverName: '',
    sourceDepot: '',
    deliveryOrderNo: '',
    tankNo: '1#罐'
  };
  
  let submitting = false;
  
  onMount(() => {
    if ($currentRole !== 'manager') {
      goto('/oil-intake');
    }
  });
  
  function handleSubmit() {
    if ($currentRole !== 'manager') {
      alert('只有站长可以创建入库单');
      return;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      alert('请输入有效的入库数量');
      return;
    }
    submitting = true;
    const record = createOilIntakeRecord(formData);
    goto(`/oil-intake/${record.id}`);
  }
</script>

<div class="container">
  <div class="header">
    <div>
      <h1>新建油品入库单</h1>
      <p class="subtitle">请填写油品入库基本信息</p>
    </div>
    <a href="/oil-intake" class="btn btn-secondary">返回列表</a>
  </div>
  
  <div class="card">
    <div class="form-section">
      <h3 class="section-title">📋 基本信息</h3>
      
      <div class="row">
        <div class="col">
          <div class="form-group">
            <label class="form-label">油品类型 *</label>
            <select class="form-select" bind:value={formData.oilType}>
              <option value="92#汽油">92# 汽油</option>
              <option value="95#汽油">95# 汽油</option>
              <option value="98#汽油">98# 汽油</option>
              <option value="0#柴油">0# 柴油</option>
              <option value="-10#柴油">-10# 柴油</option>
            </select>
          </div>
        </div>
        <div class="col">
          <div class="form-group">
            <label class="form-label">入库数量 (升) *</label>
            <input type="number" class="form-input" bind:value={formData.quantity} placeholder="请输入入库数量" />
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col">
          <div class="form-group">
            <label class="form-label">目标油罐</label>
            <select class="form-select" bind:value={formData.tankNo}>
              <option value="1#罐">1# 罐</option>
              <option value="2#罐">2# 罐</option>
              <option value="3#罐">3# 罐</option>
              <option value="4#罐">4# 罐</option>
            </select>
          </div>
        </div>
        <div class="col">
          <div class="form-group">
            <label class="form-label">油库出库单号</label>
            <input type="text" class="form-input" bind:value={formData.deliveryOrderNo} placeholder="请输入出库单号" />
          </div>
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <h3 class="section-title">🚛 运输信息</h3>
      
      <div class="row">
        <div class="col">
          <div class="form-group">
            <label class="form-label">罐车车牌号</label>
            <input type="text" class="form-input" bind:value={formData.tankerNo} placeholder="如：京A12345" />
          </div>
        </div>
        <div class="col">
          <div class="form-group">
            <label class="form-label">司机姓名</label>
            <input type="text" class="form-input" bind:value={formData.driverName} placeholder="请输入司机姓名" />
          </div>
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">来源油库</label>
        <input type="text" class="form-input" bind:value={formData.sourceDepot} placeholder="如：中石化XX油库" />
      </div>
    </div>
    
    <div class="alert alert-warning">
      <strong>⚠️ 责任提示：</strong>
      <p>油品入库数量以油库出库单为准还是以油罐实收为准，可能存在责任边界模糊。后续罐存校验环节将重点关注差异。</p>
    </div>
    
    <div class="form-actions">
      <a href="/oil-intake" class="btn btn-secondary">取消</a>
      <button class="btn btn-primary" on:click={handleSubmit} disabled={submitting}>
        {submitting ? '保存中...' : '创建入库单'}
      </button>
    </div>
  </div>
</div>

<style>
  .subtitle {
    color: var(--text-secondary);
    margin-top: 4px;
    font-size: 14px;
  }
  
  .form-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  
  .form-section:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 16px;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-primary);
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
</style>
