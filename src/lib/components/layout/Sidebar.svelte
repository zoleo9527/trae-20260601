<script lang="ts">
  import { page } from '$app/stores';
  
  const menuItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/bookings', label: '包间预订', icon: '📅' },
    { path: '/procurement', label: '食材采购', icon: '🥬' },
    { path: '/accommodation', label: '住宿登记', icon: '🛏️' },
    { path: '/inventory', label: '库存预估', icon: '📦' },
    { path: '/alerts', label: '异常提醒', icon: '⚠️' }
  ];
</script>

<nav class="sidebar">
  <div class="sidebar-menu">
    {#each menuItems as item}
      <a 
        href={item.path}
        class="sidebar-item"
        class:sidebar-item-active={$page.url.pathname === item.path}
      >
        <span class="sidebar-icon">{item.icon}</span>
        <span class="sidebar-label">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>

<style>
  .sidebar {
    background-color: white;
    width: 200px;
    min-height: calc(100vh - 4rem);
    box-shadow: 2px 0 8px rgba(146, 64, 14, 0.1);
    padding: 1rem 0;
  }

  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sidebar-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: #92400E;
    text-decoration: none;
    transition: all 0.2s;
    border-radius: 0.5rem;
    margin: 0 0.5rem;
  }

  .sidebar-item:hover {
    background-color: #FEF3C7;
    color: #78350F;
  }

  .sidebar-item-active {
    background-color: #FDE68A;
    color: #78350F;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
  }

  .sidebar-icon {
    font-size: 1.25rem;
  }

  .sidebar-label {
    font-size: 0.875rem;
  }
</style>