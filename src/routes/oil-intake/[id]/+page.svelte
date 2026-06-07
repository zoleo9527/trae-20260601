<script>
  import { page } from '$app/stores';
  import { oilIntakeRecords, currentRole, getRoleLabel, getStatusLabel, getStatusTagClass, formatDateTime, operationLogs } from '$lib/stores';
  import { getAvailableActions, performAction, getWorkflowSteps, updateOilIntakeRecord, WorkflowStatus } from '$lib/workflow';
  import { goto } from '$app/navigation';
  import { onMount, browser } from 'svelte';
  
  const recordId = $page.params.id;
  
  $: record = $oilIntakeRecords.find(r => r.id === recordId);
  $: availableActions = record ? getAvailableActions(record) : [];
  $: workflowSteps = record ? getWorkflowSteps(record) : [];
  $: relatedLogs = $operationLogs.filter(l => l.recordId === recordId);
  $: isReturned = record && ['returned_to_manager', 'returned_to_cashier', 'returned_to_measurer'].includes(record.status);
  $: returnedRole = record ? record.status.replace('returned_to_', '') : null;
  
  let showActionModal = false;
  let selectedAction = null;
  let actionComment = '';
  let editing = false;
  let editData = {};
  
  let cashierForm = {
    actualPrice: 0,
    totalAmount: 0,
    invoiceNo: '',
    paymentMethod: '银行转账'
  };
  
  let measurerForm = {
    beforeLevel: 0,
    afterLevel: 0,
    actualVolume: 0,
    temperature: 20,
    density: 0.75,
    difference: 0,
    differenceRate: 0,
    verificationComment: ''
  };
  
  let supplementaryForm = {
    supplementaryContent: '',
    supplementaryFiles: []
  };
  
  let liabilityForm = {
    confirmedBy: '',
    liabilityParty: '',
    liabilityDescription: '',
    handlingMeasures: ''
  };
  
  $: if (record && record.cashierData) {
    cashierForm = { ...cashierForm, ...record.cashierData };
  }
  
  $: if (record && record.measurerData) {
    measurerForm = { ...measurerForm, ...record.measurerData };
  }
  
  $: if (measurerForm.beforeLevel && measurerForm.afterLevel && record) {
    const tankCapacity = 30000;
    const beforeVol = (measurerForm.beforeLevel / 100) * tankCapacity;
    const afterVol = (measurerForm.afterLevel / 100) * tankCapacity;
    measurerForm.actualVolume = Math.round(afterVol - beforeVol);
    measurerForm.difference = measurerForm.actualVolume - record.quantity;
    measurerForm.differenceRate = record.quantity > 0 
      ? ((measurerForm.difference / record.quantity) * 100).toFixed(2) 
      : 0;
  }
  
  function openActionModal(action) {
    selectedAction = action;
    actionComment = '';
    supplementaryForm.supplementaryContent = '';
    showActionModal = true;
  }
  
  function confirmAction() {
    if (!selectedAction) return;
    
    if (selectedAction.action === 'manager_final_review' && record.hasDispute) {
      if (!liabilityForm.liabilityParty || !liabilityForm.liabilityDescription || !liabilityForm.handlingMeasures) {
        alert('争议单必须填写责任方、责任说明和处理措施');
        return;
      }
    }
    
    let data = { comment: actionComment };
    
    if (selectedAction.action === 'cashier_enter') {
      data.cashierData = cashierForm;
    }
    
    if (selectedAction.action === 'measurer_verify' || selectedAction.action === 'measurer_flag_dispute') {
      data.measurerData = measurerForm;
    }
    
    if (selectedAction.action === 'supplement_info') {
      data.supplementaryData = { ...supplementaryForm };
      if ($currentRole === 'cashier') {
        data.cashierData = cashierForm;
      }
      if ($currentRole === 'measurer') {
        data.measurerData = measurerForm;
      }
    }
    
    if (selectedAction.action === 'manager_final_review') {
      data.liabilityConfirmed = { ...liabilityForm };
    }
    
    try {
      performAction(recordId, selectedAction.action, data);
      showActionModal = false;
      selectedAction = null;
    } catch (e) {
      alert(e.message);
    }
  }
  
  function startEdit() {
    editData = { ...record };
    editing = true;
  }
  
  function saveEdit() {
    updateOilIntakeRecord(recordId, editData);
    editing = false;
  }
  
  function cancelEdit() {
    editing = false;
  }
  
  onMount(() => {
    if (!record && browser) {
      setTimeout(() => goto('/oil-intake'), 100);
    }
  });
