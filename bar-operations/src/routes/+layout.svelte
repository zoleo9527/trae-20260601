<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let { data, children } = $props();

  const roleLabels: Record<string, string> = {
    exhibitor: '展教员',
    engineer: '设备工程师',
    teacher: '活动老师',
    admin: '管理员'
  };

  async function handleRoleSwitch(event: Event) {
    const select = event.target as HTMLSelectElement;
    const userId = select.value;

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    if (response.ok) {
      document.cookie = `user_id=${userId}; path=/; max-age=86400`;
      window.location.reload();
    }
  }

  function handleLogout() {
    document.cookie = 'user_id=; path=/; max-age=0';
    goto('/login');
  }
</script>

<div class="app">
  {#if data.user}
    <header class="header">
      <div class="header-left">
        <h1 class="app-title">科技馆展教管理系统</h1>
      </div>

      <div class="header-right">
        <div class="user-info">
          <span class="user-name">{data.user.name}</span>
          <span class="user-role">{roleLabels[data.user.role]}</span>
        </div>

        <select class="role-switcher" onchange={handleRoleSwitch} value={data.user.id}>
          <option value="" disabled>切换角色</option>
          {#each data.users as user}
            <option value={user.id}>
              {user.name} - {roleLabels[user.role]}
            </option>
          {/each}
        </select>

        <button class="logout-btn" onclick={handleLogout}>退出</button>
      </div>
    </header>

    <nav class="nav">
      <a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>工作台</a>
      <a href="/exhibits" class="nav-link" class:active={$page.url.pathname.startsWith('/exhibits')}>展项管理</a>
      <a href="/inspection" class="nav-link" class:active={$page.url.pathname === '/inspection'}>展项巡检</a>
      <a href="/fault-reports" class="nav-link" class:active={$page.url.pathname.startsWith('/fault-reports')}>故障报修</a>
      {#if data.user?.role === 'admin'}
        <a href="/admin" class="nav-link" class:active={$page.url.pathname === '/admin'}>系统管理</a>
      {/if}
    </nav>
  {/if}

  <main class="main">
    {@render children()}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: #f5f7fa;
    color: #2c3e50;
  }

  .app {
    min-height: 100vh;
  }

  .header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 2rem;
  }

  .app-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .user-name {
    font-weight: 600;
  }

  .user-role {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .role-switcher {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
  }

  .role-switcher option {
    background: #333;
    color: white;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 6px;
    background: transparent;
    color: white;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: white;
  }

  .nav {
    background: white;
    padding: 0 2rem;
    display: flex;
    gap: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .nav-link {
    padding: 1rem 0;
    text-decoration: none;
    color: #64748b;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .nav-link:hover {
    color: #667eea;
  }

  .nav-link.active {
    color: #667eea;
    border-bottom-color: #667eea;
  }

  .main {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
</style>
