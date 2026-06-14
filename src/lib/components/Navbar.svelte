<script>
  import { user, notifications } from '$lib/stores.js';
  import { logout, roleLabels } from '$lib/api.js';
  import { goto } from '$app/navigation';

  let showUserMenu = false;

  async function handleLogout() {
    try {
      await logout();
      user.set(null);
      goto('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
</script>

<nav class="navbar">
  <div class="nav-left">
    <h1 class="logo">🔬 司法鉴定所样本管理系统</h1>
  </div>
  
  {#if $user}
    <div class="nav-right">
      <div class="user-info">
        <span class="user-name">{$user.real_name}</span>
        <span class="user-role">{roleLabels[$user.role]}</span>
        {#if $user.is_demo}
          <span class="demo-badge">演示账号</span>
        {/if}
      </div>
      
      <div class="user-menu-wrapper">
        <button class="menu-btn" on:click={() => showUserMenu = !showUserMenu}>
          ☰
        </button>
        
        {#if showUserMenu}
          <div class="dropdown-menu">
            <button on:click={handleLogout}>退出登录</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</nav>

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
  .navbar {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .logo {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .user-name {
    font-weight: 600;
  }

  .user-role {
    background: rgba(255,255,255,0.2);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  .demo-badge {
    background: #E6A23C;
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }

  .menu-btn {
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .menu-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  .user-menu-wrapper {
    position: relative;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background: white;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 120px;
    z-index: 1000;
  }

  .dropdown-menu button {
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    color: #333;
    cursor: pointer;
    text-align: left;
  }

  .dropdown-menu button:hover {
    background: #f5f5f5;
  }

  .notifications-container {
    position: fixed;
    top: 80px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .notification {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 300px;
    animation: slideIn 0.3s ease;
  }

  .notification.urgent {
    border-left: 4px solid #F56C6C;
    background: #FEF0F0;
  }

  .notification.warning {
    border-left: 4px solid #E6A23C;
    background: #FDF6EC;
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
