<script>
  import { page } from '$app/stores';
  import { currentRole } from '$lib/stores';
</script>

<nav class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
      <span class="brand-icon">⛽</span>
      <span class="brand-text">加油站运营管理系统</span>
    </div>
    <div class="nav-menu">
      <a href="/" class="nav-link {($page.url.pathname === '/') ? 'active' : ''}">
        工作台
      </a>
      <a href="/oil-intake" class="nav-link {($page.url.pathname.startsWith('/oil-intake')) ? 'active' : ''}">
        油品入库与罐存校验
      </a>
      <a href="/records" class="nav-link {($page.url.pathname.startsWith('/records')) ? 'active' : ''}">
        历史记录
      </a>
    </div>
    <div class="nav-role">
      <span class="role-badge role-{$currentRole}">
        {$currentRole === 'manager' ? '👨‍💼 站长' : $currentRole === 'cashier' ? '👩‍💳 收银员' : '👨‍🔬 计量员'}
      </span>
      <select bind:value={$currentRole} class="role-select">
        <option value="manager">切换为站长</option>
        <option value="cashier">切换为收银员</option>
        <option value="measurer">切换为计量员</option>
      </select>
    </div>
  </div>
</nav>

<main>
  <slot />
</main>

<style>
  .navbar {
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .brand-icon {
    font-size: 24px;
  }
  
  .nav-menu {
    display: flex;
    gap: 8px;
  }
  
  .nav-link {
    padding: 8px 16px;
    border-radius: 6px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s;
  }
  
  .nav-link:hover {
    background: var(--bg-light);
    color: var(--text-primary);
  }
  
  .nav-link.active {
    background: var(--primary-light);
    color: var(--primary);
    font-weight: 500;
  }
  
  .nav-role {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .role-select {
    padding: 6px 10px;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 13px;
    background: white;
    cursor: pointer;
  }
  
  main {
    min-height: calc(100vh - 60px);
  }
</style>
