<script lang="ts">
  import { BarChart3, Music, Calendar, Wine, FileText, User } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  function handleLogout() {
    window.location.href = '/logout';
  }
</script>

{#if !user}
  <slot />
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <a href="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <BarChart3 class="w-6 h-6 text-white" />
              </div>
              <span class="text-xl font-bold text-gray-800">酒吧运营系统</span>
            </a>
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
              <span>{user.username}</span>
              <span class="text-gray-400">退出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
</style>
