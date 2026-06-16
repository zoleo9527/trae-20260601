<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, fetchCurrentUser, loginUser } from '$lib/store';
  import { User, Lock, BarChart3, Music, Calendar, Wine, FileText } from 'lucide-svelte';

  let username = '';
  let password = '';
  let error = '';

  onMount(() => {
    fetchCurrentUser();
  });

  async function handleLogin() {
    error = '';
    if (!username || !password) {
      error = '请输入用户名和密码';
      return;
    }
    
    const success = await loginUser(username, password);
    if (!success) {
      error = '用户名或密码错误';
    }
  }

  function handleLogout() {
    window.location.href = '/logout';
  }
</script>

{#if !$currentUser}
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl">
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white">酒吧运营系统</h1>
        <p class="text-gray-300 mt-2">演出排班与嘉宾名单管理</p>
      </div>

      <form on:submit|preventDefault={handleLogin} class="space-y-6">
        <div>
          <label class="block text-white/80 text-sm font-medium mb-2">用户名</label>
          <div class="relative">
            <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              bind:value={username}
              type="text"
              placeholder="请输入用户名"
              class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-white/80 text-sm font-medium mb-2">密码</label>
          <div class="relative">
            <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              bind:value={password}
              type="password"
              placeholder="请输入密码"
              class="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {#if error}
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        {/if}

        <button
          type="submit"
          class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          登录
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-gray-400 text-sm">默认账号: admin / admin123</p>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <BarChart3 class="w-6 h-6 text-white" />
            </div>
            <span class="text-xl font-bold text-gray-800">酒吧运营系统</span>
          </div>

          <div class="flex items-center space-x-6">
            <a href="/guests" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <Music class="w-5 h-5" />
              <span>嘉宾名单</span>
            </a>
            <a href="/performances" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <Calendar class="w-5 h-5" />
              <span>演出排班</span>
            </a>
            <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <BarChart3 class="w-5 h-5" />
              <span>订台记录</span>
            </a>
            <a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <Wine class="w-5 h-5" />
              <span>酒水寄存</span>
            </a>
            <a href="/logs" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <FileText class="w-5 h-5" />
              <span>操作日志</span>
            </a>
            <button
              on:click={handleLogout}
              class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <User class="w-4 h-4" />
              <span>{$currentUser.username}</span>
              <span class="text-gray-400">退出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">今日演出</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar class="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">嘉宾数量</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <Music class="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">今日订台</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">寄存酒水</p>
              <p class="text-3xl font-bold text-gray-800 mt-2">0</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Wine class="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">快速操作</h2>
        <div class="grid grid-cols-4 gap-4">
          <a href="/guests/new" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Music class="w-8 h-8 text-purple-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">添加嘉宾</span>
          </a>
          <a href="/performances/new" class="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
            <Calendar class="w-8 h-8 text-pink-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">安排演出</span>
          </a>
          <a href="/reservations/new" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <BarChart3 class="w-8 h-8 text-blue-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">新增订台</span>
          </a>
          <a href="/wine-storage/new" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Wine class="w-8 h-8 text-green-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">寄存酒水</span>
          </a>
        </div>
      </div>
    </main>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