</script>

{#if record}
  <div class="container">
    <div class="header">
      <div>
        <div class="breadcrumb">
          <a href="/oil-intake">油品入库与罐存校验</a> / <span>{record.orderNo}</span>
        </div>
        <h1 style="margin-top: 8px;">
          {record.orderNo}
          <span class="tag {getStatusTagClass(record.status)}" style="margin-left: 12px;">{getStatusLabel(record.status)}</span>
          {#if record.hasDispute}
            <span class="tag tag-danger" style="margin-left: 8px;">⚠️ 责任待澄清</span>
          {/if}
        </h1>
      </div>
      <div class="header-actions">
        {#if record.status === 'draft' && !editing}
          <button class="btn btn-secondary" on:click={startEdit}>编辑</button>
        {/if}
        <a href="/oil-intake" class="btn btn-secondary">返回列表</a>
      </div>
    </div>
    
    <div class="stepper card">
      {#each workflowSteps as step, i}
        <div class="step {step.active ? 'active' : ''} {step.completed ? 'completed' : ''}">
          <div class="step-number">{step.completed ? '✓' : i + 1}</div>
          <div class="step-label">{step.label}</div>
        </div>
      {/each}
    </div>
    
    {#if record.returnInfo}
      <div class="alert alert-danger">
        <strong>📌 退回通知：</strong>
        <p><strong>退回原因：</strong>{record.returnInfo.returnReason}</p>
        <p style="margin-top: 4px;">
          <strong>退回人：</strong>{getRoleLabel(record.returnInfo.returnBy)} · 
          <strong>退回时间：</strong>{formatDateTime(record.returnInfo.returnAt)} · 
          <strong>退回至：</strong>{getRoleLabel(record.returnInfo.returnTo)}
        </p>
      </div>
    {/if}
    
    {#if record.returnHistory && record.returnHistory.length > 1}
      <div class="card">
        <h3 class="section-title">📜 历史退回记录</h3>
        <div class="return-history-list">
          {#each record.returnHistory.slice(0, -1) as item, index}
            <div class="return-history-item">
              <div class="return-history-header">
                <span class="role-badge role-{item.returnBy}">{getRoleLabel(item.returnBy)}</span>
                <span class="return-time">{formatDateTime(item.returnAt)}</span>
              </div>
              <div class="return-history-content">
                <p><strong>退回至：</strong>{getRoleLabel(item.returnTo)}</p>
                <p><strong>退回原因：</strong>{item.returnReason || '无'}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    {#if record.hasDispute}
      <div class="alert alert-danger">
        <strong>⚠️ 责任边界预警：</strong>
        <p>此单存在罐存校验差异，油品入库数量与油罐实收数量不一致，需站长确认责任归属。</p>
        <ul style="margin-top: 8px; padding-left: 20px;">
          <li>入库量：{record.quantity?.toLocaleString()} 升（油库出库单数据）</li>
          {#if record.measurerData}
            <li>实收量：{record.measurerData.actualVolume?.toLocaleString()} 升（计量员实测）</li>
            <li>差异量：{record.measurerData.difference?.toLocaleString()} 升 ({record.measurerData.differenceRate}%)</li>
          {/if}
          <li>责任方：<strong>待确认</strong> - 运输损耗？油库少发？计量误差？</li>
        </ul>
      </div>
    {/if}
    
    {#if isReturned && $currentRole === returnedRole}
      <div class="card supplementary-card">
        <h3 class="section-title">📝 补充资料</h3>
        <div class="alert alert-warning" style="margin-bottom: 16px;">
          <strong>请根据退回原因补充以下资料：</strong>
          <p>{record.returnInfo?.returnReason || '请按要求补充相关资料'}</p>
        </div>
        
        {#if returnedRole === 'cashier'}
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label class="form-label">实际单价 (元/升)</label>
                <input type="number" step="0.01" class="form-input" bind:value={cashierForm.actualPrice} />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label class="form-label">总金额 (元)</label>
                <input type="number" step="0.01" class="form-input" bind:value={cashierForm.totalAmount} />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label class="form-label">发票号码</label>
                <input type="text" class="form-input" bind:value={cashierForm.invoiceNo} />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label class="form-label">结算方式</label>
                <select class="form-select" bind:value={cashierForm.paymentMethod}>
                  <option value="银行转账">银行转账</option>
                  <option value="现金">现金</option>
                  <option value="月结">月结</option>
                </select>
              </div>
            </div>
          </div>
        {:else if returnedRole === 'measurer'}
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label class="form-label">卸前油位 (%)</label>
                <input type="number" step="0.1" class="form-input" bind:value={measurerForm.beforeLevel} />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label class="form-label">卸后油位 (%)</label>
                <input type="number" step="0.1" class="form-input" bind:value={measurerForm.afterLevel} />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <div class="form-group">
                <label class="form-label">实测温度 (℃)</label>
                <input type="number" step="0.1" class="form-input" bind:value={measurerForm.temperature} />
              </div>
            </div>
            <div class="col">
              <div class="form-group">
                <label class="form-label">实测密度</label>
                <input type="number" step="0.001" class="form-input" bind:value={measurerForm.density} />
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">校验备注</label>
            <textarea class="form-textarea" bind:value={measurerForm.verificationComment} placeholder="请补充校验说明..."></textarea>
          </div>
        {/if}
        
        <div class="form-group">
          <label class="form-label">补充说明 *</label>
          <textarea 
            class="form-textarea" 
            bind:value={supplementaryForm.supplementaryContent} 
            placeholder="请详细说明补充的内容和原因..."
          ></textarea>
        </div>
      </div>
    {/if}
    
    <div class="content-grid">
      <div class="main-content">
        {#if editing}
          <div class="card">
            <h3 class="section-title">✏️ 编辑入库单</h3>
            <div class="row">
              <div class="col">
                <div class="form-group">
                  <label class="form-label">油品类型</label>
                  <select class="form-select" bind:value={editData.oilType}>
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
                  <label class="form-label">入库数量 (升)</label>
                  <input type="number" class="form-input" bind:value={editData.quantity} />
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <div class="form-group">
                  <label class="form-label">目标罐号</label>
                  <input type="text" class="form-input" bind:value={editData.tankNo} />
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label class="form-label">出库单号</label>
                  <input type="text" class="form-input" bind:value={editData.deliveryOrderNo} />
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <div class="form-group">
                  <label class="form-label">罐车号</label>
                  <input type="text" class="form-input" bind:value={editData.tankerNo} />
                </div>
              </div>
              <div class="col">
                <div class="form-group">
                  <label class="form-label">司机</label>
                  <input type="text" class="form-input" bind:value={editData.driverName} />
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-secondary" on:click={cancelEdit}>取消</button>
              <button class="btn btn-primary" on:click={saveEdit}>保存</button>
            </div>
          </div>
        {:else}
          <div class="card">
            <h3 class="section-title">📋 入库基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">油品类型</span>
                <span class="info-value">{record.oilType}</span>
              </div>
              <div class="info-item">
                <span class="info-label">入库数量</span>
                <span class="info-value highlight">{record.quantity?.toLocaleString()} 升</span>
              </div>
              <div class="info-item">
                <span class="info-label">目标油罐</span>
                <span class="info-value">{record.tankNo || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">出库单号</span>
                <span class="info-value">{record.deliveryOrderNo || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">罐车号牌</span>
                <span class="info-value">{record.tankerNo || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">司机姓名</span>
                <span class="info-value">{record.driverName || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">来源油库</span>
                <span class="info-value">{record.sourceDepot || '-'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{formatDateTime(record.createdAt)}</span>
              </div>
            </div>
          </div>
        {/if}
        
        {#if record.cashierData || record.status === 'pending_cashier'}
          <div class="card">
            <h3 class="section-title">
              👩‍💳 收银数据录入
              {#if record.cashierData}
                <span class="tag tag-success" style="margin-left: 8px;">已录入</span>
              {:else}
                <span class="tag tag-warning" style="margin-left: 8px;">待录入</span>
              {/if}
            </h3>
            
            {#if record.status === 'pending_cashier' && $currentRole === 'cashier'}
              <div class="row">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">实际单价 (元/升)</label>
                    <input type="number" step="0.01" class="form-input" bind:value={cashierForm.actualPrice} />
                  </div>
                </div>
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">总金额 (元)</label>
                    <input type="number" step="0.01" class="form-input" bind:value={cashierForm.totalAmount} />
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">发票号码</label>
                    <input type="text" class="form-input" bind:value={cashierForm.invoiceNo} />
                  </div>
                </div>
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">结算方式</label>
                    <select class="form-select" bind:value={cashierForm.paymentMethod}>
                      <option value="银行转账">银行转账</option>
                      <option value="现金">现金</option>
                      <option value="月结">月结</option>
                    </select>
                  </div>
                </div>
              </div>
            {:else if record.cashierData}
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">实际单价</span>
                  <span class="info-value">¥{record.cashierData.actualPrice?.toFixed(2)} / 升</span>
                </div>
                <div class="info-item">
                  <span class="info-label">总金额</span>
                  <span class="info-value highlight">¥{record.cashierData.totalAmount?.toLocaleString()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">发票号码</span>
                  <span class="info-value">{record.cashierData.invoiceNo || '-'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">结算方式</span>
                  <span class="info-value">{record.cashierData.paymentMethod || '-'}</span>
                </div>
              </div>
            {:else}
              <p class="text-muted">当前环节不可录入收银数据</p>
            {/if}
          </div>
        {/if}
        
        {#if record.measurerData || record.status === 'pending_measurer' || ['manager_review', 'supplementary', 'completed', 'closed'].includes(record.status)}
          <div class="card">
            <h3 class="section-title">
              👨‍🔬 罐存校验记录
              {#if record.measurerData}
                <span class="tag {record.hasDispute ? 'tag-danger' : 'tag-success'}" style="margin-left: 8px;">
                  {record.hasDispute ? '有差异' : '已校验'}
                </span>
              {:else}
                <span class="tag tag-warning" style="margin-left: 8px;">待校验</span>
              {/if}
            </h3>
            
            {#if record.status === 'pending_measurer' && $currentRole === 'measurer'}
              <div class="alert alert-warning" style="margin-bottom: 16px;">
                <strong>⚠️ 注意：</strong>罐存校验是责任边界的关键环节，请准确录入计量数据。
                如差异超过 ±0.3%，请标记差异以便站长后续处理。
              </div>
              
              <div class="row">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">卸前油位 (%)</label>
                    <input type="number" step="0.1" class="form-input" bind:value={measurerForm.beforeLevel} />
                  </div>
                </div>
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">卸后油位 (%)</label>
                    <input type="number" step="0.1" class="form-input" bind:value={measurerForm.afterLevel} />
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">实测温度 (℃)</label>
                    <input type="number" step="0.1" class="form-input" bind:value={measurerForm.temperature} />
                  </div>
                </div>
                <div class="col">
                  <div class="form-group">
                    <label class="form-label">实测密度</label>
                    <input type="number" step="0.001" class="form-input" bind:value={measurerForm.density} />
                  </div>
                </div>
              </div>
              
              <div class="calc-results">
                <div class="calc-item">
                  <span class="calc-label">计算实收量：</span>
                  <span class="calc-value">{measurerForm.actualVolume?.toLocaleString()} 升</span>
                </div>
                <div class="calc-item">
                  <span class="calc-label">入库单量：</span>
                  <span class="calc-value">{record.quantity?.toLocaleString()} 升</span>
                </div>
                <div class="calc-item {Math.abs(measurerForm.differenceRate) > 0.3 ? 'danger' : ''}">
                  <span class="calc-label">差异：</span>
                  <span class="calc-value">
                    {measurerForm.difference > 0 ? '+' : ''}{measurerForm.difference?.toLocaleString()} 升
                    ({measurerForm.differenceRate}%)
                  </span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">校验备注</label>
                <textarea class="form-textarea" bind:value={measurerForm.verificationComment} placeholder="请输入校验备注，如有差异请说明情况..."></textarea>
              </div>
            {:else if record.measurerData}
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">卸前油位</span>
                  <span class="info-value">{record.measurerData.beforeLevel}%</span>
                </div>
                <div class="info-item">
                  <span class="info-label">卸后油位</span>
                  <span class="info-value">{record.measurerData.afterLevel}%</span>
                </div>
                <div class="info-item">
                  <span class="info-label">实测温度</span>
                  <span class="info-value">{record.measurerData.temperature}℃</span>
                </div>
                <div class="info-item">
                  <span class="info-label">实测密度</span>
                  <span class="info-value">{record.measurerData.density}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">计算实收量</span>
                  <span class="info-value highlight">{record.measurerData.actualVolume?.toLocaleString()} 升</span>
                </div>
                <div class="info-item">
                  <span class="info-label">入库单量</span>
                  <span class="info-value">{record.quantity?.toLocaleString()} 升</span>
                </div>
                <div class="info-item {Math.abs(record.measurerData.differenceRate) > 0.3 ? 'danger' : ''}">
                  <span class="info-label">差异</span>
                  <span class="info-value">
                    {record.measurerData.difference > 0 ? '+' : ''}{record.measurerData.difference?.toLocaleString()} 升
                    ({record.measurerData.differenceRate}%)
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">校验时间</span>
                  <span class="info-value">{record.measurerVerifiedAt ? formatDateTime(record.measurerVerifiedAt) : '-'}</span>
                </div>
              </div>
              {#if record.measurerData.verificationComment}
                <div class="comment-box">
                  <strong>校验备注：</strong>
                  <p>{record.measurerData.verificationComment}</p>
                </div>
              {/if}
            {:else}
              <p class="text-muted">当前环节不可进行罐存校验</p>
            {/if}
          </div>
        {/if}
        
        {#if record.supplementaryRecords && record.supplementaryRecords.length > 0}
          <div class="card">
            <h3 class="section-title">📋 补充记录历史</h3>
            <div class="supplementary-list">
              {#each record.supplementaryRecords as item, index}
                <div class="supplementary-item">
                  <div class="supplementary-header">
                    <span class="role-badge role-{item.supplementaryBy}">{getRoleLabel(item.supplementaryBy)}</span>
                    <span class="supplementary-time">{formatDateTime(item.supplementaryAt)}</span>
                  </div>
                  {#if item.supplementaryData && item.supplementaryData.supplementaryContent}
                    <div class="supplementary-content">
                      <strong>补充说明：</strong>
                      <p>{item.supplementaryData.supplementaryContent}</p>
                    </div>
                  {/if}
                  {#if item.comment}
                    <div class="supplementary-comment">
                      <strong>备注：</strong>
                      <p>{item.comment}</p>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        {#if record.liabilityConfirmed}
          <div class="card">
            <h3 class="section-title">✅ 责任确认说明</h3>
            <div class="liability-box">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">确认人</span>
                  <span class="info-value">{getRoleLabel(record.liabilityConfirmed.confirmedBy || record.completedBy)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">责任方</span>
                  <span class="info-value highlight">{record.liabilityConfirmed.liabilityParty || '未明确'}</span>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">责任说明</span>
                  <span class="info-value">{record.liabilityConfirmed.liabilityDescription || '-'}</span>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">处理措施</span>
                  <span class="info-value">{record.liabilityConfirmed.handlingMeasures || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        {#if availableActions.length > 0}
          <div class="card action-card">
            <h3 class="section-title">⚡ 可用操作</h3>
            <div class="action-buttons">
              {#each availableActions as action}
                <button 
                  class="btn btn-{action.style || 'secondary'}" 
                  on:click={() => openActionModal(action)}
                >
                  {action.label}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <div class="side-content">
        <div class="card">
          <h3 class="section-title">📝 操作记录</h3>
          <div class="timeline">
            {#each relatedLogs as log}
              <div class="timeline-item">
                <div class="timeline-time">{formatDateTime(log.timestamp)}</div>
                <div class="timeline-content">
                  <div class="timeline-action">
                    <span class="role-badge role-{log.operator}">{getRoleLabel(log.operator)}</span>
                    <span class="action-text">{log.details || log.action}</span>
                  </div>
                </div>
              </div>
            {/each}
            {#if relatedLogs.length === 0}
              <p class="text-muted">暂无操作记录</p>
            {/if}
          </div>
        </div>
        
        <div class="card">
          <h3 class="section-title">📎 背景资料</h3>
          <div class="reference-links">
            <div class="ref-item">
              <span class="ref-icon">📄</span>
              <div class="ref-info">
                <div class="ref-title">旧台账记录样本</div>
                <div class="ref-desc">2024年1-6月入库记录</div>
              </div>
            </div>
            <div class="ref-item">
              <span class="ref-icon">📸</span>
              <div class="ref-info">
                <div class="ref-title">现场记录照片</div>
                <div class="ref-desc">卸油现场、油罐检尺</div>
              </div>
            </div>
            <div class="ref-item">
              <span class="ref-icon">💬</span>
              <div class="ref-info">
                <div class="ref-title">沟通截图</div>
                <div class="ref-desc">与油库、车队的沟通记录</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {#if showActionModal}
    <div class="modal-overlay" on:click={() => showActionModal = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3>{selectedAction?.label}</h3>
        </div>
        <div class="modal-body">
          {#if selectedAction?.action === 'manager_final_review'}
            {#if record.hasDispute}
              <div class="alert alert-danger" style="margin-bottom: 16px;">
                <strong>⚠️ 请确认责任归属：</strong>
                <p>此单存在罐存校验差异，请在最终确认前明确责任方。</p>
              </div>
              <div class="form-group">
                <label class="form-label">责任方认定</label>
                <select class="form-select" bind:value={liabilityForm.liabilityParty}>
                  <option value="">请选择责任方</option>
                  <option value="运输公司">运输公司（运输损耗）</option>
                  <option value="油库">油库（少发）</option>
                  <option value="计量误差">计量误差（正常范围）</option>
                  <option value="多方原因">多方原因</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">责任说明</label>
                <textarea 
                  class="form-textarea" 
                  bind:value={liabilityForm.liabilityDescription} 
                  placeholder="请详细说明责任认定依据..."
                ></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">处理措施</label>
                <textarea 
                  class="form-textarea" 
                  bind:value={liabilityForm.handlingMeasures} 
                  placeholder="请说明后续处理措施..."
                ></textarea>
              </div>
            {/if}
          {/if}
          
          <div class="form-group">
            <label class="form-label">备注说明 {selectedAction?.action?.startsWith('manager_return') || selectedAction?.action === 'measurer_flag_dispute' ? '*' : ''}</label>
            <textarea 
              class="form-textarea" 
              bind:value={actionComment} 
              placeholder="请输入备注说明..."
            ></textarea>
          </div>
          
          {#if selectedAction?.action === 'measurer_flag_dispute'}
            <div class="alert alert-warning">
              <strong>⚠️ 标记差异说明：</strong>
              <p>标记后此单将进入站长复核环节，由站长最终确认责任归属。</p>
            </div>
          {/if}
          
          {#if selectedAction?.action?.startsWith('manager_return')}
            <div class="alert alert-danger">
              <strong>⚠️ 退回说明：</strong>
              <p>请明确说明退回原因，以便相关人员补充修改。</p>
            </div>
          {/if}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" on:click={() => showActionModal = false}>取消</button>
          <button class="btn btn-{selectedAction?.style || 'primary'}" on:click={confirmAction}>
            确认
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="container">
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>单据不存在或已删除</p>
      <a href="/oil-intake" class="btn btn-primary" style="margin-top: 16px;">返回列表</a>
    </div>
  </div>
{/if}

<style>
  .breadcrumb {
    font-size: 14px;
    color: var(--text-secondary);
  }
  
  .breadcrumb a {
    color: var(--primary);
    text-decoration: none;
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .content-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 16px;
  }
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .info-label {
    font-size: 13px;
    color: var(--text-secondary);
  }
  
  .info-value {
    font-size: 15px;
    font-weight: 500;
  }
  
  .info-value.highlight {
    color: var(--primary);
    font-size: 18px;
    font-weight: 600;
  }
  
  .info-item.danger .info-value {
    color: var(--danger);
    font-weight: 600;
  }
  
  .text-muted {
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  .comment-box {
    margin-top: 16px;
    padding: 12px;
    background: var(--bg-light);
    border-radius: 6px;
  }
  
  .comment-box p {
    margin-top: 4px;
    font-size: 14px;
  }
  
  .action-card {
    background: linear-gradient(135deg, var(--primary-light) 0%, #fff 100%);
    border: 1px solid #BEDAFF;
  }
  
  .action-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .calc-results {
    background: var(--bg-light);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .calc-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }
  
  .calc-item.danger {
    color: var(--danger);
    font-weight: 600;
  }
  
  .calc-label {
    color: var(--text-secondary);
  }
  
  .calc-value {
    font-weight: 500;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
  
  .timeline-item {
    padding-bottom: 16px;
  }
  
  .timeline-time {
    font-size: 12px;
    color: var(--text-placeholder);
    margin-bottom: 4px;
  }
  
  .timeline-action {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  
  .action-text {
    font-size: 13px;
  }
  
  .reference-links {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .ref-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--bg-light);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .ref-item:hover {
    background: #E5E6EB;
  }
  
  .ref-icon {
    font-size: 24px;
  }
  
  .ref-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }
  
  .ref-desc {
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal {
    background: white;
    border-radius: 8px;
    width: 480px;
    max-width: 90%;
  }
  
  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }
  
  .modal-header h3 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  .empty-state {
    text-align: center;
    padding: 80px 0;
    color: var(--text-secondary);
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .supplementary-card {
    border-left: 4px solid var(--warning);
    background: linear-gradient(135deg, #FFF7E8 0%, #fff 100%);
  }
  
  .supplementary-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .supplementary-item {
    padding: 16px;
    background: var(--bg-light);
    border-radius: 8px;
    border-left: 3px solid var(--primary);
  }
  
  .supplementary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .supplementary-time {
    font-size: 12px;
    color: var(--text-placeholder);
  }
  
  .supplementary-content,
  .supplementary-comment {
    font-size: 14px;
    margin-top: 4px;
  }
  
  .supplementary-content p,
  .supplementary-comment p {
    margin: 4px 0 0 0;
    color: var(--text-primary);
  }
  
  .liability-box {
    padding: 16px;
    background: #E8FFEA;
    border-radius: 8px;
    border: 1px solid #B7EB8F;
  }
  
  .return-history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .return-history-item {
    padding: 12px;
    background: #FFF1F0;
    border-radius: 6px;
    border-left: 3px solid var(--danger);
  }
  
  .return-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  
  .return-time {
    font-size: 12px;
    color: var(--text-placeholder);
  }
  
  .return-history-content p {
    margin: 2px 0;
    font-size: 13px;
  }
  
  @media (max-width: 900px) {
    .content-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
