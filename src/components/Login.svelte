<script lang="ts">
  import { reactive } from 'svelte';

  const emit = defineEmits<{
    login: [username: string, password: string];
  }>();

  const form = reactive({
    username: '',
    password: ''
  });

  const roles = [
    { value: 'front', label: '前台', username: 'front', password: '123456' },
    { value: 'tech', label: '技师', username: 'tech', password: '123456' },
    { value: 'manager', label: '店长', username: 'manager', password: '123456' }
  ];

  function selectRole(role: typeof roles[0]) {
    form.username = role.username;
    form.password = role.password;
  }

  function handleSubmit() {
    if (form.username && form.password) {
      emit('login', form.username, form.password);
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>轮胎门店管理系统</h1>
    <p class="subtitle">动平衡记录与质检交车系统</p>
    
    <div class="role-selector">
      <h3>选择角色</h3>
      <div class="role-buttons">
        {#each roles as role}
          <button 
            class="role-btn" 
            on:click={() => selectRole(role)}
            class:active={form.username === role.username}
          >
            {role.label}
          </button>
        {/each}
      </div>
    </div>

    <form on:submit|preventDefault={handleSubmit} class="login-form">
      <div class="form-group">
        <label>用户名</label>
        <input 
          type="text" 
          bind:value={form.username} 
          placeholder="请输入用户名"
        />
      </div>
      <div class="form-group">
        <label>密码</label>
        <input 
          type="password" 
          bind:value={form.password} 
          placeholder="请输入密码"
        />
      </div>
      <button type="submit" class="btn btn-primary btn-block">登录</button>
    </form>

    <div class="demo-info">
      <p>演示账号：</p>
      <ul>
        <li>前台: front / 123456</li>
        <li>技师: tech / 123456</li>
        <li>店长: manager / 123456</li>
      </ul>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .login-card {
    background: white;
    border-radius: 16px;
    padding: 40px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .login-card h1 {
    text-align: center;
    color: #1e293b;
    margin-bottom: 8px;
  }

  .subtitle {
    text-align: center;
    color: #64748b;
    margin-bottom: 24px;
  }

  .role-selector h3 {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 12px;
    text-align: center;
  }

  .role-buttons {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }

  .role-btn {
    flex: 1;
    padding: 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .role-btn:hover {
    border-color: #2563eb;
    color: #2563eb;
  }

  .role-btn.active {
    border-color: #2563eb;
    background: #eff6ff;
    color: #2563eb;
  }

  .login-form {
    margin-bottom: 24px;
  }

  .btn-block {
    width: 100%;
    padding: 12px;
    font-size: 16px;
  }

  .demo-info {
    background: #f8fafc;
    border-radius: 8px;
    padding: 16px;
    font-size: 12px;
    color: #64748b;
  }

  .demo-info p {
    margin-bottom: 8px;
    font-weight: 500;
  }

  .demo-info ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .demo-info li {
    margin-bottom: 4px;
  }
</style>
