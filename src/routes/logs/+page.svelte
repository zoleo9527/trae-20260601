<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchLogs, type OperationLog } from '$lib/api';
  import { FileText, Search, Filter, User, Clock, ArrowUpDown, AlertCircle } from 'lucide-svelte';
  
  export let data;
  $: user = data.user;
  
  let logs: OperationLog[] = [];
  let searchQuery = '';
  let tableFilter = 'all';
  let operationFilter = 'all';

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

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    
    const urlParams = $page.url.searchParams;
    tableFilter = urlParams.get('table') || 'all';
    const recordId = urlParams.get('recordId');
    
    logs = await fetchLogs(tableFilter !== 'all' ? tableFilter : undefined, recordId ? parseInt(recordId) : undefined);
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
</script>

{#if !user}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">请先登录</p>
  </div>
{:else}
  <div>
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
  </div>
{/if}