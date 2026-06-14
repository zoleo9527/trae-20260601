<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { getRoleData } from '$lib/api.js';
  import { user, showNotification } from '$lib/stores.js';
  import { statusLabels, statusColors, priorityLabels, priorityColors, roleLabels } from '$lib/api.js';

  const dispatch = createEventDispatcher();

  let roleData = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    if ($user) {
      await loadRoleData();
    }
  });

  $: if ($user && !roleData) {
    loadRoleData();
  }

  export async function loadRoleData() {
    if (!$user) return;
    
    loading = true;
    error = '';
    try {
      const result = await getRoleData();
      roleData = result;
    } catch (err) {
      error = err.message;
      console.error('Failed to load role data:', err);
    } finally {
      loading = false;
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  }

  function getDaysRemaining(dueDate) {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function getUrgencyClass(urgencyLevel, daysRemaining) {
    if (urgencyLevel === 'overdue' || daysRemaining < 0) return 'overdue';
    if (urgencyLevel === 'critical' || daysRemaining <= 1) return 'critical';
    if (urgencyLevel === 'urgent' || daysRemaining <= 3) return 'urgent';
    return 'normal';
  }

  function handleSampleClick(sample) {
    dispatch('selectSample', sample);
  }

  function handleReminderAcknowledge(reminder) {
    dispatch('acknowledgeReminder', reminder);
  }

  $: roleTitle = roleLabels[$user?.role] || '';
  $: roleIcon = getRoleIcon($user?.role);

  function getRoleIcon(role) {
    const icons = {
      acceptor: '📋',
      appraiser: '🔬',
      quality_controller: '🔍',
      admin: '⚙️'
    };
    return icons[role] || '👤';
  }
</script>

<div class="role-dashboard">
  {#if loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>加载工作台数据...</p>
    </div>
  {:else if error}
    <div class="error-state">
      <p>⚠️ {error}</p>
      <button on:click={loadRoleData}>重试</button>
    </div>
  {:else if roleData}
    <div class="dashboard-header">
      <div class="role-badge">
        <span class="role-icon">{roleIcon}</span>
        <span class="role-title">{roleTitle}工作台</span>
      </div>
      <div class="pressure-indicators">
        {#if roleData.urgentSamples && roleData.urgentSamples.length > 0}
          <div class="pressure-item urgent">
            <span class="pressure-icon">🔥</span>
            <span class="pressure-count">{roleData.urgentSamples.length}</span>
            <span class="pressure-label">紧急任务</span>
          </div>
        {/if}
        {#if roleData.reminders && roleData.reminders.length > 0}
          <div class="pressure-item reminder">
            <span class="pressure-icon">🔔</span>
            <span class="pressure-count">{roleData.reminders.length}</span>
            <span class="pressure-label">催办提醒</span>
          </div>
        {/if}
      </div>
    </div>

    {#if $user?.role === 'acceptor'}
      <div class="acceptor-dashboard">
        <div class="section urgent-tasks">
          <h3>🔥 待接收样本（压力区）</h3>
          {#if roleData.urgentSamples.length === 0}
            <div class="empty-message">✅ 当前无待接收样本</div>
          {:else}
            <div class="urgent-list">
              {#each roleData.urgentSamples as sample (sample.id)}
                <div 
                  class="urgent-item {getUrgencyClass(sample.urgency_level, getDaysRemaining(sample.due_date))}"
                  on:click={() => handleSampleClick(sample)}
                >
                  <div class="item-header">
                    <span class="case-number">{sample.case_number}</span>
                    <span class="priority-badge" style="background: {priorityColors[sample.priority]}">
                      {priorityLabels[sample.priority]}
                    </span>
                    <span class="status-badge" style="background: {statusColors[sample.reception_status]}">
                      {statusLabels[sample.reception_status]}
                    </span>
                  </div>
                  <div class="item-body">
                    <span class="case-name">{sample.case_name}</span>
                    <span class="sample-type">{sample.sample_type} ({sample.sample_count}份)</span>
                  </div>
                  <div class="item-footer">
                    {#if sample.assigned_appraiser_id}
                      <span class="appraiser">鉴定人: {sample.appraiser_name}</span>
                    {:else}
                      <span class="appraiser unassigned">⚠️ 未分配鉴定人</span>
                    {/if}
                    <span class="due-date {getUrgencyClass(sample.urgency_level, getDaysRemaining(sample.due_date))}">
                      {#if getDaysRemaining(sample.due_date) < 0}
                        已逾期 {Math.abs(getDaysRemaining(sample.due_date))} 天
                      {:else if getDaysRemaining(sample.due_date) === 0}
                        今日截止
                      {:else if getDaysRemaining(sample.due_date) === 1}
                        明日截止
                      {:else}
                        剩余 {getDaysRemaining(sample.due_date)} 天
                      {/if}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="section my-tasks">
          <h3>📋 我的任务</h3>
          {#if roleData.myTasks.length === 0}
            <div class="empty-message">暂无任务</div>
          {:else}
            <div class="task-list">
              {#each roleData.myTasks as task (task.id)}
                <div class="task-item" on:click={() => handleSampleClick(task)}>
                  <span class="task-case">{task.case_number}</span>
                  <span class="task-name">{task.case_name}</span>
                  <span class="task-status" style="background: {statusColors[task.reception_status]}">
                    {statusLabels[task.reception_status]}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="section reminders">
          <h3>🔔 催办提醒</h3>
          {#if roleData.reminders.length === 0}
            <div class="empty-message">暂无催办</div>
          {:else}
            <div class="reminder-list">
              {#each roleData.reminders as reminder (reminder.id)}
                <div class="reminder-item {reminder.reminder_type}">
                  <div class="reminder-header">
                    <span class="reminder-icon">
                      {#if reminder.reminder_type === 'deadline'}⏰{:else if reminder.reminder_type === 'supplementary'}📝{:else}🔔{/if}
                    </span>
                    <span class="reminder-title">{reminder.title}</span>
                    <span class="reminder-time">{formatDateTime(reminder.created_at)}</span>
                  </div>
                  <div class="reminder-body">
                    <span class="reminder-case">{reminder.case_number} - {reminder.case_name}</span>
                    <p class="reminder-message">{reminder.message}</p>
                  </div>
                  <div class="reminder-actions">
                    <button class="acknowledge-btn" on:click={() => handleReminderAcknowledge(reminder)}>
                      知悉并处理
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    {:else if $user?.role === 'appraiser'}
      <div class="appraiser-dashboard">
        <div class="section urgent-tasks">
          <h3>🔥 我的紧急样本（压力区）</h3>
          {#if roleData.urgentSamples.length === 0}
            <div class="empty-message">✅ 当前无紧急样本</div>
          {:else}
            <div class="urgent-list">
              {#each roleData.urgentSamples as sample (sample.id)}
                <div 
                  class="urgent-item {getUrgencyClass(sample.urgency_level, getDaysRemaining(sample.due_date))}"
                  on:click={() => handleSampleClick(sample)}
                >
                  <div class="item-header">
                    <span class="case-number">{sample.case_number}</span>
                    <span class="priority-badge" style="background: {priorityColors[sample.priority]}">
                      {priorityLabels[sample.priority]}
                    </span>
                    <span class="status-badge" style="background: {statusColors[sample.reception_status]}">
                      {statusLabels[sample.reception_status]}
                    </span>
                  </div>
                  <div class="item-body">
                    <span class="case-name">{sample.case_name}</span>
                    <span class="sample-type">{sample.sample_type} ({sample.sample_count}份)</span>
                  </div>
                  <div class="item-footer">
                    <span class="due-date {getUrgencyClass(sample.urgency_level, getDaysRemaining(sample.due_date))}">
                      {#if getDaysRemaining(sample.due_date) < 0}
                        已逾期 {Math.abs(getDaysRemaining(sample.due_date))} 天 ⚠️
                      {:else if getDaysRemaining(sample.due_date) === 0}
                        今日截止 ⚠️
                      {:else if getDaysRemaining(sample.due_date) === 1}
                        明日截止 ⚠️
                      {:else}
                        剩余 {getDaysRemaining(sample.due_date)} 天
                      {/if}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="section my-tasks">
          <h3>📋 待处理样本</h3>
          {#if roleData.myTasks.length === 0}
            <div class="empty-message">暂无待处理样本</div>
          {:else}
            <div class="task-list">
              {#each roleData.myTasks as task (task.id)}
                <div class="task-item" on:click={() => handleSampleClick(task)}>
                  <span class="task-case">{task.case_number}</span>
                  <span class="task-name">{task.case_name}</span>
                  <span class="task-status" style="background: {statusColors[task.reception_status]}">
                    {statusLabels[task.reception_status]}
                  </span>
                  <span class="task-due">
                    {#if getDaysRemaining(task.due_date) <= 3}
                      <span class="urgent-due">剩余 {getDaysRemaining(task.due_date)} 天</span>
                    {:else}
                      <span class="normal-due">{formatDateTime(task.due_date)}</span>
                    {/if}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="section reminders">
          <h3>🔔 催办提醒</h3>
          {#if roleData.reminders.length === 0}
            <div class="empty-message">暂无催办</div>
          {:else}
            <div class="reminder-list">
              {#each roleData.reminders as reminder (reminder.id)}
                <div class="reminder-item {reminder.reminder_type}">
                  <div class="reminder-header">
                    <span class="reminder-icon">
                      {#if reminder.reminder_type === 'deadline'}⏰{:else if reminder.reminder_type === 'supplementary'}📝{:else}🔔{/if}
                    </span>
                    <span class="reminder-title">{reminder.title}</span>
                    <span class="reminder-time">{formatDateTime(reminder.created_at)}</span>
                  </div>
                  <div class="reminder-body">
                    <span class="reminder-case">{reminder.case_number} - {reminder.case_name}</span>
                    <p class="reminder-message">{reminder.message}</p>
                  </div>
                  <div class="reminder-actions">
                    <button class="acknowledge-btn" on:click={() => handleReminderAcknowledge(reminder)}>
                      知悉并处理
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    {:else if $user?.role === 'quality_controller'}
      <div class="quality-dashboard">
        <div class="section urgent-tasks">
          <h3>🔥 待审核意见书（压力区）</h3>
          {#if roleData.urgentSamples.length === 0}
            <div class="empty-message">✅ 当前无待审核意见书</div>
          {:else}
            <div class="urgent-list">
              {#each roleData.urgentSamples as sample (sample.id)}
                <div 
                  class="urgent-item {getUrgencyClass(sample.urgency_level, getDaysRemaining(sample.due_date))}"
                  on:click={() => handleSampleClick(sample)}
                >
                  <div class="item-header">
                    <span class="case-number">{sample.case_number}</span>
                    <span class="priority-badge" style="background: {priorityColors[sample.priority]}">
                      {priorityLabels[sample.priority]}
                    </span>
                  </div>
                  <div class="item-body">
                    <span class="case-name">{sample.case_name}</span>
                    <span class="appraiser">鉴定人: {sample.appraiser_name}</span>
                  </div>
                  <div class="item-footer">
                    <span class="due-date {getUrgencyClass(sample.urgency_level, getDaysRemaining(sample.due_date))}">
                      {#if getDaysRemaining(sample.due_date) < 0}
                        已逾期 {Math.abs(getDaysRemaining(sample.due_date))} 天 ⚠️
                      {:else if getDaysRemaining(sample.due_date) <= 3}
                        剩余 {getDaysRemaining(sample.due_date)} 天 ⚠️
                      {:else}
                        剩余 {getDaysRemaining(sample.due_date)} 天
                      {/if}
                    </span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="section my-tasks">
          <h3>📋 待审核文档</h3>
          {#if roleData.myTasks.length === 0}
            <div class="empty-message">暂无待审核文档</div>
          {:else}
            <div class="task-list">
              {#each roleData.myTasks as task (task.id)}
                <div class="task-item" on:click={() => handleSampleClick(task)}>
                  <span class="task-case">{task.case_number}</span>
                  <span class="task-name">{task.case_name}</span>
                  <span class="task-version">版本 {task.version_number}</span>
                  <span class="task-status" style="background: #E6A23C">
                    待审核
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="section reminders">
          <h3>🔔 催办提醒</h3>
          {#if roleData.reminders.length === 0}
            <div class="empty-message">暂无催办</div>
          {:else}
            <div class="reminder-list">
              {#each roleData.reminders as reminder (reminder.id)}
                <div class="reminder-item {reminder.reminder_type}">
                  <div class="reminder-header">
                    <span class="reminder-icon">
                      {#if reminder.reminder_type === 'deadline'}⏰{:else if reminder.reminder_type === 'quality_check'}🔍{:else}🔔{/if}
                    </span>
                    <span class="reminder-title">{reminder.title}</span>
                    <span class="reminder-time">{formatDateTime(reminder.created_at)}</span>
                  </div>
                  <div class="reminder-body">
                    <span class="reminder-case">{reminder.case_number} - {reminder.case_name}</span>
                    <p class="reminder-message">{reminder.message}</p>
                  </div>
                  <div class="reminder-actions">
                    <button class="acknowledge-btn" on:click={() => handleReminderAcknowledge(reminder)}>
                      知悉并处理
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .role-dashboard {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    margin-bottom: 1.5rem;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
  }

  .role-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .role-icon {
    font-size: 2rem;
  }

  .role-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a2e;
  }

  .pressure-indicators {
    display: flex;
    gap: 1rem;
  }

  .pressure-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
  }

  .pressure-item.urgent {
    background: linear-gradient(135deg, #F56C6C 0%, #E6A23C 100%);
    color: white;
    animation: pulse 2s infinite;
  }

  .pressure-item.reminder {
    background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
    color: white;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  .pressure-icon {
    font-size: 1.5rem;
  }

  .pressure-count {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .pressure-label {
    font-size: 0.9rem;
  }

  .section {
    margin-bottom: 2rem;
  }

  .section h3 {
    color: #1a1a2e;
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .empty-message {
    text-align: center;
    padding: 2rem;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .urgent-list, .task-list, .reminder-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .urgent-item {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 4px solid #909399;
  }

  .urgent-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .urgent-item.overdue {
    background: #FEF0F0;
    border-left-color: #F56C6C;
    animation: shake 0.5s ease-in-out;
  }

  .urgent-item.critical {
    background: #FDF6EC;
    border-left-color: #E6A23C;
  }

  .urgent-item.urgent {
    background: #FDF6EC;
    border-left-color: #E6A23C;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .case-number {
    font-weight: 700;
    color: #1a1a2e;
    font-size: 1rem;
  }

  .priority-badge, .status-badge {
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .item-body {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .case-name {
    color: #333;
    font-size: 0.95rem;
  }

  .sample-type {
    color: #666;
    font-size: 0.9rem;
  }

  .item-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .appraiser {
    color: #666;
    font-size: 0.85rem;
  }

  .appraiser.unassigned {
    color: #F56C6C;
    font-weight: 600;
  }

  .due-date {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .due-date.overdue {
    color: #F56C6C;
    font-weight: 700;
  }

  .due-date.critical {
    color: #E6A23C;
    font-weight: 700;
  }

  .due-date.urgent {
    color: #E6A23C;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: #f9f9f9;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .task-item:hover {
    background: #f0f0f0;
  }

  .task-case {
    font-weight: 600;
    color: #1a1a2e;
  }

  .task-name {
    color: #666;
    flex: 1;
  }

  .task-status {
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .task-version {
    color: #409EFF;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .task-due {
    font-size: 0.85rem;
  }

  .urgent-due {
    color: #F56C6C;
    font-weight: 600;
  }

  .normal-due {
    color: #666;
  }

  .reminder-item {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #409EFF;
  }

  .reminder-item.deadline {
    border-left-color: #F56C6C;
    background: #FEF0F0;
  }

  .reminder-item.supplementary {
    border-left-color: #E6A23C;
    background: #FDF6EC;
  }

  .reminder-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .reminder-icon {
    font-size: 1.25rem;
  }

  .reminder-title {
    font-weight: 600;
    color: #1a1a2e;
    flex: 1;
  }

  .reminder-time {
    font-size: 0.8rem;
    color: #999;
  }

  .reminder-body {
    margin-bottom: 0.75rem;
  }

  .reminder-case {
    color: #666;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
    display: block;
  }

  .reminder-message {
    color: #333;
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.5;
  }

  .reminder-actions {
    display: flex;
    justify-content: flex-end;
  }

  .acknowledge-btn {
    background: #409EFF;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .acknowledge-btn:hover {
    background: #66B1FF;
  }

  .loading-state, .error-state {
    text-align: center;
    padding: 3rem;
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #409EFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-state {
    color: #F56C6C;
  }

  .error-state button {
    background: #F56C6C;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin-top: 1rem;
    cursor: pointer;
  }
</style>