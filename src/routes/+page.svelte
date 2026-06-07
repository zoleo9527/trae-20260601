<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { TodoItem, Booking } from '$lib/types';
  
  let todos: TodoItem[] = $state([]);
  let bookings: Booking[] = $state([]);
  let loading = $state(true);
  
  let currentRole = $state<'booking_clerk' | 'floor_manager' | 'bar_staff' | 'admin'>('admin');
  
  const roleNames: Record<string, string> = {
    booking_clerk: '预订员',
    floor_manager: '楼面经理',
    bar_staff: '吧台',
    admin: '管理员'
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
  
  function getRoleTodos(role: string) {
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
  
  async function loadData() {
    loading = true;
    try {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select?.value) {
        currentRole = select.value as any;
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
        currentRole = select.value as any;
        loadData();
      }
    });
    
    observer.observe(document.body, { subtree: true, childList: true });
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">仪表盘</h2>
      <p class="text-gray-500 mt-1">当前角色：{roleNames[currentRole]} - 查看今日待办事项</p>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="card p-4">
        <div class="text-3xl font-bold text-blue-600">{bookings.filter(r => r.status === 'pending').length}</div>
        <div class="text-sm text-gray-500 mt-1">待确认</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-orange-600">{bookings.filter(r => r.status === 'supplement_required').length}</div>
        <div class="text-sm text-gray-500 mt-1">待补录</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-purple-600">{bookings.filter(r => r.status === 'confirmed' || r.status === 'arrived').length}</div>
        <div class="text-sm text-gray-500 mt-1">待到店</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-green-600">{bookings.filter(r => r.status === 'in_use').length}</div>
        <div class="text-sm text-gray-500 mt-1">使用中</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-red-600">{bookings.filter(r => r.issues.some(i => i.status === 'open')).length}</div>
        <div class="text-sm text-gray-500 mt-1">待处理问题</div>
      </div>
    </div>

    {#if currentRole === 'admin'}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each ['booking_clerk', 'floor_manager', 'bar_staff'] as role}
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">{roleNames[role]}待办</h3>
            </div>
            <div class="divide-y divide-gray-100">
              {#each getRoleTodos(role).slice(0, 5) as todo}
                <button 
                  class="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  onclick={() => goto(`/bookings/${todo.bookingId}`)}
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="font-medium text-gray-800 text-sm">{todo.title}</div>
                      <div class="text-xs text-gray-500 mt-1 truncate">{todo.description}</div>
                    </div>
                    <span class="badge badge-{getPriorityColor(todo.priority)}">
                      {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </button>
              {:else}
                <div class="p-4 text-center text-gray-400 text-sm">暂无待办</div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="card">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-800">我的待办</h3>
        </div>
        <div class="divide-y divide-gray-100">
          {#each getRoleTodos(currentRole) as todo}
            <button 
              class="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              onclick={() => goto(`/bookings/${todo.bookingId}`)}
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-800">
                    <span class="badge badge-info mr-2">{todoTypeNames[todo.type]}</span>
                    {todo.title}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">{todo.description}</div>
                  {#if todo.issueType}
                    <div class="text-xs text-red-500 mt-1">问题类型：{getIssueTypeName(todo.issueType)}</div>
                  {/if}
                </div>
                <span class="badge badge-{getPriorityColor(todo.priority)}">
                  {todo.priority === 'high' ? '高优' : todo.priority === 'medium' ? '中优' : '低优'}
                </span>
              </div>
            </button>
          {:else}
            <div class="p-8 text-center text-gray-400">暂无待办事项</div>
          {/each}
        </div>
      </div>
    {/if}
    
    <div class="card">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">最近变更</h3>
      </div>
      <div class="divide-y divide-gray-100">
        {#each bookings.slice(0, 5) as booking}
          <button 
            class="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            onclick={() => goto(`/bookings/${booking.id}`)}
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800">{booking.customerName} - {booking.roomNo}</div>
                <div class="text-sm text-gray-500 mt-1">{booking.bookingNo}</div>
              </div>
              <span class="badge badge-{booking.status === 'rejected' ? 'danger' : booking.status === 'supplement_required' ? 'warning' : booking.status === 'completed' ? 'success' : 'info'}">
                {statusNames[booking.status]}
              </span>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
