<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { currentUser, getRoleLabel } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  onMount(async () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      currentUser.set(JSON.parse(userStr));
    } else if ($page.url.pathname !== '/login') {
      goto('/login');
    }
  });
  
  async function handleLogout() {
    localStorage.removeItem('user');
    currentUser.set(null);
    goto('/login');
  }
  
  async function handleRoleSwitch(role: string) {
    const user = $currentUser;
    if (user) {
      const updatedUser = { ...user, role };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      currentUser.set(updatedUser);
      window.location.reload();
    }
  }
  
  let showRoleMenu = false;
  
  const menuItems = [
    { path: '/', label: '首页', icon: 'home' },
    { path: '/arrangement', label: '监考安排', roles: ['EXAM_OFFICER'] },
    { path: '/checkin', label: '签到确认', roles: ['INVIGILATOR'] },
    { path: '/checkin/history', label: '签到回看', roles: ['INVIGILATOR', 'EXAM_OFFICER'] },
    { path: '/exam-room', label: '考场管理', roles: ['TECH_SUPPORT', 'EXAM_OFFICER'] },
    { path: '/statistics', label: '数据统计', roles: ['EXAM_OFFICER', 'TECH_SUPPORT'] }
  ];
  
  function canAccess(item: any): boolean {
    if (!item.roles) return true;
    const user = $currentUser;
    return user ? item.roles.includes(user.role) : false;
  }
</script>

{#if $currentUser}
  <div class="flex h-screen">
    <aside class="w-64 bg-primary text-white flex flex-col">
      <div class="p-6 border-b border-primary-700">
        <h1 class="text-xl font-bold">考务中心</h1>
        <p class="text-sm text-primary-300 mt-1">监考安排与签到确认</p>
      </div>
      
      <nav class="flex-1 p-4">
        <ul class="space-y-2">
          {#each menuItems as item}
            {#if canAccess(item)}
              <li>
                <a 
                  href={item.path} 
                  class="block px-4 py-3 rounded-md transition-colors hover:bg-primary-700 {$page.url.pathname === item.path ? 'bg-primary-700' : ''}"
                >
                  {item.label}
                </a>
              </li>
            {/if}
          {/each}
        </ul>
      </nav>
      
      <div class="p-4 border-t border-primary-700">
        <div class="text-sm text-primary-300">版本 1.0.0</div>
      </div>
    </aside>
    
    <div class="flex-1 flex flex-col">
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h2 class="text-lg font-semibold text-gray-800">
            {#each menuItems as item}
              {#if $page.url.pathname === item.path}
                {item.label}
              {/if}
            {/each}
          </h2>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="relative">
            <button 
              class="flex items-center gap-2 px-4 py-2 rounded-md bg-primary-50 text-primary hover:bg-primary-100 transition-colors"
              onclick={() => showRoleMenu = !showRoleMenu}
            >
              <span class="font-medium">{getRoleLabel($currentUser?.role || '')}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {#if showRoleMenu}
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                {#each ['EXAM_OFFICER', 'INVIGILATOR', 'TECH_SUPPORT'] as role}
                  <button 
                    class="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors {$currentUser?.role === role ? 'bg-primary-50 text-primary font-medium' : 'text-gray-700'}"
                    onclick={() => { handleRoleSwitch(role); showRoleMenu = false; }}
                  >
                    {getRoleLabel(role)}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
          
          <div class="flex items-center gap-3">
            <div class="text-sm">
              <div class="font-medium text-gray-800">{ $currentUser?.name }</div>
              <div class="text-gray-500">{ $currentUser?.department }</div>
            </div>
            <button 
              onclick={handleLogout}
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>
      
      <main class="flex-1 p-6 overflow-auto bg-background">
        <slot />
      </main>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-background">
    <slot />
  </div>
{/if}