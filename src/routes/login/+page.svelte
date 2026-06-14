<script>
  import { goto } from '$app/navigation';
  import { login } from '$lib/api.js';
  import { user } from '$lib/stores.js';

  let username = '';
  let password = '';
  let loading = false;
  let error = '';

  const demoAccounts = [
    { username: 'acceptor01', password: 'demo123', role: '受理员', name: '张受理' },
    { username: 'appraiser01', password: 'demo123', role: '鉴定人', name: '李鉴定' },
    { username: 'quality01', password: 'demo123', role: '质控审核', name: '赵质控' },
    { username: 'admin', password: 'admin123', role: '管理员', name: '系统管理员' }
  ];

  async function handleLogin() {
    if (!username || !password) {
      error = '请输入用户名和密码';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await login(username, password);
      
      if (result.success) {
        user.set(result.user);
        goto('/');
      } else {
        error = result.message;
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function quickLogin(demo) {
    username = demo.username;
    password = demo.password;
    handleLogin();
  }
</script>

<div class="login-container">
  <div class="login-box">
    <div class="login-header">
      <h1>🔬 司法鉴定所</h1>
      <p>样本接收与流转留痕系统</p>
    </div>

    <form on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          type="text"
          bind:value={username}
          placeholder="请输入用户名"
          disabled={loading}
        />
      </div>

      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="请输入密码"
          disabled={loading}
        />
      </div>

      <button type="submit" class="login-btn" disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>

    <div class="demo-section">
      <h3>🎭 演示账号快速登录</h3>
      <div class="demo-accounts">
        {#each demoAccounts as demo}
          <button 
            class="demo-btn"
            on:click={() => quickLogin(demo)}
            disabled={loading}
          >
            <span class="demo-name">{demo.name}</span>
            <span class="demo-role">{demo.role}</span>
          </button>
        {/each}
      </div>
      <p class="demo-hint">演示账号密码均为：demo123（管理员为 admin123）</p>
    </div>
  </div>

  <div class="login-footer">
    <p>系统演示版本 · 演示数据仅供参考</p>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    min-height: 100vh;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .login-box {
    background: white;
    border-radius: 16px;
    padding: 2.5rem;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-header h1 {
    margin: 0;
    font-size: 1.8rem;
    color: #1a1a2e;
  }

  .login-header p {
    margin: 0.5rem 0 0 0;
    color: #666;
  }

  .error-message {
    background: #FEF0F0;
    color: #F56C6C;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 600;
    font-size: 0.9rem;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
    transition: all 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #409EFF;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
  }

  input:disabled {
    background: #f5f5f5;
  }

  .login-btn {
    width: 100%;
    padding: 0.9rem;
    background: linear-gradient(135deg, #409EFF 0%, #66B1FF 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }

  .demo-section h3 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    color: #666;
    text-align: center;
  }

  .demo-accounts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .demo-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: #f5f7fa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .demo-btn:hover:not(:disabled) {
    background: #ecf5ff;
    border-color: #409EFF;
    transform: translateY(-2px);
  }

  .demo-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-name {
    font-weight: 600;
    color: #1a1a2e;
    font-size: 0.9rem;
  }

  .demo-role {
    color: #999;
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .demo-hint {
    text-align: center;
    font-size: 0.8rem;
    color: #999;
    margin-top: 1rem;
  }

  .login-footer {
    margin-top: 2rem;
    color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
  }

  @media (max-width: 480px) {
    .login-box {
      padding: 1.5rem;
    }

    .demo-accounts {
      grid-template-columns: 1fr;
    }
  }
</style>
