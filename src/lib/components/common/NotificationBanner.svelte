<script lang="ts">
  import { fly } from 'svelte/transition';
  import { notifications, unreadCount } from '$lib/stores/notifications';
  
  export let visible = false;
</script>

{#if $unreadCount > 0 && visible}
  <div 
    class="notification-banner"
    transition:fly={{ y: -20, duration: 300 }}
  >
    <div class="notification-banner-content">
      <span class="notification-banner-icon">🔔</span>
      <span class="notification-banner-text">
        您有 {$unreadCount} 条未读通知
      </span>
    </div>
    <button 
      class="notification-banner-close"
      on:click={() => visible = false}
    >
      ✕
    </button>
  </div>
{/if}

<style>
  .notification-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #F59E0B;
    color: white;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
    z-index: 999;
  }

  .notification-banner-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .notification-banner-icon {
    font-size: 1.25rem;
  }

  .notification-banner-text {
    font-weight: 500;
  }

  .notification-banner-close {
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .notification-banner-close:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
</style>