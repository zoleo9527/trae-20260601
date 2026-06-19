<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchPerformances, fetchGuests, type Performance, type Guest } from '$lib/api';
  import { Calendar, Plus, Edit, Trash2, Search, Filter, Eye, FileText } from 'lucide-svelte';
  import { getStageLabel } from '$lib/constants';

  export let data;
  $: user = data.user;

  let performances: Performance[] = [];
  let guests: Guest[] = [];
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedPerformance: Performance | null = null;
  let showDetailModal = false;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    performances = await fetchPerformances();
    guests = await fetchGuests();
  });

  function getGuestName(guestId: number) {
    const guest = guests.find(g => g.id === guestId);
    return guest?.stage_name || guest?.name || '-';
  }

  function filterPerformances() {
    return performances.filter(p => {
      const guestName = getGuestName(p.guest_id);
      const matchesSearch = guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      scheduled: '已安排',
      completed: '已完成',
      cancelled: '已取消',
      postponed: '已延期'
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      postponed: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  function openDetail(performance: Performance) {
    selectedPerformance = performance;
    showDetailModal = true;
  }

  function closeDetail() {
    showDetailModal = false;
    selectedPerformance = null;
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
        <h1 class="text-2xl font-bold text-gray-800">演出排班</h1>
        <p class="text-gray-500 mt-1">管理酒吧演出日程安排</p>
      </div>
      <a href="/performances/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <Plus class="w-5 h-5" />
        <span>安排演出</span>
      </a>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center space-x-4 mb-6">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="搜索嘉宾或备注..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="flex items-center space-x-2">
          <Filter class="w-5 h-5 text-gray-400" />
          <select
            bind:value={statusFilter}
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">全部状态</option>
            <option value="scheduled">已安排</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="postponed">已延期</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">嘉宾</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">日期</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">时间</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">舞台</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">备注</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filterPerformances() as performance}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-gray-800">{getGuestName(performance.guest_id)}</td>
                <td class="py-3 px-4 text-gray-600">{performance.date}</td>
                <td class="py-3 px-4 text-gray-600">{performance.start_time} - {performance.end_time}</td>
                <td class="py-3 px-4 text-gray-600">{getStageLabel(performance.stage)}</td>
                <td class="py-3 px-4">
                  <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(performance.status)}`}>
                    {getStatusLabel(performance.status)}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-sm truncate max-w-xs">{performance.notes || '-'}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => openDetail(performance)}
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <a
                      href={`/performances/edit/${performance.id}`}
                      class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </a>
                    <a
                      href={`/logs?table=performances&recordId=${performance.id}`}
                      class="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="查看日志"
                    >
                      <FileText class="w-4 h-4" />
                    </a>
                  </div>
                </td>
              </tr>
            {:else}
              <tr>
                <td colspan="7" class="py-12 text-center text-gray-500">
                  暂无演出安排
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if showDetailModal && selectedPerformance}
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={closeDetail}>
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" on:click|stopPropagation>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-800">演出详情</h2>
            <button on:click={closeDetail} class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">嘉宾</label>
                <p class="text-gray-800">{getGuestName(selectedPerformance.guest_id)}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">日期</label>
                <p class="text-gray-800">{selectedPerformance.date}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">开始时间</label>
                <p class="text-gray-800">{selectedPerformance.start_time}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">结束时间</label>
                <p class="text-gray-800">{selectedPerformance.end_time}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">舞台</label>
                <p class="text-gray-800">{getStageLabel(selectedPerformance.stage)}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">状态</label>
                <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPerformance.status)}`}>
                  {getStatusLabel(selectedPerformance.status)}
                </span>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">备注</label>
              <p class="text-gray-800">{selectedPerformance.notes || '-'}</p>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
                <p class="text-gray-600 text-sm">{new Date(selectedPerformance.created_at).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">更新时间</label>
                <p class="text-gray-600 text-sm">{new Date(selectedPerformance.updated_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <a href={`/performances/edit/${selectedPerformance.id}`} class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              编辑
            </a>
            <a href={`/logs?table=performances&recordId=${selectedPerformance.id}`} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              查看日志
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}