<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchLogs, type OperationLog } from '$lib/api';
  import { currentUser, fetchCurrentUser } from '$lib/store';
  import { FileText, Search, Filter, User, Clock, ArrowUpDown, AlertCircle } from 'lucide-svelte';

  let logs: OperationLog[] = [];
  let searchQuery = '';
  let tableFilter = 'all';
  let operationFilter = 'all';

  onMount(async () => {
    await fetchCurrentUser();
    if ($currentUser) {
      logs = await fetchLogs();
    }
  });

  function filterLogs() {
    return logs.filter(log => {
      const matchesSearch = log.operator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.field_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTable = tableFilter === 'all' || log.table_name === tableFilter;
      const matchesOperation = operationFilter === 'all' || log.operation === operationFilter;
      return matchesSearch && matchesTable && matchesOperation;
    });
  }

  function getTableLabel(tableName: string) {
    const labels: Record<string, string> = {
      guests: '嘉宾名单',
      performances: '演出排班',
      reservations: '订台记录',
      wine_storage: '酒水寄存',
      attachments: '附件'
    };
    return labels[tableName] || tableName;
  }

  function getOperationLabel(operation: string) {
    const labels: Record<string, string> = {
      create: '新增',
      update: '修改',
      delete: '删除'
    };
    return labels[operation] || operation;
  }

  function getOperationColor(operation: string) {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-700',
      update: 'bg-blue-100 text-blue-700',
      delete: 'bg-red-100 text-red-700'
    };
    return colors[operation] || 'bg-gray-100 text-gray-700';
  }

  const tableOptions = [
    { value: 'all', label: '全部模块' },
    { value: 'guests', label: '嘉宾名单' },
    { value: 'performances', label: '演出排班' },
    { value: 'reservations', label: '订台记录' },
    { value: 'wine_storage', label: '酒水寄存' }
  ];

  const operationOptions = [
    { value: 'all', label: '全部操作' },
    { value: 'create', label: '新增' },
    { value: 'update', label: '修改' },
    { value: 'delete', label: '删除' }
  ];
</script>

{#if !$currentUser}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">请先登录</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <a href="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <FileText class="w-6 h-6 text-white" />
              </div>
              <span class="text-xl font-bold text-gray-800">酒吧运营系统</span>
            </a>
          </div>

          <div class="flex items-center space-x-6">
            <a href="/guests" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
              </svg>
              <span>嘉宾名单</span>
            </a>
            <a href="/performances" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>演出排班</span>
            </a>
            <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <span>订台记录</span>
            </a>
            <a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21"></path>
              </svg>
              <span>酒水寄存</span>
            </a>
            <a href="/logs" class="flex items-center space-x-2 text-purple-600 font-medium">
              <FileText class="w-5 h-5" />
              <span>操作日志</span>
            </a>
            <a href="/logout" class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>{$currentUser.username}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">操作日志</h1>
          <p class="text-gray-500 mt-1">记录所有操作的状态变化、责任人、时间点和备注</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center space-x-4 mb-6">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              bind:value={searchQuery}
              type="text"
              placeholder="搜索操作人、备注或字段..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div class="flex items-center space-x-2">
            <Filter class="w-5 h-5 text-gray-400" />
            <select
              bind:value={tableFilter}
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each tableOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
            <select
              bind:value={operationFilter}
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each operationOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="space-y-3">
          {#each filterLogs() as log}
            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-4">
                  <span class={`px-3 py-1 text-xs font-medium rounded-full ${getOperationColor(log.operation)}`}>
                    {getOperationLabel(log.operation)}
                  </span>
                  <span class="text-sm text-gray-600">{getTableLabel(log.table_name)}</span>
                  <span class="text-sm text-gray-500">记录ID: {log.record_id}</span>
                </div>
                <div class="flex items-center space-x-2 text-gray-500 text-sm">
                  <Clock class="w-4 h-4" />
                  <span>{new Date(log.created_at).toLocaleString('zh-CN')}</span>
                </div>
              </div>
              
              <div class="flex items-center space-x-2 mb-2">
                <User class="w-4 h-4 text-gray-400" />
                <span class="text-sm font-medium text-gray-700">操作人: {log.operator_name}</span>
              </div>

              {#if log.field_name}
                <div class="flex items-center space-x-2 text-sm mb-2">
                  <ArrowUpDown class="w-4 h-4 text-gray-400" />
                  <span class="text-gray-600">
                    <span class="font-medium">{log.field_name}</span>: 
                    <span class="text-gray-400 line-through">{log.old_value || '-'}</span>
                    <span class="mx-2 text-gray-400">→</span>
                    <span class="text-green-600 font-medium">{log.new_value || '-'}</span>
                  </span>
                </div>
              {/if}

              {#if log.notes}
                <div class="flex items-start space-x-2">
                  <AlertCircle class="w-4 h-4 text-gray-400 mt-0.5" />
                  <p class="text-sm text-gray-600">{log.notes}</p>
                </div>
              {/if}
            </div>
          {:else}
            <div class="py-12 text-center text-gray-500">
              暂无操作日志
            </div>
          {/each}
        </div>
      </div>
    </main>
  </div>
{/if}
