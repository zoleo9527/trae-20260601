<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/user';
  
  let username = '';
  let password = '';
  let selectedRole = 'EXAM_OFFICER';
  let error = '';
  let loading = false;
  
  const roles = [
    { value: 'EXAM_OFFICER', label: '考务专员', description: '负责监考安排、处理异常情况' },
    { value: 'INVIGILATOR', label: '监考老师', description: '执行监考任务、确认签到' },
    { value: 'TECH_SUPPORT', label: '技术支持', description: '处理系统异常、数据维护' }
  ];
  
  async function handleLogin() {
    error = '';
    loading = true;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: selectedRole })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser.set(data.user);
        goto('/');
      } else {
        error = data.error || '登录失败';
      }
    } catch (e) {
      error = '网络错误，请稍后重试';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 to-primary-700">
  <div class="w-full max-w-md">
    <div class="bg-white rounded-lg shadow-xl p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary mb-2">考务中心</h1>
        <p class="text-gray-600">监考安排与签到确认系统</p>
      </div>
      
      <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <input 
            type="text" 
            bind:value={username}
            class="input"
            placeholder="请输入用户名"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <input 
            type="password" 
            bind:value={password}
            class="input"
            placeholder="请输入密码"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">登录角色</label>
          <div class="space-y-2">
            {#each roles as role}
              <button 
                type="button"
                onclick={() => selectedRole = role.value}
                class="w-full p-4 rounded-md border-2 transition-all text-left {selectedRole === role.value ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-gray-300'}"
              >
                <div class="font-medium {selectedRole === role.value ? 'text-primary' : 'text-gray-800'}">{role.label}</div>
                <div class="text-sm text-gray-500 mt-1">{role.description}</div>
              </button>
            {/each}
          </div>
        </div>
        
        {#if error}
          <div class="text-danger text-sm text-center">{error}</div>
        {/if}
        
        <button 
          type="submit" 
          disabled={loading}
          class="w-full btn btn-primary py-3 {loading ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      
      <div class="mt-6 text-center text-sm text-gray-500">
        <p>测试账号：任意用户名 / 密码：123456</p>
      </div>
    </div>
  </div>
</div>