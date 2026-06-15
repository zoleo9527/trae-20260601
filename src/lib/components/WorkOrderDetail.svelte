<script lang="ts">
  import { onMount } from 'svelte';
  import type { User, WorkOrder, BalanceRecord, OperationLog } from '$lib/types';
  import BalanceRecordForm from './BalanceRecordForm.svelte';
  import InspectionForm from './InspectionForm.svelte';

  export let order: WorkOrder;
  export let user: User;
  export let onBack: () => void;
  export let onLogout: () => void;

  let logs: OperationLog[] = [];
  let showBalanceForm = false;
  let editRecord: BalanceRecord | null = null;
  let showInspectionForm = false;

  const wheelPositions = ['左前轮', '右前轮', '左后轮', '右后轮', '备胎'];

  async function loadLogs() {
    const response = await fetch(`/api/logs?workOrderId=${order.id}`);
    const result = await response.json();
    
    if (result.success) {
      logs = result.data;
    }
  }

  async function refreshOrder() {
    const response = await fetch(`/api/orders/${order.id}`);
    const result = await response.json();
    
    if (result.success) {
      Object.assign(order, result.data);
    }
    
    await loadLogs();
  }

  async function handleAddBalance(data: Omit<BalanceRecord, 'id' | 'createdAt' | 'updatedAt'>) {
    await fetch('/api/balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, workOrderId: order.id })
    });
    
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workOrderId: order.id,
        action: '更新动平衡',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        details: `添加动平衡记录: ${data.wheelPosition}，平衡值: ${data.balanceValue}g`
      })
    });
    
    showBalanceForm = false;
    await refreshOrder();
  }

  async function handleUpdateBalance(record: BalanceRecord, data: Partial<BalanceRecord>) {
    const oldValue = record.balanceValue;
    
    await fetch('/api/balance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: record.id, ...data })
    });
    
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workOrderId: order.id,
        action: '修改记录',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        details: `修改动平衡记录: ${record.wheelPosition}，平衡值从 ${oldValue}g 改为 ${data.balanceValue}g`
      })
    });
    
    showBalanceForm = false;
    await refreshOrder();
  }

  async function handleCompleteBalance(recordId: string) {
    const record = order.balanceRecords?.find(r => r.id === recordId);
    if (record) {
      await fetch('/api/balance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, status: '已完成' })
      });
      
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: order.id,
          action: '完成动平衡',
          operatorId: user.id,
          operatorName: user.name,
          operatorRole: user.role,
          details: `完成动平衡: ${record.wheelPosition}`
        })
      });
      
      await refreshOrder();
    }
  }

  async function handleStartInspection() {
    if (!order.balanceRecords || order.balanceRecords.length === 0) {
      alert('请先录入动平衡记录');
      return;
    }
    
    if (!order.inspectionRecord) {
      await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: order.id,
          status: '质检中',
          inspectorId: user.id,
          checkItems: [],
          passedItems: [],
          failedItems: [],
          remark: ''
        })
      });
    } else {
      await fetch('/api/inspection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.inspectionRecord.id, status: '质检中' })
      });
    }
    
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workOrderId: order.id,
        action: '开始质检',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        details: '开始质检流程'
      })
    });
    
    showInspectionForm = true;
    await refreshOrder();
  }

  async function handleSubmitInspection(data: {
    checkItems: string[];
    passedItems: string[];
    failedItems: string[];
    remark: string;
  }) {
    const status = data.failedItems.length > 0 ? '质检不通过' : '质检通过';
    
    if (!order.inspectionRecord) {
      await fetch('/api/inspection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workOrderId: order.id,
          status,
          inspectorId: user.id,
          checkItems: data.checkItems,
          passedItems: data.passedItems,
          failedItems: data.failedItems,
          remark: data.remark
        })
      });
    } else {
      await fetch('/api/inspection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: order.inspectionRecord.id,
          status,
          inspectorId: user.id,
          checkItems: data.checkItems,
          passedItems: data.passedItems,
          failedItems: data.failedItems,
          remark: data.remark
        })
      });
    }
    
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workOrderId: order.id,
        action: status === '质检通过' ? '质检通过' : '质检不通过',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        details: `${status}: 合格项(${data.passedItems.length})，不合格项(${data.failedItems.length})`
      })
    });
    
    showInspectionForm = false;
    await refreshOrder();
  }

  async function handleCompleteDelivery() {
    if (!order.inspectionRecord || order.inspectionRecord.status !== '质检通过') {
      alert('必须先完成质检且质检通过才能交车');
      return;
    }
    
    await fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: '已完成' })
    });
    
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workOrderId: order.id,
        action: '交车完成',
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        details: '工单完成，客户已取车'
      })
    });
    
    await refreshOrder();
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  function canAddBalance() {
    return user.role === '技师' || user.role === '店长';
  }

  function canDoInspection() {
    return user.role === '前台' || user.role === '店长';
  }

  function canCompleteDelivery() {
    return (user.role === '前台' || user.role === '店长') && 
           order.inspectionRecord && 
           order.inspectionRecord.status === '质检通过' && 
           order.status === '进行中';
  }

  onMount(async () => {
    await loadLogs();
  });
