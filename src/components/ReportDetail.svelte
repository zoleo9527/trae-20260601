<script>
  import { auditStatus, roles, deliverySubStatus, addAuditNote, updateReportStatus, addDeliveryRecord, markAsStuck, unstickReport, updateDeliverySubStatus } from '../stores/reportStore'
  
  export let report

  let activeTab = 'process'
  let newNote = ''
  let carryToDelivery = true
  let showActionModal = false
  let actionType = ''
  let actionComment = ''
  let showDeliveryModal = false
  let deliveryType = 'sms_notification'
  let deliveryContent = ''
  let showCompleteModal = false
  let deliveryMethod = 'self'
  let recipientName = ''
  let recipientId = ''

  const tabs = [
    { id: 'process', name: '审核处理', icon: '📋' },
    { id: 'notes', name: '审核备注', icon: '📝' },
    { id: 'delivery', name: '发放登记', icon: '📦' },
    { id: 'timeline', name: '流程跟踪', icon: '⏱️' },
    { id: 'logs', name: '操作日志', icon: '📜' }
  ]

  $: deliveryNotes = report?.auditNotes?.filter(n => n.carryToDelivery) || []
  $: status = report ? auditStatus[report.currentStatus.toUpperCase()] : null
  $: canAudit = report && ['primary_audit', 'secondary_audit', 'final_audit', 'department_review'].includes(report.currentStatus)
  $: canDeliver = report && ['pending_delivery', 'delivery_scheduled'].includes(report.currentStatus)

  function getStatusName(statusId) {
    const key = statusId.toUpperCase()
    return auditStatus[key]?.name || statusId
  }

  function getStatusColor(statusId) {
    const key = statusId.toUpperCase()
    return auditStatus[key]?.color || '#8c8c8c'
  }

  function getRoleName(roleId) {
    const key = Object.keys(roles).find(k => roles[k].id === roleId)
    return roles[key]?.name || roleId
  }

  function getRoleColor(roleId) {
    const key = Object.keys(roles).find(k => roles[k].id === roleId)
    return roles[key]?.color || '#8c8c8c'
  }

  function getNoteTypeLabel(type) {
    const labels = {
      department: '科室意见',
      audit: '审核备注',
      exception: '异常预警',
      delivery: '发放备注'
    }
    return labels[type] || type
  }

  function getDeliveryTypeLabel(type) {
    const labels = {
      sms_notification: '短信通知',
      phone_call: '电话联系',
      phone_confirm: '电话确认',
      delivery_complete: '发放完成',
      scheduled: '预约领取'
    }
    return labels[type] || type
  }

  function submitNote() {
    if (!newNote.trim()) return
    addAuditNote(report.id, {
      type: 'audit',
      role: 'auditor',
      author: '李审核员',
      content: newNote.trim(),
      carryToDelivery
    })
    newNote = ''
    carryToDelivery = true
  }

  function openActionModal(type) {
    actionType = type
    actionComment = ''
    showActionModal = true
  }

  function executeAction() {
    let nextStatus = ''
    let action = ''
    let handler = null

    switch (actionType) {
      case 'pass':
        if (report.currentStatus === 'department_review') {
          nextStatus = 'primary_audit'
          action = '科室审核通过，提交初审'
          handler = '李审核员'
        } else if (report.currentStatus === 'primary_audit') {
          nextStatus = 'secondary_audit'
          action = '初审通过，提交复审'
          handler = '周主任'
        } else if (report.currentStatus === 'secondary_audit') {
          nextStatus = 'final_audit'
          action = '复审通过，提交终审'
          handler = '周主任'
        } else if (report.currentStatus === 'final_audit') {
          nextStatus = 'pending_delivery'
          action = '终审通过，进入发放流程'
          handler = '赵发放员'
        }
        break
      case 'reject':
        if (report.currentStatus === 'primary_audit') {
          nextStatus = 'department_review'
          action = '初审驳回，退回科室重审'
          handler = report.departmentAssignee || '陈医生'
        } else if (report.currentStatus === 'secondary_audit') {
          nextStatus = 'primary_audit'
          action = '复审驳回，退回重审'
          handler = '李审核员'
        } else if (report.currentStatus === 'final_audit') {
          nextStatus = '终审驳回，退回复审'
          handler = '周主任'
        }
        break
      case 'unstick':
        unstickReport(report.id, '李审核员', actionComment || '问题已解决')
        showActionModal = false
        return
      case 'escalate':
        nextStatus = report.currentStatus
        action = '升级处理：' + actionComment
        handler = report.assignee
        break
      case 'stuck':
        markAsStuck(report.id, actionComment, '李审核员')
        showActionModal = false
        return
    }

    if (actionComment) {
      addAuditNote(report.id, {
        type: 'audit',
        role: 'auditor',
        author: '李审核员',
        content: `【${actionType === 'pass' ? '通过' : actionType === 'reject' ? '驳回' : actionType === 'escalate' ? '升级' : '标记卡住'}】${actionComment}`,
        carryToDelivery: true
      })
    }

    updateReportStatus(report.id, nextStatus, handler, '李审核员', action)
    showActionModal = false
  }

  function submitDeliveryRecord() {
    if (!deliveryContent.trim()) return
    
    addDeliveryRecord(report.id, {
      type: deliveryType,
      operator: '赵发放员',
      content: deliveryContent.trim()
    })

    if (deliveryType === 'sms_notification' || deliveryType === 'phone_call') {
      if (report.currentStatus === 'pending_delivery') {
        updateReportStatus(report.id, 'delivery_scheduled', '赵发放员', '赵发放员', '已发送领取通知')
      }
      updateDeliverySubStatus(report.id, 'pending_schedule', '赵发放员')
    } else if (deliveryType === 'scheduled' || deliveryType === 'phone_confirm') {
      updateDeliverySubStatus(report.id, 'pending_pickup', '赵发放员')
    }

    deliveryContent = ''
    showDeliveryModal = false
  }

  function completeDelivery() {
    if (!recipientName.trim() || !recipientId.trim()) return

    const methodLabel = deliveryMethod === 'self' ? '本人自取' : deliveryMethod === 'proxy' ? '代领' : '邮寄'
    
    addDeliveryRecord(report.id, {
      type: 'delivery_complete',
      operator: '赵发放员',
      content: `发放完成，领取方式：${methodLabel}`,
      recipient: recipientName.trim(),
      recipientId: recipientId.trim(),
      deliveryMethod: methodLabel
    })

    updateReportStatus(report.id, 'delivered', null, '赵发放员', `发放完成（${methodLabel}）`)
    showCompleteModal = false
    recipientName = ''
    recipientId = ''
  }

  function getTimelineSteps() {
    const steps = [
      { key: 'pending_reception', title: '前台导检', desc: '患者登记、领取体检表' },
      { key: 'pending_department', title: '科室检查', desc: '各科室完成检查项目' },
      { key: 'department_review', title: '科室医生审核', desc: '检查医生确认结果' },
      { key: 'primary_audit', title: '报告初审', desc: '审核员核对检查结果' },
      { key: 'secondary_audit', title: '报告复审', desc: '资深审核员复核' },
      { key: 'final_audit', title: '报告终审', desc: '主任最终审核' },
      { key: 'pending_delivery', title: '待发放', desc: '进入发放登记流程' },
      { key: 'delivery_scheduled', title: '已预约发放', desc: '已通知患者，预约领取时间' },
      { key: 'delivered', title: '已发放', desc: '报告已交付' }
    ]

    const currentIdx = steps.findIndex(s => s.key === report.currentStatus)
    
    return steps.map((step, idx) => {
      let status = 'pending'
      if (idx < currentIdx) status = 'done'
      else if (idx === currentIdx) status = report.isStuck ? 'stuck' : 'current'
      
      return { ...step, status }
    })
  }

  const quickNotes = [
    '建议定期复查',
    '请携带身份证领取',
    '需本人签字确认',
    '建议专科就诊'
  ]

  function insertQuickNote(text) {
    deliveryContent += (deliveryContent ? ' ' : '') + text
  }
