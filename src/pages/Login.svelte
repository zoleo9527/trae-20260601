<script lang="ts">
  import { login, setUserToStorage } from '$lib/database'
  import { User, Lock, LogIn, Eye, EyeOff } from 'lucide-svelte'
  
  let username = ''
  let password = ''
  let showPassword = false
  let error = ''
  let loading = false
  let quickUsers = [
    { username: 'boss', password: '123456', role: '老板', color: '#4CAF50' },
    { username: 'chef', password: '123456', role: '后厨', color: '#FF9800' },
    { username: 'housekeeper', password: '123456', role: '客房阿姨', color: '#2196F3' },
    { username: 'staff', password: '123456', role: '员工', color: '#9C27B0' }
  ]
  
  async function handleLogin() {
    error = ''
    loading = true
    
    if (!username || !password) {
      error = '请输入用户名和密码'
      loading = false
      return
    }
    
    const result = await login(username, password)
    
    if (!result.success) {
      error = result.message || '登录失败'
      loading = false
      return
    }
    
    if (result.user) {
      setUserToStorage(result.user)
      window.location.href = '/'
    }
    loading = false
  }
  
  async function handleQuickLogin(user: any) {
    username = user.username
    password = user.password
    await handleLogin()
  }
</script>

<div class="login-page">
  <div class="login-container">
    <div class="login-header">
      <div class="logo">🏡</div>
      <h1>农家乐管理系统</h1>
      <p>住宿入住与房态交接管理</p>
    </div>
    
    <div class="quick-login">
      <h3>快捷登录</h3>
      <div class="quick-users">
        {#each quickUsers as user}
          <button 
            class="quick-user-btn"
            style="border-color: {user.color}"
            on:click={() => handleQuickLogin(user)}
            disabled={loading}
          >
            <div class="user-avatar" style="background: {user.color}">
              <User class="avatar-icon" />
            </div>
            <div class="user-info">
              <div class="user-role">{user.role}</div>
              <div class="user-username">{user.username}</div>
            </div>
          </button>
        {/each}
      </div>
    </div>
    
    <div class="login-form">
      <h3>账号登录</h3>
      
      {#if error}
        <div class="error-message">
          {error}
        </div>
      {/if}
      
      <div class="form-group">
        <div class="input-wrapper">
          <User class="input-icon" />
          <input 
            type="text" 
            placeholder="用户名" 
            bind:value={username}
            on:keydown={(e) => e.key === 'Enter' && !loading && handleLogin()}
          />
        </div>
      </div>
      
      <div class="form-group">
        <div class="input-wrapper">
          <Lock class="input-icon" />
          <input 
            type="password" 
            placeholder="密码" 
            bind:value={password}
            on:keydown={(e) => e.key === 'Enter' && !loading && handleLogin()}
            class:hidden={showPassword}
          />
          <input 
            type="text" 
            placeholder="密码" 
            bind:value={password}
            on:keydown={(e) => e.key === 'Enter' && !loading && handleLogin()}
            class:hidden={!showPassword}
          />
          <button class="toggle-password" on:click={() => showPassword = !showPassword}>
            {#if showPassword}
              <EyeOff class="toggle-icon" />
            {:else}
              <Eye class="toggle-icon" />
            {/if}
          </button>
        </div>
      </div>
      
      <button class="login-btn" on:click={handleLogin} disabled={loading}>
        {#if loading}
          <div class="loading-spinner"></div>
        {:else}
          <LogIn class="btn-icon" />
          登录系统
        {/if}
      </button>
    </div>
    
    <div class="login-footer">
      <p>默认密码: 123456</p>
    </div>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
  }
  
  .login-container {
    background: white;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    width: 100%;
    max-width: 420px;
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .login-header h1 {
    font-size: 1.5rem;
    margin: 0 0 0.5rem 0;
    color: #333;
  }
  
  .login-header p {
    color: #666;
    margin: 0;
    font-size: 0.9rem;
  }
  
  .quick-login {
    margin-bottom: 2rem;
  }
  
  .quick-login h3 {
    font-size: 0.95rem;
    color: #666;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f0f0f0;
  }
  
  .quick-users {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .quick-user-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: left;
  }
  
  .quick-user-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  .quick-user-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .avatar-icon {
    width: 20px;
    height: 20px;
    color: white;
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
  }
  
  .user-role {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
  }
  
  .user-username {
    font-size: 0.75rem;
    color: #999;
  }
  
  .login-form {
    margin-bottom: 1.5rem;
  }
  
  .login-form h3 {
    font-size: 0.95rem;
    color: #666;
    margin: 0 0 1rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f0f0f0;
  }
  
  .error-message {
    background: #FFEBEE;
    color: #F44336;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    text-align: center;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .input-wrapper {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 8px;
    padding: 0 1rem;
  }
  
  .input-icon {
    width: 20px;
    height: 20px;
    color: #999;
    margin-right: 0.75rem;
  }
  
  .input-wrapper input {
    flex: 1;
    padding: 0.85rem 0;
    border: none;
    background: transparent;
    font-size: 0.9rem;
    outline: none;
  }
  
  .toggle-password {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
  }
  
  .toggle-icon {
    width: 18px;
    height: 18px;
    color: #999;
  }
  
  .login-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.9rem;
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.3s;
  }
  
  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-icon {
    width: 20px;
    height: 20px;
  }
  
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #fff;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .login-footer {
    text-align: center;
  }
  
  .login-footer p {
    font-size: 0.8rem;
    color: #999;
    margin: 0;
  }
  
  .hidden {
    display: none;
  }
</style>