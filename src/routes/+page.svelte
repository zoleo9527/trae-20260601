<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { TodoItem, Booking, UserRole } from '$lib/types';
  
  let todos: TodoItem[] = $state([]);
  let bookings: Booking[] = $state([]);
  let loading = $state(true);
  
  let currentRole = $state<UserRole>('admin');
  
  const roleNames: Record<UserRole, string> = {
    booking_clerk: '预订员',
    floor_manager: '楼面经理',
    bar_staff: '吧台',
    admin: '管理员'
  };
  
  const roleDescriptions: Record<UserRole, string> = {
    booking_clerk: '负责预订录入、信息补录、预订确认',
    floor_manager: '负责包厢安排、到店确认、问题处理',
    bar_staff: '负责酒水订单、会员充值、结账收款',
    admin: '系统管理员，可查看所有角色待办和数据'
  };
  
  const todoTypeNames: Record<string, string> = {
    booking: '预订确认',
    checkin: '到店接待',
    drink: '酒水配送',
    recharge: '会员充值',
    issue: '问题处理',
    supplement: '信息补录',
    review: '结账准备'
  };
  
  const statusNames: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    arrived: '已到达',
    in_use: '使用中',
    completed: '已完成',
    cancelled: '已取消',
    rejected: '已驳回',
    supplement_required: '待补录'
  };
  
  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      default: return 'gray';
    }
  }
  
  function getRoleTodos(role: UserRole) {
    return todos.filter(t => t.role === role || role === 'admin');
  }
  
  function getIssueTypeName(type: string) {
    const names: Record<string, string> = {
      booking_rejection: '预订驳回',
      checkin_rejection: '到店驳回',
      drink_issue: '酒水问题',
      member_issue: '会员问题',
      room_issue: '包厢问题'
    };
    return names[type] || type;
  }
  
  function getQuickActions(role: UserRole) {
    const actions: { label: string; icon: string; href: string; role: UserRole[]; count?: number }[] = [
      { label: '新建预订', icon: '+', href: '/bookings', role: ['booking_clerk', 'admin'] },
      { label: '待补录信息', icon: '⚠️', href: '/bookings?status=supplement_required', role: ['booking_clerk', 'admin'], count: bookings.filter(b => b.status === 'supplement_required').length },
      { label: '待确认预订', icon: '✓', href: '/bookings?status=pending', role: ['floor_manager', 'admin'], count: bookings.filter(b => b.status === 'pending').length },
      { label: '待到店确认', icon: '📍', href: '/bookings?status=confirmed', role: ['floor_manager', 'admin'], count: bookings.filter(b => b.status === 'confirmed' || b.status === 'arrived').length },
      { label: '待配送酒水', icon: '🍺', href: '/bookings?status=in_use', role: ['bar_staff', 'admin'], count: bookings.filter(b => b.status === 'in_use').length },
      { label: '待处理问题', icon: '🔴', href: '/bookings?hasIssue=true', role: ['floor_manager', 'bar_staff', 'booking_clerk', 'admin'], count: bookings.filter(b => b.issues.some(i => i.status === 'open')).length },
    ];
    return actions.filter(a => a.role.includes(role));
  }
  
  async function loadData() {
    loading = true;
    try {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select?.value) {
        currentRole = select.value as UserRole;
      }
      
      const [todosRes, bookingsRes] = await Promise.all([
        fetch(`/api/todos?role=${currentRole}`),
        fetch('/api/bookings')
      ]);
      
      todos = await todosRes.json();
      bookings = await bookingsRes.json();
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    loadData();
    
    const observer = new MutationObserver(() => {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select && select.value !== currentRole) {
        currentRole = select.value as UserRole;
        loadData();
      }
    });
    
    observer.observe(document.body, { subtree: true, childList: true });
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">
        {roleNames[currentRole]}工作台
      </h2>
      <p class="text-gray-500 mt-1">{roleDescriptions[currentRole]}</p>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">今日</span>
      <span class="text-sm font-medium text-gray-700">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else}
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="card p-4 bg-blue-50 border-blue-200">
        <div class="text-3xl font-bold text-blue-600">{bookings.filter(r => r.status === 'pending').length}</div>
        <div class="text-sm text-blue-600 mt-1 font-medium">待确认</div>
      </div>
      <div class="card p-4 bg-orange-50 border-orange-200">
        <div class="text-3xl font-bold text-orange-600">{bookings.filter(r => r.status === 'supplement_required').length}</div>
        <div class="text-sm text-orange-600 mt-1 font-medium">待补录</div>
      </div>
      <div class="card p-4 bg-purple-50 border-purple-200">
        <div class="text-3xl font-bold text-purple-600">{bookings.filter(r => r.status === 'confirmed' || r.status === 'arrived').length}</div>
        <div class="text-sm text-purple-600 mt-1 font-medium">待到店</div>
      </div>
      <div class="card p-4 bg-green-50 border-green-200">
        <div class="text-3xl font-bold text-green-600">{bookings.filter(r => r.status === 'in_use').length}</div>
        <div class="text-sm text-green-600 mt-1 font-medium">使用中</div>
      </div>
      <div class="card p-4 bg-red-50 border-red-200">
        <div class="text-3xl font-bold text-red-600">{bookings.filter(r => r.issues.some(i => i.status === 'open')).length}</div>
        <div class="text-sm text-red-600 mt-1 font-medium">风险项</div>
      </div>
      <div class="card p-4 bg-gray-50 border-gray-200">
        <div class="text-3xl font-bold text-gray-600">{bookings.filter(r => r.status === 'completed').length}</div>
        <div class="text-sm text-gray-600 mt-1 font-medium">已完成</div>
      </div>
    </div>

    <div class="card">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">快捷处理入口</h3>
      </div>
      <div class="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {#each getQuickActions(currentRole) as action}
          <button 
            class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            onclick={() => goto(action.href)}
          >
            <div class="text-2xl mb-2">{action.icon}</div>
            <div class="font-medium text-gray-800 text-sm">{action.label}</div>
            {#if action.count !== undefined && action.count > 0}
              <div class="mt-1">
                <span class="badge badge-danger text-xs">{action.count} 项待处理</span>
              </div>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    {#if currentRole === 'admin'}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each (['booking_clerk', 'floor_manager', 'bar_staff'] as UserRole[]).map(role => ({ role, todos: getRoleTodos(role) }))}
          <div class="card">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">{roleNames[role]}</h3>
              <span class="text-xs text-gray-500">{todos.length} 项待办</span>
            </div>
            <div class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {#each todos.slice(0, 6) as todo}
                <button 
                  class="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  onclick={() => goto(`/bookings/${todo.bookingId}`)}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-800 text-sm">
                        <span class="badge badge-{todo.type === 'issue' ? 'danger' : todo.type === 'supplement' ? 'warning' : 'info'} mr-2 text-xs">
                          {todoTypeNames[todo.type]}
                        </span>
                      </div>
                      <div class="text-sm text-gray-700 mt-1">{todo.title}</div>
                      <div class="text-xs text-gray-500 mt-1 truncate">{todo.description}</div>
                    </div>
                    <span class="badge badge-{getPriorityColor(todo.priority)} text-xs flex-shrink-0">
                      {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </button>
              {:else}
                <div class="p-6 text-center text-gray-400 text-sm">暂无待办</div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 card">
          <div class="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="font-semibold text-gray-800">我的待处理</h3>
            <span class="text-xs text-gray-500">{getRoleTodos(currentRole).length} 项</span>
          </div>
          <div class="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {#each getRoleTodos(currentRole) as todo}
              <button 
                class="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                onclick={() => goto(`/bookings/${todo.bookingId}`)}
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="badge badge-{todo.type === 'issue' ? 'danger' : todo.type === 'supplement' ? 'warning' : todo.type === 'review' ? 'success' : 'info'}">
                        {todoTypeNames[todo.type]}
                      </span>
                      <span class="font-medium text-gray-800">{todo.title}</span>
                    </div>
                    <div class="text-sm text-gray-500 mt-2">{todo.description}</div>
                    {#if todo.issueType}
                      <div class="text-xs text-red-500 mt-2">
                        ⚠️ 风险类型：{getIssueTypeName(todo.issueType)}
                      </div>
                    {/if}
                  </div>
                  <span class="badge badge-{getPriorityColor(todo.priority)} flex-shrink-0">
                    {todo.priority === 'high' ? '高优先级' : todo.priority === 'medium' ? '中优先级' : '低优先级'}
                  </span>
                </div>
              </button>
            {:else}
              <div class="p-12 text-center text-gray-400">
                <div class="text-4xl mb-3">🎉</div>
                <div>暂无待处理事项</div>
              </div>
            {/each}
          </div>
        </div>

        <div class="space-y-6">
          <div class="card border-red-200 bg-red-50">
            <div class="p-4 border-b border-red-200">
              <h3 class="font-semibold text-red-800 flex items-center gap-2">
                <span>🔴</span> 风险预警
              </h3>
            </div>
            <div class="divide-y divide-red-200 max-h-60 overflow-y-auto">
              {#each bookings.filter(b => b.issues.some(i => i.status === 'open')).slice(0, 5) as booking}
                <button 
                  class="w-full p-3 text-left hover:bg-red-100 transition-colors"
                  onclick={() => goto(`/bookings/${booking.id}`)}
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-gray-800 text-sm">{booking.customerName} - {booking.roomNo}</div>
                      <div class="text-xs text-red-600 mt-1">
                        {booking.issues.filter(i => i.status === 'open').length} 个问题待处理
                      </div>
                    </div>
                    <span class="badge badge-danger">!</span>
                  </div>
                </button>
              {:else}
                <div class="p-6 text-center text-red-400 text-sm">
                  暂无风险项
                </div>
              {/each}
            </div>
          </div>

          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <span>📋</span> 最近变更
              </h3>
            </div>
            <div class="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {#each bookings.slice(0, 6) as booking}
                <button 
                  class="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  onclick={() => goto(`/bookings/${booking.id}`)}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-800 text-sm">{booking.customerName} - {booking.roomNo}</span>
                      </div>
                      <div class="text-xs text-gray-500 mt-1 font-mono">{booking.bookingNo.slice(-8)}</div>
                      {#if booking.lastSupplementSummary}
                        <div class="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-1 rounded inline-block">
                          📝 {booking.lastSupplementSummary}
                        </div>
                      {/if}
                    </div>
                    <span class="badge badge-{booking.status === 'rejected' ? 'danger' : booking.status === 'supplement_required' ? 'warning' : booking.status === 'completed' ? 'success' : 'info'} text-xs flex-shrink-0 mt-0.5">
                      {statusNames[booking.status]}
                    </span>
                  </div>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
