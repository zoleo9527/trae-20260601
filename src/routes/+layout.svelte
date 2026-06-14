<script>
  import { user } from '$lib/stores.js';
  import { onMount } from 'svelte';
  import Navbar from '$lib/components/Navbar.svelte';
  import { notifications } from '$lib/stores.js';

  export let data;

  onMount(() => {
    if (data.user) {
      user.set(data.user);
    }
  });

  $: if (data.user) {
    user.set(data.user);
  }
</script>

<div class="app-wrapper">
  <Navbar />
  <slot />
</div>

{#if $notifications.length > 0}
  <div class="notifications-container">
    {#each $notifications as notif}
      <div class="notification {notif.type}">
        <strong>{notif.title}</strong>
        <p>{notif.message}</p>
      </div>
    {/each}
  </div>
{/if}

<style>
  .app-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .notifications-container {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 350px;
  }

  .notification {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  }

  .notification.success {
    border-left: 4px solid #67C23A;
    background: #F0F9EB;
  }

  .notification.warning {
    border-left: 4px solid #E6A23C;
    background: #FDF6EC;
  }

  .notification.urgent {
    border-left: 4px solid #F56C6C;
    background: #FEF0F0;
  }

  .notification.error {
    border-left: 4px solid #F56C6C;
    background: #FEF0F0;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
</style>