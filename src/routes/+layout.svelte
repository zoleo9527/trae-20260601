<script>
  import RoleSelector from '$lib/components/RoleSelector.svelte';
  import { currentUser } from '$lib/stores.js';
</script>

<div class="app">
  <header class="app-header">
    <div class="header-inner">
      <div class="logo">
        <div class="logo-icon">🔥</div>
        <div class="logo-text">
          <h1>消防维保管理系统</h1>
          <p>维保报告 · 状态流转 · 客户签收</p>
        </div>
      </div>
      <div class="header-right">
        <div class="current-user">
          <span class="user-role">{$currentUser.roleLabel}</span>
          <span class="user-name">{$currentUser.name}</span>
        </div>
      </div>
    </div>
    <RoleSelector />
  </header>

  <main class="app-main">
    <slot />
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    background: #f1f5f9;
  }

  .app-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 32px;
  }

  .logo-text h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
  }

  .logo-text p {
    margin: 2px 0 0;
    font-size: 12px;
    color: #64748b;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .current-user {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .user-role {
    font-size: 11px;
    color: #64748b;
  }

  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
  }

  .app-main {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }
</style>
