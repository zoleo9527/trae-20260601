<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { notifications, unreadCount } from '$lib/stores/notifications';
  import { formatDate } from '$lib/storage';
  
  export let show = false;
</script>

{#if show}
  <div class="notification-panel" transition:fly={{ y: -20, duration: 300 }}>
    <div class="notification-header">
      <h3 class="notification-title">通知中心</h3>
      <div class="notification-actions">
        <button class="notification-action" on:click={() => notifications.markAllAsRead()}>
          全部已读
        </button>
        <button class="notification-close" on:click={() => show = false}>
          ✕
        </button>
      </div>
    </div>
    <div class="notification-list">
      {#each $notifications as notification}
        <div 
          class="notification-item"
          class:notification-unread={!notification.is_read}
          transition:fade={{ duration: 200 }}
        >
          <div class="notification-icon notification-icon-{notification.type}">
            {#if notification.type === 'alert'}
              ⚠️
            {:else if notification.type === 'success'}
              ✓
            {:else}
              ℹ️
            {/if}
          </div>
          <div class="notification-content">
            <div class="notification-item-title">{notification.title}</div>
            <div class="notification-item-text">{notification.content}</div>
            <div class="notification-item-time">{formatDate(notification.created_at)}</div>
          </div>
          <div class="notification-item-actions">
            {#if !notification.is_read}
              <button 
                class="notification-item-action"
                on:click={() => notifications.markAsRead(notification.id)}
              >
                标记已读
              </button>
            {/if}
            <button 
              class="notification-item-action notification-item-delete"
              on:click={() => notifications.remove(notification.id)}
            >
              删除
            </button>
          </div>
        </div>
      {:else}
        <div class="notification-empty">
          暂无通知
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .notification-panel {
    position: fixed;
    top: 4rem;
    right: 1rem;
    width: 24rem;
    max-height: 32rem;
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 8px 32px rgba(146, 64, 14, 0.2);
    z-index: 1000;
    overflow: hidden;
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background-color: #FEF3C7;
    border-bottom: 1px solid #FDE68A;
  }

  .notification-title {
    font-size: 1rem;
    font-weight: 600;
    color: #78350F;
    margin: 0;
  }

  .notification-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .notification-action {
    font-size: 0.75rem;
    color: #92400E;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .notification-action:hover {
    background-color: #FDE68A;
  }

  .notification-close {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #92400E;
    cursor: pointer;
    font-size: 1rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .notification-close:hover {
    background-color: #FDE68A;
  }

  .notification-list {
    max-height: 24rem;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .notification-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    background-color: #FEF3C7;
    margin-bottom: 0.5rem;
    transition: background-color 0.2s;
  }

  .notification-item:hover {
    background-color: #FDE68A;
  }

  .notification-unread {
    background-color: #FDE68A;
    border-left: 3px solid #F59E0B;
  }

  .notification-icon {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 1rem;
  }

  .notification-icon-alert {
    background-color: #FEE2E2;
  }

  .notification-icon-success {
    background-color: #D1FAE5;
  }

  .notification-icon-info {
    background-color: #DBEAFE;
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-item-title {
    font-weight: 600;
    color: #78350F;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .notification-item-text {
    color: #92400E;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
    line-height: 1.4;
  }

  .notification-item-time {
    font-size: 0.625rem;
    color: #B45309;
  }

  .notification-item-actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-end;
  }

  .notification-item-action {
    font-size: 0.625rem;
    color: #92400E;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .notification-item-action:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .notification-item-delete {
    color: #DC2626;
  }

  .notification-empty {
    text-align: center;
    color: #92400E;
    padding: 2rem;
    font-size: 0.875rem;
  }
</style>