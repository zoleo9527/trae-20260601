<script lang="ts">
  import Header from './Header.svelte';
  import Sidebar from './Sidebar.svelte';
  import NotificationBanner from '$lib/components/common/NotificationBanner.svelte';
  import { unreadCount } from '$lib/stores/notifications';
  
  let showBanner = true;
</script>

<div class="layout">
  <NotificationBanner visible={showBanner && $unreadCount > 0} />
  <Header />
  <div class="layout-body">
    <Sidebar />
    <main class="layout-content">
      <slot />
    </main>
  </div>
</div>

<style>
  .layout {
    min-height: 100vh;
    background-color: #FEF3C7;
  }

  .layout-body {
    display: flex;
    max-width: 1400px;
    margin: 0 auto;
  }

  .layout-content {
    flex: 1;
    padding: 2rem;
    min-height: calc(100vh - 4rem);
    overflow-y: auto;
  }
</style>