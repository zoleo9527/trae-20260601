<script lang="ts">
  import { page } from '$app/stores';
  import { notifications, unreadCount } from '$lib/stores/notifications';
  import NotificationPanel from '$lib/components/common/NotificationPanel.svelte';
  import NotificationBanner from '$lib/components/common/NotificationBanner.svelte';
  
  let showNotifications = false;
  let showBanner = true;
  
  function toggleNotifications() {
    showNotifications = !showNotifications;
  }
</script>

<header class="header">
  <NotificationBanner visible={showBanner} />
  <div class="header-content">
    <div class="header-brand">
      <span class="header-logo">🌾</span>
      <h1 class="header-title">农家乐经营管理系统</h1>
    </div>
    <div class="header-actions">
      <button class="header-notification" on:click={toggleNotifications}>
        <span class="notification-icon">🔔</span>
        {#if $unreadCount > 0}
          <span class="notification-count">{ $unreadCount }</span>
        {/if}
      </button>
      <NotificationPanel show={showNotifications} />
    </div>
  </div>
</header>

<style>
  .header {
    background-color: #92400E;
    color: white;
    padding: 1rem 2rem;
    box-shadow: 0 2px 8px rgba(146, 64, 14, 0.3);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header-brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .header-logo {
    font-size: 2rem;
  }

  .header-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-notification {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: rgba(255, 255, 255, 0.1);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;
    color: white;
  }

  .header-notification:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .notification-icon {
    font-size: 1.25rem;
  }

  .notification-count {
    background-color: #EF4444;
    color: white;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    min-width: 1.5rem;
    text-align: center;
  }
</style>