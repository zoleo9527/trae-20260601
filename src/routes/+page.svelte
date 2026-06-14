<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser, getRoleLabel } from '$lib/stores/user';
  import { goto } from '$app/navigation';
  
  interface Todo {
    id: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    dueDate: string;
    status: string;
  }
  
  interface Risk {
    type: string;
    description: string;
    severity: string;
  }
  
  interface Change {
    id: string;
    userId: string;
    action: string;
    entityType: string;
    createdAt: string;
    user?: { name: string };
  }
  
  let todos = [];
  let risks = [];
  let changes = [];
  let loading = true;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    try {
      const [todosRes, risksRes, changesRes] = await Promise.all([
        fetch('/api/todos'),
        fetch('/api/risks'),
        fetch('/api/recent-changes')
      ]);
      
      if (todosRes.ok) {
        const data = await todosRes.json();
        todos = data.todos || [];
      }
      
      if (risksRes.ok) {
        const data = await risksRes.json();
        risks = data.risks || [];
      }
      
      if (changesRes.ok) {
        const data = await changesRes.json();
        changes = data.changes || [];
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    } finally {
      loading = false;
    }
  }
  
  function getPriorityColor(priority: string): string {
    switch (priority) {
      case 'HIGH': return 'bg-danger text-white';
      case 'MEDIUM': return 'bg-warning text-white';
      case 'LOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
  
  function getSeverityColor(severity: string): string {
    switch (severity) {
      case 'HIGH': return 'bg-danger';
      case 'MEDIUM': return 'bg-warning';
      case 'LOW': return 'bg-yellow-100';
      default: return 'bg-gray-100';
    }
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  }
  
  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  async function handleTodoClick(todo: Todo) {
    if (todo.type === 'ARRANGEMENT_CONFIRM' && todo.relatedId) {
      goto(`/arrangement/${todo.relatedId}`);
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-64">
    <div class="text-gray-500">加载中...</div>
  </div>
{:else}
  <div class="space-y-6">
    <div class="grid grid-cols-4 gap-4">
      <a href="/arrangement" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-md bg-primary-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <div class="font-semibold text-gray-800">监考安排</div>
        </div>
        <div class="text-sm text-gray-500">创建和管理监考任务</div>
      </a>
      
      <a href="/checkin" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-md bg-success/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="font-semibold text-gray-800">签到确认</div>
        </div>
        <div class="text-sm text-gray-500">执行学生签到确认</div>
      </a>
      
      <a href="/exam-room" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-md bg-warning/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-2 0H7m0 0H5m2 0v-4m0 4v-4m0 0v-4"></path>
            </svg>
          </div>
          <div class="font-semibold text-gray-800">考场管理</div>
        </div>
        <div class="text-sm text-gray-500">查看和维护考场信息</div>
      </a>
      
      <a href="/statistics" class="card p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="font-semibold text-gray-800">数据统计</div>
        </div>
        <div class="text-sm text-gray-500">缺考统计和异常分析</div>
      </a>
    </div>
    
    <div class="grid grid-cols-2 gap-6">
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">待办事项</h3>
          <span class="badge bg-primary-100 text-primary">{todos.length} 项</span>
        </div>
        
        {#if todos.length === 0}
          <div class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>暂无待办事项</div>
          </div>
        {:else}
          <div class="space-y-3">
            {#each todos as todo}
              <div 
                class="p-4 rounded-md border border-gray-100 hover:border-gray-200 transition-colors cursor-pointer"
                onclick={() => handleTodoClick(todo)}
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="badge {getPriorityColor(todo.priority)}">{todo.priority}</span>
                      <span class="font-medium text-gray-800">{todo.title}</span>
                    </div>
                    <div class="text-sm text-gray-600">{todo.description}</div>
                    {#if todo.dueDate}
                      <div class="text-xs text-gray-500 mt-2">截止：{formatDate(todo.dueDate)}</div>
                    {/if}
                  </div>
                  <button class="text-primary hover:text-primary-700">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800">风险预警</h3>
          <span class="badge bg-danger/10 text-danger">{risks.length} 项</span>
        </div>
        
        {#if risks.length === 0}
          <div class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <div>暂无风险预警</div>
          </div>
        {:else}
          <div class="space-y-3">
            {#each risks as risk}
              <div class="p-4 rounded-md {getSeverityColor(risk.severity)} text-white">
                <div class="flex items-center gap-2 mb-1">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.542 0 2.602-1.654 1.99-3.04l-3.432-8.696c-.61-1.54-2.602-1.54-3.212 0L9.326 14.96c-.612 1.548.448 3.04 1.99 3.04z"></path>
                  </svg>
                  <span class="font-medium">{risk.type}</span>
                </div>
                <div class="text-sm opacity-90">{risk.description}</div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
    
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">最近变更</h3>
        <span class="text-sm text-gray-500">最近24小时</span>
      </div>
      
      {#if changes.length === 0}
        <div class="text-center py-8 text-gray-500">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>暂无变更记录</div>
        </div>
      {:else}
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          <div class="space-y-4">
            {#each changes as change}
              <div class="relative pl-10">
                <div class="absolute left-3 w-2.5 h-2.5 rounded-full bg-primary"></div>
                <div class="p-4 rounded-md bg-gray-50">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-800">
                      {change.user?.name || '未知用户'}
                    </span>
                    <span class="text-sm text-gray-500">{formatTime(change.createdAt)}</span>
                  </div>
                  <div class="text-sm text-gray-600">
                    {change.action} - {change.entityType}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}