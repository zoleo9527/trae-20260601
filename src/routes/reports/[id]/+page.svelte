<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import dayjs from 'dayjs';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import StatusTimeline from '$lib/components/StatusTimeline.svelte';
  import { currentUser } from '$lib/stores.js';

  let report = null;
  let transitions = [];
  let signatures = [];
  let loading = true;
  let activeTab = 'report';
  let actionRemark = '';
  let showActionModal = false;
  let currentAction = null;
  let errorMsg = '';
  let signatureRemark = '';

  const ACTION_CONFIG = {
    report_approved: {
      label: '审核通过',
      btnClass: 'primary',
      roles: ['supervisor'],
      nextStep: '报告审核通过后，将推送至物业签收'
    },
    report_rejected: {
      label: '驳回报告',
      btnClass: 'danger',
      roles: ['supervisor'],
      nextStep: '报告将退回巡检工程师修改',
      requireRemark: true
    },
    pending_signature: {
      label: '推送签收',
      btnClass: 'primary',
      roles: ['supervisor'],
      nextStep: '推送至物业联系人进行签收'
    },
    disputed: {
      label: '提出异议',
      btnClass: 'danger',
      roles: ['property'],
      nextStep: '提出异议后将由维保主管处理',
      requireRemark: true
    },
    report_submitted: {
      label: '重新提交',
      btnClass: 'primary',
      roles: ['inspector'],
      nextStep: '提交后由维保主管再次审核'
    }
  };

  const allowedStatusActions = {
    report_submitted: ['report_approved', 'report_rejected'],
    report_rejected: ['report_submitted'],
    report_approved: ['pending_signature'],
    pending_signature: ['disputed'],
    disputed: ['pending_signature', 'report_rejected']
  };

  const loadData = async () => {
    loading = true;
    const id = $page.params.id;
    const res = await fetch(`/api/reports/${id}`);
    const data = await res.json();
    report = data.report;
    transitions = data.transitions;
    signatures = data.signatures;
    loading = false;
  };

  let lastUserId = null;
  let lastReportId = null;

  onMount(() => {
    lastUserId = $currentUser.id;
    lastReportId = $page.params.id;
    loadData();
  });

  $: if ($currentUser.id !== lastUserId || $page.params.id !== lastReportId) {
    lastUserId = $currentUser.id;
    lastReportId = $page.params.id;
    if (report !== null || $page.params.id !== lastReportId) {
      loadData();
    }
  }

  $: isPropertyManagerOfBuilding = report && report.property_manager_id === $currentUser.id;

  $: canSign = report
    && report.current_status === 'pending_signature'
    && $currentUser.role === 'property'
    && isPropertyManagerOfBuilding;

  $: canDispute = report
    && report.current_status === 'pending_signature'
    && $currentUser.role === 'property'
    && isPropertyManagerOfBuilding;

  $: availableActions = report
    ? (allowedStatusActions[report.current_status] || [])
        .map(key => {
          const config = ACTION_CONFIG[key];
          if (!config) return null;
          let allowed = config.roles?.includes($currentUser.role);
          if (key === 'disputed' && allowed) {
            allowed = isPropertyManagerOfBuilding;
          }
          return { key, ...config, allowed };
        })
        .filter(a => a && a.allowed)
    : [];

  const openAction = (action) => {
    currentAction = action;
    actionRemark = '';
    errorMsg = '';
    showActionModal = true;
  };

  const executeAction = async () => {
    if (currentAction.requireRemark && !actionRemark.trim()) {
      errorMsg = '请填写说明';
      return;
    }

    const res = await fetch(`/api/reports/${report.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_status: currentAction.key,
        operator_id: $currentUser.id,
        remark: actionRemark
      })
    });

    const data = await res.json();
    if (data.success) {
      transitions = [...transitions, data.transition];
      report.current_status = data.new_status.value;
      report.status_label = data.new_status.label;
      report.status_color = data.new_status.color;
      report.responsible_role = data.new_status.responsible_role;
      showActionModal = false;
      currentAction = null;
    } else {
      errorMsg = data.error || '操作失败';
    }
  };

  const executeSign = async () => {
    const res = await fetch(`/api/reports/${report.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatory_id: $currentUser.id,
        remark: signatureRemark
      })
    });

    const data = await res.json();
    if (data.success) {
      transitions = [...transitions, data.transition];
      signatures = [data.signature, ...signatures];
      report.current_status = 'signed';
      report.status_label = '已签收';
      report.status_color = '#22c55e';
      report.responsible_role = null;
      activeTab = 'signature';
    } else {
      errorMsg = data.error || '签收失败';
      alert(errorMsg);
    }
  };

  const executeDispute = async () => {
    const res = await fetch(`/api/reports/${report.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to_status: 'disputed',
        operator_id: $currentUser.id,
        remark: signatureRemark
      })
    });

    const data = await res.json();
    if (data.success) {
      transitions = [...transitions, data.transition];
      report.current_status = data.new_status.value;
      report.status_label = data.new_status.label;
      report.status_color = data.new_status.color;
      report.responsible_role = data.new_status.responsible_role;
      signatureRemark = '';
      activeTab = 'timeline';
    } else {
      errorMsg = data.error || '操作失败';
      alert(errorMsg);
    }
  };

  const goBack = () => {
    goto('/');
  };

  const getEquipmentList = () => {
    if (!report) return [];
    return [
      { label: '火灾报警系统', value: report.fire_alarm_system },
      { label: '自动喷淋系统', value: report.sprinkler_system },
      { label: '灭火器', value: report.fire_extinguishers },
      { label: '应急照明', value: report.emergency_lights },
      { label: '防火门', value: report.fire_doors },
      { label: '其他设备', value: report.other_equipment }
    ];
  };

  const isMyResponsibility = () => {
    if (!report || !report.responsible_role) return false;
    return report.responsible_role === $currentUser.role;
  };
</script>

<div class="detail-page">
  <div class="page-header">
    <button class="back-btn" on:click={goBack}>
      ← 返回列表
    </button>
    {#if report}
      <div class="header-info">
        <h1>维保报告详情</h1>
        <div class="report-meta">
          <span class="report-no">{report.report_no}</span>
          <StatusBadge
            status={report.current_status}
            label={report.status_label}
            color={report.status_color}
            showResponsible={true}
            responsibleRole={report.responsible_role}
          />
          {#if isMyResponsibility()}
            <span class="responsibility-tag">待我处理</span>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="loading">加载中...</div>
  {:else if !report}
    <div class="empty">报告不存在</div>
  {:else}
    <div class="tabs">
      <button
        class="tab-btn"
        class:active={activeTab === 'report'}
        on:click={() => activeTab = 'report'}
      >
        维保报告
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'timeline'}
        on:click={() => activeTab = 'timeline'}
      >
        状态时间线
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'signature'}
        on:click={() => activeTab = 'signature'}
      >
        签收回看
      </button>
    </div>

    <div class="tab-content">
      {#if activeTab === 'report'}
        <div class="report-content">
          <div class="info-section">
            <h3>基本信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <label>建筑名称</label>
                <value>{report.building_name}</value>
              </div>
              <div class="info-item">
                <label>建筑地址</label>
                <value>{report.address}</value>
              </div>
              <div class="info-item">
                <label>巡检日期</label>
                <value>{report.inspection_date}</value>
              </div>
              <div class="info-item">
                <label>巡检工程师</label>
                <value>{report.inspector_name}</value>
              </div>
              <div class="info-item">
                <label>联系电话</label>
                <value>{report.inspector_phone}</value>
              </div>
              <div class="info-item">
                <label>所属部门</label>
                <value>{report.inspector_department}</value>
              </div>
              {#if report.property_manager_name}
                <div class="info-item">
                  <label>物业联系人</label>
                  <value>{report.property_manager_name}</value>
                </div>
                <div class="info-item">
                  <label>物业电话</label>
                  <value>{report.property_manager_phone}</value>
                </div>
              {/if}
            </div>
          </div>

          {#if $currentUser.role !== 'property'}
            <div class="info-section">
              <h3>设备巡检情况</h3>
              <div class="equipment-grid">
                {#each getEquipmentList() as item}
                  <div class="equipment-item" class:abnormal={item.value && item.value !== '正常' && !item.value.includes('正常')}>
                    <label>{item.label}</label>
                    <value>{item.value || '-'}</value>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="info-section">
            <h3>发现问题</h3>
            <div class="content-box" class:has-problem={report.problems_found && report.problems_found !== '无'}>
              {#if report.problems_found && report.problems_found !== '无'}
                <pre>{report.problems_found}</pre>
              {:else}
                <span class="no-problem">未发现问题</span>
              {/if}
            </div>
          </div>

          <div class="info-section">
            <h3>整改建议</h3>
            <div class="content-box">
              {#if report.suggestions}
                <pre>{report.suggestions}</pre>
              {:else}
                <span class="no-suggestion">无特殊建议</span>
              {/if}
            </div>
          </div>

          {#if availableActions.length > 0 || canSign}
            <div class="action-section">
              <h3>操作</h3>
              <div class="action-buttons">
                {#each availableActions as action}
                  <button
                    class="action-btn {action.btnClass}"
                    on:click={() => openAction(action)}
                  >
                    {action.label}
                  </button>
                {/each}
                {#if canSign}
                  <button class="action-btn success" on:click={() => activeTab = 'signature'}>
                    前往签收 →
                  </button>
                {/if}
                {#if report.current_status === 'pending_signature' && !canSign && $currentUser.role === 'property'}
                  <span class="not-assigned-hint">您不是此楼宇的物业联系人，无法签收</span>
                {/if}
              </div>
            </div>
          {/if}
        </div>

      {:else if activeTab === 'timeline'}
        <div class="timeline-content">
          <div class="timeline-header">
            <h3>状态流转时间线</h3>
            <p class="timeline-desc">所有状态变更均记录在案，责任清晰可追溯</p>
          </div>
          {#if transitions.length > 0}
            <StatusTimeline transitions={transitions} />
          {:else}
            <div class="empty">暂无状态记录</div>
          {/if}
        </div>

      {:else if activeTab === 'signature'}
        <div class="signature-content">
          <div class="timeline-header">
            <h3>客户签收回看</h3>
            <p class="timeline-desc">签收记录永久保存，不可篡改</p>
          </div>

          {#if signatures.length > 0}
            {#each signatures as sig}
              <div class="signature-card">
                <div class="signature-header">
                  <div class="signatory-info">
                    <span class="signatory-name">{sig.signatory_name}</span>
                    <span class="signatory-role">物业联系人</span>
                  </div>
                  <span class="signed-time">
                    {dayjs(sig.signed_at).format('YYYY-MM-DD HH:mm:ss')}
                  </span>
                </div>
                {#if sig.from_responsible_name || sig.from_responsible_role}
                  <div class="signature-handover">
                    <span class="handover-label">交接来源:</span>
                    <span class="handover-role">{sig.from_responsible_role_label || sig.from_responsible_role}</span>
                    {#if sig.from_responsible_name}
                      <span class="handover-name">{sig.from_responsible_name}</span>
                    {/if}
                    <span class="handover-arrow">→</span>
                    <span class="handover-to-label">签收人:</span>
                    <span class="handover-role">物业联系人</span>
                    <span class="handover-name">{sig.signatory_name}</span>
                  </div>
                {/if}
                {#if sig.remark}
                  <div class="signature-remark">
                    {sig.remark}
                  </div>
                {/if}
                <div class="signature-valid">
                  <span class="valid-icon">✓</span>
                  此签收记录已存入数据库，不可撤销
                </div>
              </div>
            {/each}
          {:else}
            <div class="empty">
              {#if report.current_status === 'pending_signature'}
                <p>当前状态：待物业签收</p>
                <p class="property-info">
                  指定签收人：<strong>{report.property_manager_name || '未设置'}</strong>
                  {#if report.property_manager_phone}
                    （{report.property_manager_phone}）
                  {/if}
                </p>
                {#if canSign || canDispute}
                  <div class="sign-here">
                    <textarea
                      bind:value={signatureRemark}
                      placeholder="签收/异议备注（提出异议必填说明）"
                      rows="3"
                    ></textarea>
                    <div class="sign-actions">
                      <button class="action-btn danger" on:click={() => {
                        if (!signatureRemark.trim()) {
                          alert('提出异议请填写具体说明');
                          return;
                        }
                        if (confirm('确认对此报告提出异议？状态将转为「签收异议」，由维保主管处理。')) {
                          executeDispute();
                        }
                      }}>
                        提出异议
                      </button>
                      <button class="action-btn success" on:click={() => {
                        if (confirm('确认签收此维保报告？签收后将写入永久记录，不可撤销。')) {
                          executeSign();
                        }
                      }}>
                        确认签收
                      </button>
                    </div>
                    <p class="sign-hint">
                      签收记录将永久存入 <code>signature_records</code>，不可篡改与撤销
                    </p>
                  </div>
                {:else if $currentUser.role === 'property'}
                  <div class="unauthorized-hint">
                    ⚠️ 您的身份为物业联系人（{$currentUser.name}），
                    但此楼宇的物业联系人为「{report.property_manager_name || '未设置'}」，
                    您无权签收或提出异议。
                  </div>
                {:else}
                  <div class="unauthorized-hint">
                    只有本楼宇的物业联系人（{report.property_manager_name || '未设置'}）可以进行签收或提出异议
                  </div>
                {/if}
              {:else}
                暂无签收记录
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  {#if showActionModal && currentAction}
    <div class="modal-overlay" on:click={() => showActionModal = false}>
      <div class="modal" on:click|stopPropagation>
        <h3>{currentAction.label}</h3>
        <p class="modal-desc">{currentAction.nextStep}</p>

        {#if currentAction.requireRemark}
          <div class="form-group">
            <label>说明 <span class="required">*</span></label>
            <textarea
              bind:value={actionRemark}
              placeholder="请填写具体说明..."
              rows="4"
            ></textarea>
          </div>
        {:else}
          <div class="form-group">
            <label>备注（可选）</label>
            <textarea
              bind:value={actionRemark}
              placeholder="补充说明..."
              rows="3"
            ></textarea>
          </div>
        {/if}

        {#if errorMsg}
          <div class="error-msg">{errorMsg}</div>
        {/if}

        <div class="modal-actions">
          <button class="btn-secondary" on:click={() => showActionModal = false}>
            取消
          </button>
          <button class="btn-primary" on:click={executeAction}>
            确认{currentAction.label}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .detail-page {
    max-width: 1000px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .back-btn {
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    font-size: 14px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .header-info h1 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
  }

  .report-meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .report-no {
    font-family: monospace;
    font-size: 14px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .responsibility-tag {
    background: #fef3c7;
    color: #b45309;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .loading, .empty {
    text-align: center;
    padding: 60px;
    color: #94a3b8;
    background: white;
    border-radius: 12px;
  }

  .tabs {
    display: flex;
    gap: 4px;
    background: white;
    border-radius: 12px 12px 0 0;
    padding: 8px 8px 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .tab-btn {
    padding: 12px 24px;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #64748b;
    cursor: pointer;
    border-radius: 8px 8px 0 0;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    color: #3b82f6;
    background: #f8fafc;
  }

  .tab-btn.active {
    color: #2563eb;
    background: #eff6ff;
    font-weight: 500;
  }

  .tab-content {
    background: white;
    border-radius: 0 0 12px 12px;
    padding: 24px;
  }

  .info-section {
    margin-bottom: 28px;
  }

  .info-section h3 {
    margin: 0 0 16px;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    padding-bottom: 8px;
    border-bottom: 2px solid #f1f5f9;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-item label {
    font-size: 12px;
    color: #94a3b8;
  }

  .info-item value {
    font-size: 14px;
    color: #334155;
    font-weight: 500;
  }

  .equipment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .equipment-item {
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    border-left: 3px solid #e2e8f0;
  }

  .equipment-item.abnormal {
    background: #fef2f2;
    border-left-color: #ef4444;
  }

  .equipment-item label {
    display: block;
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
  }

  .equipment-item value {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }

  .equipment-item.abnormal value {
    color: #dc2626;
  }

  .content-box {
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
    min-height: 60px;
  }

  .content-box.has-problem {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }

  .content-box pre {
    margin: 0;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.7;
    white-space: pre-wrap;
    color: #334155;
  }

  .no-problem {
    color: #16a34a;
  }

  .no-suggestion {
    color: #94a3b8;
  }

  .action-section {
    background: #fefce8;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #fef08a;
  }

  .action-section h3 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
    color: #854d0e;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn.primary {
    background: #3b82f6;
    color: white;
  }

  .action-btn.primary:hover {
    background: #2563eb;
  }

  .action-btn.success {
    background: #22c55e;
    color: white;
  }

  .action-btn.success:hover {
    background: #16a34a;
  }

  .action-btn.danger {
    background: #ef4444;
    color: white;
  }

  .action-btn.danger:hover {
    background: #dc2626;
  }

  .timeline-header {
    margin-bottom: 20px;
  }

  .timeline-header h3 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .timeline-desc {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
  }

  .signature-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .signature-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .signature-handover {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    padding: 10px 14px;
    background: white;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .signature-handover .handover-label,
  .signature-handover .handover-to-label {
    color: #166534;
    font-weight: 500;
  }

  .signature-handover .handover-role {
    color: #15803d;
    font-weight: 500;
  }

  .signature-handover .handover-name {
    color: #166534;
    font-weight: 600;
  }

  .signature-handover .handover-arrow {
    color: #16a34a;
    font-weight: 600;
    padding: 0 4px;
  }

  .signatory-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .signatory-name {
    font-size: 16px;
    font-weight: 600;
    color: #166534;
  }

  .signatory-role {
    font-size: 12px;
    color: #15803d;
    background: #bbf7d0;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .signed-time {
    font-size: 13px;
    color: #166534;
    font-family: monospace;
  }

  .signature-remark {
    background: white;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: #374151;
    line-height: 1.6;
  }

  .signature-valid {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #15803d;
  }

  .valid-icon {
    width: 18px;
    height: 18px;
    background: #22c55e;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 12px;
    padding: 24px;
    width: 90%;
    max-width: 480px;
  }

  .modal h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }

  .modal-desc {
    margin: 0 0 20px;
    font-size: 14px;
    color: #64748b;
  }

  .form-group {
    margin-bottom: 16px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .form-group .required {
    color: #ef4444;
  }

  .form-group textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    box-sizing: border-box;
  }

  .form-group textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .error-msg {
    background: #fef2f2;
    color: #dc2626;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .btn-secondary {
    padding: 10px 20px;
    border: 1px solid #d1d5db;
    background: white;
    color: #6b7280;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  .btn-primary {
    padding: 10px 20px;
    border: none;
    background: #3b82f6;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .not-assigned-hint {
    padding: 8px 14px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 6px;
    font-size: 13px;
  }

  .property-info {
    margin: 8px 0 16px;
    font-size: 14px;
    color: #475569;
  }

  .property-info strong {
    color: #1e293b;
  }

  .unauthorized-hint {
    margin-top: 16px;
    padding: 12px 16px;
    background: #fef2f2;
    color: #991b1b;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.6;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }

  .sign-here {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }

  .sign-here textarea {
    padding: 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-family: inherit;
    font-size: 14px;
    resize: vertical;
    min-height: 80px;
  }

  .sign-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .sign-actions .action-btn {
    flex: 1;
    max-width: 200px;
    padding: 12px 20px;
    font-size: 14px;
  }

  .sign-hint {
    text-align: center;
    font-size: 11px;
    color: #94a3b8;
    margin: 4px 0 0;
  }

  .sign-hint code {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-family: monospace;
  }
</style>