</script>

{#if report}
  <div class="detail-panel">
    <div class="detail-header">
      <div class="detail-patient-section">
        <div class="detail-avatar">{report.patientName.charAt(0)}</div>
        <div>
          <div class="detail-patient-name">
            {report.patientName}
            {#if report.priority === 'urgent'}
              <span style="font-size: 12px; color: #fff; background: #ff4d4f; padding: 2px 8px; border-radius: 4px; margin-left: 8px;">紧急</span>
            {/if}
          </div>
          <div class="detail-patient-meta">
            <span>{report.patientGender} · {report.patientAge}岁</span>
            <span>{report.examType}</span>
            <span>体检日期：{report.examDate}</span>
          </div>
        </div>
      </div>
      <div class="detail-actions">
        <span class="status-tag" style="color: {status?.color}; background: {status?.color}20;">
          {status?.name}
        </span>
        {#if canAudit}
          <button class="btn btn-primary" on:click={() => openActionModal('pass')}>
            ✓ 通过
          </button>
          <button class="btn btn-danger" on:click={() => openActionModal('reject')}>
            ✕ 驳回
          </button>
        {/if}
        {#if canDeliver}
          <button class="btn btn-warning" on:click={() => showCompleteModal = true}>
            ✓ 完成发放
          </button>
        {/if}
      </div>
    </div>

    {#if report.exception}
      <div class="exception-banner {report.exception.level}">
        <div class="stuck-banner-content">
          <div class="stuck-icon">⚠</div>
          <div class="stuck-text">
            <h4>{report.exception.level === 'danger' ? '重大异常' : '异常预警'}</h4>
            <p>{report.exception.description}</p>
          </div>
        </div>
        <button class="btn btn-danger" on:click={() => openActionModal('escalate')}>升级处理</button>
      </div>
    {/if}

    {#if report.isStuck}
      <div class="stuck-banner">
        <div class="stuck-banner-content">
          <div class="stuck-icon">⏸</div>
          <div class="stuck-text">
            <h4>流程已卡住</h4>
            <p>{report.stuckReason}</p>
          </div>
        </div>
        <button class="btn btn-primary" on:click={() => openActionModal('unstick')}>解除卡住</button>
      </div>
    {/if}

    <div class="detail-tabs">
      {#each tabs as tab (tab.id)}
        <button 
          class="tab-btn {activeTab === tab.id ? 'active' : ''}"
          on:click={() => activeTab = tab.id}
        >
          <span>{tab.icon}</span>
          <span>{tab.name}</span>
          {#if tab.id === 'notes' && report.auditNotes?.length}
            <span class="tab-badge">{report.auditNotes.length}</span>
          {/if}
          {#if tab.id === 'delivery' && report.deliveryRecords?.length}
            <span class="tab-badge">{report.deliveryRecords.length}</span>
          {/if}
          {#if tab.id === 'logs' && report.operationLogs?.length}
            <span class="tab-badge">{report.operationLogs.length}</span>
          {/if}
        </button>
      {/each}
    </div>

    <div class="detail-content">
      {#if activeTab === 'process'}
        <div class="info-card">
          <div class="card-header">
            <span class="icon">📋</span>
            基本信息
          </div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">报告编号</span>
              <span class="info-value">{report.id}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前状态</span>
              <span class="info-value" style="color: {status?.color}">{status?.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前处理人</span>
              <span class="info-value">
                {#if report.assignee}
                  <span class="avatar-sm" style="background: {getRoleColor(report.currentHandler)}">{report.assignee.charAt(0)}</span>
                  {report.assignee}
                {:else}
                  <span style="color: #bfbfbf;">无</span>
                {/if}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">处理角色</span>
              <span class="info-value">
                {#if report.currentHandler}
                  {getRoleName(report.currentHandler)}
                {:else}
                  <span style="color: #bfbfbf;">流程已结束</span>
                {/if}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">最后修改</span>
              <span class="info-value">{report.lastModified}</span>
            </div>
            <div class="info-item">
              <span class="info-label">修改人</span>
              <span class="info-value">{report.lastModifier}</span>
            </div>
            {#if ['pending_delivery', 'delivery_scheduled'].includes(report.currentStatus)}
              <div class="info-item">
                <span class="info-label">未发放原因</span>
                <span class="info-value">
                  {#if report.deliverySubStatus}
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                      {deliverySubStatus[report.deliverySubStatus.toUpperCase()]?.icon}
                      {deliverySubStatus[report.deliverySubStatus.toUpperCase()]?.name}
                    </span>
                  {:else}
                    <span style="color: #8c8c8c;">待细分</span>
                  {/if}
                </span>
              </div>
            {/if}
          </div>
        </div>

        {#if canAudit}
          <div class="audit-action-panel">
            <div class="audit-action-header">
              <span class="icon">⚡</span>
              审核操作
            </div>
            <div class="audit-actions">
              <button class="audit-action-btn pass" on:click={() => openActionModal('pass')}>
                <span class="icon">✓</span>
                <span>审核通过</span>
              </button>
              <button class="audit-action-btn reject" on:click={() => openActionModal('reject')}>
                <span class="icon">✕</span>
                <span>驳回重审</span>
              </button>
              <button class="audit-action-btn escalate" on:click={() => openActionModal('escalate')}>
                <span class="icon">↑</span>
                <span>升级处理</span>
              </button>
              <button class="audit-action-btn stuck" on:click={() => openActionModal('stuck')}>
                <span class="icon">⏸</span>
                <span>标记卡住</span>
              </button>
            </div>
          </div>
        {/if}

        {#if canDeliver}
          <div class="audit-action-panel">
            <div class="audit-action-header">
              <span class="icon">📦</span>
              发放登记操作
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">发放阶段：</label>
              <div class="quick-actions">
                {#each Object.values(deliverySubStatus) as subStatus (subStatus.id)}
                  <button 
                    class="quick-btn" 
                    style="{report.deliverySubStatus === subStatus.id ? 'border-color: #1890ff; background: #e6f7ff; color: #1890ff;' : ''}"
                    on:click={() => updateDeliverySubStatus(report.id, subStatus.id, '赵发放员')}
                  >
                    {subStatus.icon} {subStatus.name}
                  </button>
                {/each}
              </div>
            </div>
            <div class="quick-actions">
              <span style="font-size: 12px; color: #8c8c8c; margin-right: 8px;">快捷操作：</span>
              <button class="quick-btn" on:click={() => { deliveryType = 'sms_notification'; deliveryContent = '已发送短信通知：您的体检报告已完成，请携带身份证领取。'; showDeliveryModal = true; }}>
                发送领取短信
              </button>
              <button class="quick-btn" on:click={() => { deliveryType = 'phone_call'; deliveryContent = '电话通知患者领取报告'; showDeliveryModal = true; }}>
                电话联系
              </button>
              <button class="quick-btn" on:click={() => showCompleteModal = true}>
                完成发放登记
              </button>
            </div>
            <div style="margin-top: 12px;">
              <button class="btn btn-primary" on:click={() => showDeliveryModal = true}>
                + 新增发放记录
              </button>
            </div>
          </div>
        {/if}
      {/if}

      {#if activeTab === 'notes'}
        <div class="info-card">
          <div class="card-header">
            <span class="icon">📝</span>
            审核备注
            <span style="font-size: 12px; color: #8c8c8c; font-weight: normal;">
              （带 → 标记的备注将流转到发放环节）
            </span>
          </div>
          <div class="notes-section">
            {#each report.auditNotes as note (note.id)}
              <div class="note-card {note.type}">
                <div class="note-header">
                  <div class="note-author">
                    <span class="avatar-sm" style="background: {getRoleColor(note.role)}">{note.author.charAt(0)}</span>
                    {note.author}
                    <span class="note-role">{getNoteTypeLabel(note.type)}</span>
                    {#if note.department}
                      <span class="note-role" style="background: #e6f7ff; color: #1890ff;">{note.department}</span>
                    {/if}
                  </div>
                  <span class="note-time">{note.timestamp}</span>
                </div>
                <div class="note-content">{note.content}</div>
                <div class="note-footer">
                  {#if note.carryToDelivery}
                    <span class="carry-tag">流转到发放环节</span>
                  {/if}
                </div>
              </div>
            {/each}
            {#if !report.auditNotes?.length}
              <div class="empty-state">
                <div class="icon">📝</div>
                <div>暂无审核备注</div>
              </div>
            {/if}
          </div>
        </div>

        <div class="add-note-section">
          <div class="card-header" style="margin-bottom: 12px;">
            <span class="icon">✏️</span>
            添加备注
          </div>
          <textarea 
            placeholder="请输入审核备注内容..."
            bind:value={newNote}
          ></textarea>
          <div class="note-options">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={carryToDelivery} />
              此备注流转到发放环节（发放人员可见）
            </label>
            <button class="btn btn-primary" on:click={submitNote} disabled={!newNote.trim()}>
              提交备注
            </button>
          </div>
        </div>
      {/if}

      {#if activeTab === 'delivery'}
        {#if deliveryNotes.length > 0}
          <div class="info-card">
            <div class="card-header">
              <span class="icon">📋</span>
              审核流转备注
              <span style="font-size: 12px; color: #8c8c8c; font-weight: normal;">
                （审核环节标记需要发放时注意的事项）
              </span>
            </div>
            <div class="delivery-notes-preview">
              <h5>发放时请注意以下事项</h5>
              {#each deliveryNotes as note (note.id)}
                <div class="delivery-note-item">
                  <span class="note-author">{note.author}：</span>
                  {note.content}
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <div class="info-card">
          <div class="card-header">
            <span class="icon">📦</span>
            发放登记记录
          </div>
          {#each report.deliveryRecords as record (record.id)}
            <div class="delivery-record">
              <span class="delivery-type">{getDeliveryTypeLabel(record.type)}</span>
              <div class="delivery-content">{record.content}</div>
              {#if record.type === 'delivery_complete'}
                <div class="delivery-complete-card">
                  <div class="delivery-complete-title">发放完成确认</div>
                  <div class="delivery-info-row">
                    <span>领取方式：<strong>{record.deliveryMethod}</strong></span>
                    <span>领取人：<strong>{record.recipient}</strong></span>
                  </div>
                  <div class="delivery-info-row" style="margin-top: 4px;">
                    <span>证件号码：<strong>{record.recipientId}</strong></span>
                  </div>
                </div>
              {/if}
              <div class="delivery-meta">
                <span>操作人：{record.operator}</span>
                <span>{record.timestamp}</span>
              </div>
            </div>
          {/each}
          {#if !report.deliveryRecords?.length}
            <div class="empty-state">
              <div class="icon">📦</div>
              <div>暂无发放登记记录</div>
            </div>
          {/if}
        </div>

        {#if canDeliver}
          <div class="add-note-section">
            <div class="card-header" style="margin-bottom: 12px;">
              <span class="icon">✏️</span>
              新增发放记录
            </div>
            <div class="form-group">
              <label class="form-label">记录类型</label>
              <select class="form-select" bind:value={deliveryType}>
                <option value="sms_notification">短信通知</option>
                <option value="phone_call">电话联系</option>
                <option value="phone_confirm">电话确认</option>
                <option value="scheduled">预约领取</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">快捷短语</label>
              <div class="quick-actions">
                {#each quickNotes as text (text)}
                  <button type="button" class="quick-btn" on:click={() => insertQuickNote(text)}>
                    {text}
                  </button>
                {/each}
              </div>
            </div>
            <textarea 
              placeholder="请输入发放记录内容..."
              bind:value={deliveryContent}
            ></textarea>
            <div class="note-options" style="justify-content: flex-end;">
              <button class="btn btn-primary" on:click={submitDeliveryRecord} disabled={!deliveryContent.trim()}>
                提交记录
              </button>
            </div>
          </div>
        {/if}
      {/if}

      {#if activeTab === 'timeline'}
        <div class="info-card">
          <div class="card-header">
            <span class="icon">⏱️</span>
            审核流程跟踪
          </div>
          <div class="timeline">
            {#each getTimelineSteps() as step (step.key)}
              <div class="timeline-item">
                <div class="timeline-dot {step.status}"></div>
                <div class="timeline-content">
                  <div class="timeline-title">{step.title}</div>
                  <div class="timeline-desc">{step.desc}</div>
                  {#if step.status === 'current' && report.assignee}
                    <div class="timeline-meta">
                      当前处理人：<span style="color: #1890ff;">{report.assignee}</span>
                      （{getRoleName(report.currentHandler)}）
                    </div>
                  {/if}
                  {#if step.status === 'stuck'}
                    <div class="timeline-meta" style="color: #ff4d4f;">
                      ⚠ 已卡住：{report.stuckReason}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if activeTab === 'logs'}
        <div class="info-card">
          <div class="card-header">
            <span class="icon">📜</span>
            操作日志
          </div>
          {#each report.operationLogs as log (log.time + log.action)}
            <div class="operation-log">
              <span class="log-time">{log.time}</span>
              <div class="log-content">
                <div class="log-operator">
                  <span class="avatar-sm" style="background: {getRoleColor(log.role)}">{log.operator.charAt(0)}</span>
                  {log.operator}
                  <span class="log-role">{getRoleName(log.role)}</span>
                </div>
                <div class="log-action">{log.action}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  {#if showActionModal}
    <div class="modal-overlay" on:click|self={() => showActionModal = false}>
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">
            {#if actionType === 'pass'}✓ 审核通过
            {:else if actionType === 'reject'}✕ 驳回重审
            {:else if actionType === 'escalate'}↑ 升级处理
            {:else if actionType === 'stuck'}⏸ 标记卡住
            {/if}
          </div>
          <button class="modal-close" on:click={() => showActionModal = false}>×</button>
        </div>
        <div class="modal-body">
          {#if actionType === 'pass'}
            <div class="form-group">
              <label class="form-label">确认信息</label>
              <div style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 4px; padding: 12px; font-size: 13px; color: #389e0d;">
                当前报告将从 <strong>{status?.name}</strong> 进入下一环节。
                {#if report.currentStatus === 'department_review'}
                  <br />→ 提交 <strong>李审核员</strong> 进行初审
                {:else if report.currentStatus === 'primary_audit'}
                  <br />→ 提交 <strong>周主任</strong> 进行复审
                {:else if report.currentStatus === 'secondary_audit'}
                  <br />→ 提交 <strong>周主任</strong> 进行终审
                {:else if report.currentStatus === 'final_audit'}
                  <br />→ 进入 <strong>发放流程</strong>，由 <strong>赵发放员</strong> 处理
                {/if}
              </div>
            </div>
          {/if}
          {#if actionType === 'reject'}
            <div class="form-group">
              <label class="form-label">确认信息</label>
              <div style="background: #fff1f0; border: 1px solid #ffa39e; border-radius: 4px; padding: 12px; font-size: 13px; color: #cf1322;">
                当前报告将从 <strong>{status?.name}</strong> 退回上一环节。
                {#if report.currentStatus === 'primary_audit'}
                  <br />→ 退回 <strong>科室医生</strong> 重审
                {:else if report.currentStatus === 'secondary_audit'}
                  <br />→ 退回 <strong>初审</strong> 重审
                {:else if report.currentStatus === 'final_audit'}
                  <br />→ 退回 <strong>复审</strong> 重审
                {/if}
              </div>
            </div>
          {/if}
          {#if actionType === 'stuck'}
            <div class="form-group">
              <label class="form-label">确认信息</label>
              <div style="background: #fffbe6; border: 1px solid #ffe58f; border-radius: 4px; padding: 12px; font-size: 13px; color: #d46b08;">
                标记后流程将暂停，直到有人手动解除。
              </div>
            </div>
          {/if}
          <div class="form-group">
            <label class="form-label">
              {#if actionType === 'stuck'}<span class="required">*</span>{/if}
              备注说明
            </label>
            <textarea 
              class="form-textarea" 
              placeholder={actionType === 'stuck' ? '请说明卡住原因...' : '请输入备注说明（可选）...'}
              bind:value={actionComment}
            ></textarea>
            <div class="form-hint">此备注将记录在审核备注中，并流转到发放环节。</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" on:click={() => showActionModal = false}>取消</button>
          <button 
            class="btn {actionType === 'pass' ? 'btn-primary' : actionType === 'reject' ? 'btn-danger' : 'btn-warning'}"
            on:click={executeAction}
            disabled={actionType === 'stuck' && !actionComment.trim()}
          >
            确认{actionType === 'pass' ? '通过' : actionType === 'reject' ? '驳回' : actionType === 'escalate' ? '升级' : '标记'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showDeliveryModal}
    <div class="modal-overlay" on:click|self={() => showDeliveryModal = false}>
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">新增发放记录</div>
          <button class="modal-close" on:click={() => showDeliveryModal = false}>×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">记录类型</label>
            <select class="form-select" bind:value={deliveryType}>
              <option value="sms_notification">短信通知</option>
              <option value="phone_call">电话联系</option>
              <option value="phone_confirm">电话确认</option>
              <option value="scheduled">预约领取</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">快捷短语</label>
            <div class="quick-actions">
              {#each quickNotes as text (text)}
                <button type="button" class="quick-btn" on:click={() => insertQuickNote(text)}>
                  {text}
                </button>
              {/each}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span> 记录内容</label>
            <textarea 
              class="form-textarea" 
              placeholder="请输入发放记录内容..."
              bind:value={deliveryContent}
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" on:click={() => showDeliveryModal = false}>取消</button>
          <button class="btn btn-primary" on:click={submitDeliveryRecord} disabled={!deliveryContent.trim()}>
            提交记录
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showCompleteModal}
    <div class="modal-overlay" on:click|self={() => showCompleteModal = false}>
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">完成发放登记</div>
          <button class="modal-close" on:click={() => showCompleteModal = false}>×</button>
        </div>
        <div class="modal-body">
          {#if deliveryNotes.length > 0}
            <div class="delivery-notes-preview">
              <h5>发放时请注意以下事项</h5>
              {#each deliveryNotes as note (note.id)}
                <div class="delivery-note-item">
                  <span class="note-author">{note.author}：</span>
                  {note.content}
                </div>
              {/each}
            </div>
          {/if}
          <div class="form-group">
            <label class="form-label"><span class="required">*</span> 领取方式</label>
            <select class="form-select" bind:value={deliveryMethod}>
              <option value="self">本人自取</option>
              <option value="proxy">他人代领</option>
              <option value="mail">邮寄</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span> 领取人姓名</label>
            <input 
              type="text" 
              class="form-input" 
              placeholder="请输入领取人姓名"
              bind:value={recipientName}
            />
          </div>
          <div class="form-group">
            <label class="form-label"><span class="required">*</span> 领取人身份证号</label>
            <input 
              type="text" 
              class="form-input" 
              placeholder="请输入身份证号（需核验原件）"
              bind:value={recipientId}
            />
            <div class="form-hint">请务必核验领取人身份证原件，确保报告发放安全。</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" on:click={() => showCompleteModal = false}>取消</button>
          <button class="btn btn-primary" on:click={completeDelivery} disabled={!recipientName.trim() || !recipientId.trim()}>
            确认完成发放
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="detail-panel">
    <div class="detail-empty">
      <div class="icon">📋</div>
      <div>请从左侧列表选择一份报告查看详情</div>
    </div>
  </div>
{/if}
