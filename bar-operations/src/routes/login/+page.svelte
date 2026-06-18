<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();

  let selectedUserId = $state('');
  let error = $state('');

  if (data.user) {
    goto('/');
  }

  const roleLabels: Record<string, string> = {
    exhibitor: '展教员',
    engineer: '设备工程师',
    teacher: '活动老师',
    admin: '管理员'
  };

  function handleLogin() {
    if (!selectedUserId) {
      error = '请选择用户';
      return;
    }

    document.cookie = `user_id=${selectedUserId}; path=/; max-age=86400`;
    goto('/');
  }
</script>

<div class="login-container">
  <div class="login-box">
    <h1 class="login-title">科技馆展教管理系统</h1>
    <p class="login-subtitle">请选择用户登录</p>

    <div class="user-list">
      {#each data.users as user}
        <button
          class="user-card"
          class:selected={selectedUserId === user.id}
          onclick={() => { selectedUserId = user.id; error = ''; }}
        >
          <div class="user-avatar">{user.name[0]}</div>
          <div class="user-details">
            <div class="user-name">{user.name}</div>
            <div class="user-role">{roleLabels[user.role]}</div>
          </div>
        </button>
      {/each}
    </div>

    {#if error}
      <p class="error-message">{error}</p>
    {/if}

    <button class="login-btn" onclick={handleLogin}>登录</button>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem;
  }

  .login-box {
    background: white;
    padding: 3rem;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 100%;
  }

  .login-title {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    color: #1a202c;
    text-align: center;
  }

  .login-subtitle {
    margin: 0 0 2rem 0;
    color: #64748b;
    text-align: center;
  }

  .user-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .user-card:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .user-card.selected {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  }

  .user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .user-details {
    flex: 1;
  }

  .user-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1a202c;
  }

  .user-role {
    font-size: 0.875rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .error-message {
    color: #e53e3e;
    text-align: center;
    margin-bottom: 1rem;
  }

  .login-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  .login-btn:active {
    transform: translateY(0);
  }
</style>
