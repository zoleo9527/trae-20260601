<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { getUserFromStorage, removeUserFromStorage } from '$lib/database'
  import { User, Home, BedDouble, ChefHat, ClipboardList, Settings, LogOut } from 'lucide-svelte'

  let currentUser: any = null
  let isLoggedIn = false

  const navItems = [
    { name: '首页', href: '/', icon: Home },
    { name: '住宿管理', href: '/rooms', icon: BedDouble },
    { name: '订单管理', href: '/orders', icon: ClipboardList },
    { name: '食材库存', href: '/inventory', icon: ChefHat },
    { name: '系统设置', href: '/settings', icon: Settings }
  ]

  const roleLabels: Record<string, string> = {
    boss: '老板',
    chef: '后厨',
    housekeeper: '客房阿姨',
    staff: '员工'
  }

  function handleLogout() {
    removeUserFromStorage()
    isLoggedIn = false
    currentUser = null
    goto('/login')
  }

  function handleNavClick(path: string) {
    goto(path)
  }

  onMount(() => {
    currentUser = getUserFromStorage()
    isLoggedIn = currentUser !== null
    
    if (!isLoggedIn && $page.url.pathname !== '/login') {
      goto('/login')
    }
  })
</script>

{#if isLoggedIn && $page.url.pathname !== '/login'}
  <nav class="navbar">
    <div class="nav-brand">
      <span class="logo">🏡 农家乐管理系统</span>
    </div>
    <div class="nav-menu">
      {#each navItems as item}
        <a 
          href={item.href} 
          class="nav-item {$page.url.pathname === item.href ? 'active' : ''}"
          on:click|preventDefault={() => handleNavClick(item.href)}
        >
          <svelte:component this={item.icon} class="nav-icon" />
          <span>{item.name}</span>
        </a>
      {/each}
    </div>
    <div class="nav-user">
      <div class="user-info">
        <span class="user-role">{roleLabels[currentUser?.role] || '员工'}</span>
        <span class="user-name">{currentUser?.username || 'guest'}</span>
      </div>
      <button class="logout-btn" on:click={handleLogout}>
        <LogOut class="logout-icon" />
      </button>
    </div>
  </nav>
{/if}

<main class:login-page={!isLoggedIn || $page.url.pathname === '/login'}>
  <slot />
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
  }

  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
    color: white;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .nav-brand .logo {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .nav-menu {
    display: flex;
    gap: 2rem;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: white;
    transition: all 0.3s;
  }
  
  .nav-item:hover, .nav-item.active {
    background: rgba(255,255,255,0.2);
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
  
  .nav-user {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.15);
    border-radius: 20px;
  }
  
  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  
  .user-role {
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 0.9rem;
  }
  
  .logout-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 4px;
    transition: all 0.3s;
  }
  
  .logout-btn:hover {
    background: rgba(255,255,255,0.2);
  }
  
  .logout-icon {
    width: 18px;
    height: 18px;
    color: white;
  }
  
  main {
    min-height: calc(100vh - 72px);
    padding: 2rem;
  }

  main.login-page {
    min-height: 100vh;
    padding: 0;
  }
</style>