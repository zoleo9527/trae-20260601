<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { TodoItem, ConsumptionRecord } from '$lib/types';
  
  let todos: TodoItem[] = $state([]);
  let records: ConsumptionRecord[] = $state([]);
  let loading = $state(true);
  
  let currentRole = $state<'reception' | 'floor_supervisor' | 'finance' | 'admin'>('admin');
  
  const roleNames: Record<string, string> = {
    reception: '前台',
    floor_supervisor: '楼层主管',
    finance: '财务',
    admin: '管理员'
  };
  
  const todoTypeNames: Record<string, string> = {
    hand_tag: '手牌',
    scheduling: '排班',
    service: '服务',
    locker: '储物柜',
    payment: '结账',
    review: '审核'
  };
  
  const statusNames: Record<string, string> = {
    checkin: '已登记',
    scheduling: '待排班',
    in_service: '服务中',
    service_completed: '服务完成',
    checkout_pending: '待结账',
    completed: '已完成',
    cancelled: '已取消'
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
  
  onMount(async () => {
    try {
      const roleMatch = document.querySelector('select')?.value || 'admin';
      currentRole = roleMatch as any;
      
      const [todosRes, recordsRes] = await Promise.all([
        fetch(`/api/todos?role=${currentRole}`),
        fetch('/api/records')
      ]);
      
      todos = await todosRes.json();
      records = await recordsRes.json();
    } finally {
      loading = false;
    }
  });
  
  $effect(async () => {
    const select = document.querySelector('nav + main select') || document.querySelector('header select');
    if (select?.value) {
      currentRole = select.value as any;
      const res = await fetch(`/api/todos?role=${currentRole}`);
      todos = await res.json();
    }
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
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <div class="text-3xl font-bold text-blue-600">{records.filter(r => r.status === 'scheduling').length}</div>
        <div class="text-sm text-gray-500 mt-1">待排班</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-orange-600">{records.filter(r => r.status === 'in_service').length}</div>
        <div class="text-sm text-gray-500 mt-1">服务中</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-green-600">{records.filter(r => r.status === 'service_completed').length}</div>
        <div class="text-sm text-gray-500 mt-1">待结账</div>
      </div>
      <div class="card p-4">
        <div class="text-3xl font-bold text-red-600">{records.filter(r => r.handTagStatus === 'lost').length}</div>
        <div class="text-sm text-gray-500 mt-1">手牌遗失</div>
      </div>
    </div>

    {#if currentRole === 'admin'}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each ['reception', 'floor_supervisor', 'finance'] as role}
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">{roleNames[role]}待办</h3>
            </div>
            <div class="divide-y divide-gray-100">
              {#each getRoleTodos(role).slice(0, 5) as todo}
                <button 
                  class="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  onclick={() => goto(`/records/${todo.recordId}`)}
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
              onclick={() => goto(`/records/${todo.recordId}`)}
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-800">
                    <span class="badge badge-info mr-2">{todoTypeNames[todo.type]}</span>
                    {todo.title}
                  </div>
                  <div class="text-sm text-gray-500 mt-1">{todo.description}</div>
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
  {/if}
</div>
