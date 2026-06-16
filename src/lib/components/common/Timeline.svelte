<script lang="ts">
  import { formatDate } from '$lib/storage';
  
  export let items: Array<{
    status: string;
    handler: string;
    note: string;
    created_at: string;
  }> = [];
  export let currentStatus = '';
</script>

<div class="timeline">
  {#each items as item, i}
    <div class="timeline-item">
      <div class="timeline-marker" class:timeline-marker-active={item.status === currentStatus}>
        {#if i === items.length - 1}
          <div class="timeline-dot timeline-dot-current"></div>
        {:else}
          <div class="timeline-dot"></div>
        {/if}
      </div>
      <div class="timeline-content">
        <div class="timeline-header">
          <span class="timeline-status">{item.status}</span>
          <span class="timeline-time">{formatDate(item.created_at)}</span>
        </div>
        <div class="timeline-details">
          <span class="timeline-handler">处理人：{item.handler}</span>
          {#if item.note}
            <span class="timeline-note">{item.note}</span>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .timeline-item {
    display: flex;
    gap: 1rem;
  }

  .timeline-marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    position: relative;
  }

  .timeline-marker::before {
    content: '';
    position: absolute;
    top: 2rem;
    left: 50%;
    width: 2px;
    height: calc(100% + 1rem);
    background-color: #FEF3C7;
    transform: translateX(-50%);
  }

  .timeline-item:last-child .timeline-marker::before {
    display: none;
  }

  .timeline-marker-active::before {
    background-color: #F59E0B;
  }

  .timeline-dot {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background-color: #FDE68A;
    border: 2px solid #F59E0B;
    z-index: 1;
  }

  .timeline-dot-current {
    width: 1.25rem;
    height: 1.25rem;
    background-color: #F59E0B;
    border: 3px solid #D97706;
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
  }

  .timeline-content {
    flex: 1;
    padding: 0.5rem 0;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .timeline-status {
    font-weight: 600;
    color: #78350F;
  }

  .timeline-time {
    font-size: 0.75rem;
    color: #92400E;
  }

  .timeline-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .timeline-handler {
    font-size: 0.875rem;
    color: #B45309;
  }

  .timeline-note {
    font-size: 0.75rem;
    color: #92400E;
    opacity: 0.8;
  }
</style>