</script>

<div class="container">
  <header class="page-header">
    <div class="header-left">
      <button class="btn btn-outline" on:click={onBack}>← 返回列表</button>
      <h1>工单详情</h1>
    </div>
    <div class="header-right">
      <span class="badge {order.status === '进行中' ? 'badge-warning' : 'badge-success'}">
        {order.status}
      </span>
      <button class="btn btn-outline" on:click={onLogout}>退出登录</button>
    </div>
  </header>

  <div class="card">
    <div class="order-info">
      <div class="info-row">
        <span class="label">车牌号</span>
        <span class="value">{order.plateNumber}</span>
      </div>
      <div class="info-row">
        <span class="label">客户姓名</span>
        <span class="value">{order.customerName}</span>
      </div>
      <div class="info-row">
        <span class="label">联系电话</span>
        <span class="value">{order.phone || '-'}</span>
      </div>
      <div class="info-row">
        <span class="label">车型</span>
        <span class="value">{order.vehicleModel || '-'}</span>
      </div>
      <div class="info-row">
        <span class="label">轮胎型号</span>
        <span class="value">{order.tireType || '-'}</span>
      </div>
      <div class="info-row">
        <span class="label">创建时间</span>
        <span class="value">{formatDate(order.createdAt)}</span>
      </div>
      <div class="info-row">
        <span class="label">更新时间</span>
        <span class="value">{formatDate(order.updatedAt)}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="section-header">
      <h2>动平衡记录</h2>
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        {#if order.balanceUpdatedAfterInspection && order.inspectionRecord}
          <div class="alert alert-warning" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; background: #fef3c7; color: #f59e0b; font-size: 13px;">
            ⚠️ 动平衡记录已修改，质检状态已重置为"待重新质检"
          </div>
        {/if}
        {#if canAddBalance()}
          <button class="btn btn-primary btn-sm" on:click={() => {
            showBalanceForm = true;
            editRecord = null;
          }}>
            + 添加记录
          </button>
        {/if}
      </div>
    </div>
    
    {#if !order.balanceRecords || order.balanceRecords.length === 0}
      <p class="empty-text">暂无动平衡记录</p>
    {:else}
      <table class="table">
        <thead>
          <tr>
            <th>车轮位置</th>
            <th>平衡前(g)</th>
            <th>平衡后(g)</th>
            <th>差值(g)</th>
            <th>状态</th>
            <th>操作时间</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each order.balanceRecords as record}
            <tr>
              <td>{record.wheelPosition}</td>
              <td>{record.beforeValue}</td>
              <td>{record.balanceValue}</td>
              <td>{record.beforeValue - record.balanceValue}</td>
              <td>
                <span class="badge {
                  record.status === '待处理' ? 'badge-info' :
                  record.status === '处理中' ? 'badge-warning' :
                  record.status === '需复检' ? 'badge-danger' :
                  'badge-success'
                }">
                  {record.status}
                </span>
              </td>
              <td>{formatDate(record.updatedAt)}</td>
              <td>{record.remark || '-'}</td>
              <td>
                {#if canAddBalance()}
                  <button class="btn btn-outline btn-sm" on:click={() => {
                    showBalanceForm = true;
                    editRecord = record;
                  }}>
                    编辑
                  </button>
                  {#if record.status !== '已完成'}
                    <button class="btn btn-success btn-sm" on:click={() => handleCompleteBalance(record.id)}>
                      完成
                    </button>
                  {/if}
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <div class="card">
    <div class="section-header">
      <h2>质检交车记录</h2>
      {#if canDoInspection()}
        <button 
          class="btn btn-primary btn-sm" 
          on:click={handleStartInspection}
          disabled={!order.inspectionRecord && (!order.balanceRecords || order.balanceRecords.length === 0)}
        >
          {order.inspectionRecord && order.inspectionRecord.status === '质检中' ? '继续质检' : '开始质检'}
        </button>
      {/if}
    </div>
    
    {#if !order.inspectionRecord}
      <p class="empty-text">暂无质检记录</p>
    {:else}
      <div class="inspection-detail">
        <div class="status-row">
          <span class="label">质检状态</span>
          <span class="badge {
            order.inspectionRecord.status === '待质检' ? 'badge-info' :
            order.inspectionRecord.status === '质检中' ? 'badge-warning' :
            order.inspectionRecord.status === '质检不通过' ? 'badge-danger' :
            order.inspectionRecord.status === '待重新质检' ? 'badge-warning' :
            'badge-success'
          }">
            {order.inspectionRecord.status}
          </span>
        </div>
        <div class="info-row">
          <span class="label">质检时间</span>
          <span class="value">{formatDate(order.inspectionRecord.updatedAt)}</span>
        </div>
        <div class="info-row">
          <span class="label">备注</span>
          <span class="value">{order.inspectionRecord.remark || '-'}</span>
        </div>
        
        <div class="check-items">
          <div class="item-section">
            <h4>检查项目</h4>
            <div class="tags">
              {#each order.inspectionRecord.checkItems as item}
                <span class="tag">{item}</span>
              {/each}
            </div>
          </div>
          <div class="item-section">
            <h4>合格项</h4>
            <div class="tags tags-success">
              {#each order.inspectionRecord.passedItems as item}
                <span class="tag">{item}</span>
              {/each}
            </div>
          </div>
          <div class="item-section">
            <h4>不合格项</h4>
            <div class="tags tags-danger">
              {#each order.inspectionRecord.failedItems as item}
                <span class="tag">{item}</span>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
    
    {#if canCompleteDelivery()}
      <button class="btn btn-success mt-20" on:click={handleCompleteDelivery}>
        确认交车
      </button>
    {/if}
  </div>

  <div class="card">
    <div class="section-header">
      <h2>操作日志</h2>
    </div>
    
    {#if logs.length === 0}
      <p class="empty-text">暂无操作日志</p>
    {:else}
      <div class="log-list">
        {#each logs as log}
          <div class="log-item">
            <div class="log-header">
              <span class="log-action">{log.action}</span>
              <span class="log-time">{formatDate(log.timestamp)}</span>
            </div>
            <div class="log-details">
              <span class="log-operator">{log.operatorName} ({log.operatorRole})</span>
              <span class="log-desc">{log.details}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  {#if showBalanceForm}
    <BalanceRecordForm 
      record={editRecord}
      wheelPositions={wheelPositions}
      user={user}
      onClose={() => showBalanceForm = false}
      onSubmit={handleAddBalance}
      onUpdate={(data) => handleUpdateBalance(editRecord, data)}
    />
  {/if}

  {#if showInspectionForm}
    <InspectionForm 
      inspection={order.inspectionRecord}
      user={user}
      onClose={() => showInspectionForm = false}
      onSubmit={handleSubmitInspection}
    />
  {/if}
</div>

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .order-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .info-row {
    display: flex;
    flex-direction: column;
  }

  .info-row .label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .info-row .value {
    font-weight: 500;
    color: #1e293b;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .section-header h2 {
    font-size: 16px;
    margin: 0;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 13px;
  }

  .empty-text {
    text-align: center;
    color: #64748b;
    padding: 20px;
  }

  .inspection-detail {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .check-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .item-section h4 {
    font-size: 14px;
    margin-bottom: 8px;
    color: #64748b;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    padding: 4px 10px;
    background: #e2e8f0;
    border-radius: 4px;
    font-size: 12px;
  }

  .tags-success .tag {
    background: #dcfce7;
    color: #16a34a;
  }

  .tags-danger .tag {
    background: #fee2e2;
    color: #dc2626;
  }

  .log-list {
    margin-top: 16px;
  }

  .log-item {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
  }

  .log-item:last-child {
    border-bottom: none;
  }

  .log-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .log-action {
    font-weight: 600;
    color: #2563eb;
  }

  .log-time {
    font-size: 12px;
    color: #64748b;
  }

  .log-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .log-operator {
    font-size: 13px;
    color: #64748b;
  }

  .log-desc {
    font-size: 14px;
    color: #1e293b;
  }

  .mt-20 {
    margin-top: 20px;
  }
</style>
