<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let { children } = $props();
  
  let currentRole = $state<'booking_clerk' | 'floor_manager' | 'bar_staff' | 'admin'>('admin');
  
  const roleNames: Record<string, string> = {
    booking_clerk: '预订员',
    floor_manager: '楼面经理',
    bar_staff: '吧台',
    admin: '管理员'
  };
  
  function handleRoleChange() {
    const select = document.querySelector('header select') as HTMLSelectElement;
    if (select) {
      currentRole = select.value as any;
      goto($page.url.pathname + $page.url.search);
    }
  }
</script>

<div class="min-h-screen flex flex-col">
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">K</span>
        </div>
        <h1 class="text-xl font-bold text-gray-800">KTV包厢管理系统</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500">角色切换：</span>
          <select 
            class="select text-sm" 
            style="width: auto"
            bind:value={currentRole}
            onchange={handleRoleChange}
          >
            <option value="admin">管理员</option>
            <option value="booking_clerk">预订员</option>
            <option value="floor_manager">楼面经理</option>
            <option value="bar_staff">吧台</option>
          </select>
        </div>
      </div>
    </div>
    
    <nav class="bg-gray-50 border-t border-gray-100">
      <div class="max-w-7xl mx-auto px-4 flex gap-1">
        <a 
          href="/" 
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white"
          class:bg-white={$page.url.pathname === '/'}
          class:text-blue-600={$page.url.pathname === '/'}
        >
          仪表盘
        </a>
        <a 
          href="/bookings" 
          class="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-white"
          class:bg-white={$page.url.pathname.startsWith('/bookings')}
          class:text-blue-600={$page.url.pathname.startsWith('/bookings')}
        >
          包厢预订
        </a>
      </div>
    </nav>
  </header>
  
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
    {@render children?.()}
  </main>
</div>
