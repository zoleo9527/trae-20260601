<script>
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime.js';
  import 'dayjs/locale/zh-cn.js';

  dayjs.extend(relativeTime);
  dayjs.locale('zh-cn');

  export let transitions = [];
  export let compact = false;

  const getTimeDisplay = (time) => {
    const now = dayjs();
    const t = dayjs(time);
    const diffHours = now.diff(t, 'hour');
    if (diffHours < 24) {
      return t.fromNow();
    }
    return t.format('MM-DD HH:mm');
  };

  const getFullTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss');
</script>

<div class="timeline">
  {#each transitions as transition, index}
    <div class="timeline-item" class:first={index === 0} class:last={index === transitions.length - 1}>
      <div class="timeline-line">
        {#if index < transitions.length - 1}
          <div class="line"></div>
        {/if}
      </div>

      <div class="timeline-dot" style="background-color: {transition.to_status_color}">
        <div class="dot-inner"></div>
      </div>

      <div class="timeline-content">
        <div class="timeline-header">
          <span class="status-badge" style="background-color: {transition.to_status_color}20; color: {transition.to_status_color}">
            {transition.to_status_label}
          </span>
          <span class="time" title={getFullTime(transition.transition_time)}>
            {getTimeDisplay(transition.transition_time)}
          </span>
        </div>

        <div class="timeline-meta">
          <span class="operator">
            <span class="operator-role">{transition.operator_role_label}</span>
            <span class="operator-name">{transition.operator_name}</span>
          </span>
          {#if transition.operator_department}
            <span class="dept">· {transition.operator_department}</span>
          {/if}
        </div>

        {#if transition.remark}
          <div class="timeline-remark">
            {transition.remark}
          </div>
        {/if}

        {#if !compact && transition.from_status}
          <div class="timeline-transition">
            从 <span class="from-status">{transition.from_status_label}</span> 变更
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .timeline {
    padding: 8px 0;
  }

  .timeline-item {
    display: flex;
    position: relative;
    padding-bottom: 24px;
  }

  .timeline-item:last-child {
    padding-bottom: 0;
  }

  .timeline-line {
    width: 24px;
    display: flex;
    justify-content: center;
  }

  .line {
    width: 2px;
    background: #e5e7eb;
    height: calc(100% + 24px);
    margin-top: 24px;
  }

  .timeline-item:first-child .line {
    height: calc(100% + 12px);
    margin-top: 36px;
  }

  .timeline-dot {
    position: absolute;
    left: 4px;
    top: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 1;
  }

  .dot-inner {
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
  }

  .timeline-content {
    flex: 1;
    padding-left: 12px;
    padding-top: 0;
  }

  .timeline-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
  }

  .status-badge {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .time {
    font-size: 12px;
    color: #9ca3af;
  }

  .timeline-meta {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .operator-role {
    color: #374151;
    font-weight: 500;
    margin-right: 4px;
  }

  .operator-name {
    color: #1f2937;
  }

  .dept {
    color: #9ca3af;
    font-size: 12px;
  }

  .timeline-remark {
    background: #f9fafb;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    color: #374151;
    margin-top: 6px;
    border-left: 3px solid #e5e7eb;
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .timeline-transition {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 4px;
  }

  .from-status {
    color: #6b7280;
    font-weight: 500;
  }

  .timeline-item:last-child .timeline-dot {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1);
  }
</style>
