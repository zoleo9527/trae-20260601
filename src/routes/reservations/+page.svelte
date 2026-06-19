<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchReservations, type Reservation } from '$lib/api';
  import { BarChart3, Plus, Edit, Trash2, Search, Filter, Eye, CalendarClock, FileText } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  let reservations: Reservation[] = [];
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedDate = '';
  let selectedReservation: Reservation | null = null;
  let showDetailModal = false;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    reservations = await fetchReservations();
  });

  function filterReservations() {
    return reservations.filter(r => {
      const matchesSearch = r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesDate = !selectedDate || r.date === selectedDate;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      cancelled: '已取消',
      completed: '已完成'
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
      completed: 'bg-blue-100 text-blue-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  function getTimeSlotLabel(slot: string) {
    const labels: Record<string, string> = {
      morning: '上午 (10:00-14:00)',
      afternoon: '下午 (14:00-18:00)',
      evening: '晚间 (18:00-22:00)',
      night: '深夜 (22:00-02:00)'
    };
    return labels[slot] || slot;
  }

  function openDetail(reservation: Reservation) {
    selectedReservation = reservation;
    showDetailModal = true;
  }

  function closeDetail() {
    showDetailModal = false;
    selectedReservation = null;
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
        <h1 class="text-2xl font-bold text-gray-800">订台记录</h1>
        <p class="text-gray-500 mt-1">管理酒吧订台信息，防止重复订台</p>
      </div>
      <a href="/reservations/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <Plus class="w-5 h-5" />
        <span>新增订台</span>
      </a>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center space-x-4 mb-6">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="搜索客户姓名或电话..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="flex items-center space-x-2">
          <CalendarClock class="w-5 h-5 text-gray-400" />
          <input
            bind:value={selectedDate}
            type="date"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div class="flex items-center space-x-2">
          <Filter class="w-5 h-5 text-gray-400" />
          <select
            bind:value={statusFilter}
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="all">全部状态</option>
            <option value="pending">待确认</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
            <option value="completed">已完成</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">客户姓名</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">联系电话</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">日期</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">时段</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">台号</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">人数</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filterReservations() as reservation}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-gray-800">{reservation.customer_name}</td>
                <td class="py-3 px-4 text-gray-600">{reservation.phone}</td>
                <td class="py-3 px-4 text-gray-600">{reservation.date}</td>
                <td class="py-3 px-4 text-gray-600">{getTimeSlotLabel(reservation.time_slot)}</td>
                <td class="py-3 px-4 text-gray-600">台{reservation.table_number}</td>
                <td class="py-3 px-4 text-gray-600">{reservation.guests_count}人</td>
                <td class="py-3 px-4">
                  <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reservation.status)}`}>
                    {getStatusLabel(reservation.status)}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => openDetail(reservation)}
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <a
                      href={`/reservations/edit/${reservation.id}`}
                      class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </a>
                    <a
                      href={`/logs?table=reservations&recordId=${reservation.id}`}
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
                <td colspan="8" class="py-12 text-center text-gray-500">
                  暂无订台记录
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if showDetailModal && selectedReservation}
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={closeDetail}>
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" on:click|stopPropagation>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-800">订台详情</h2>
            <button
              on:click={closeDetail}
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">客户姓名</label>
                <p class="text-gray-800">{selectedReservation.customer_name}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">联系电话</label>
                <p class="text-gray-800">{selectedReservation.phone}</p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">订台日期</label>
                <p class="text-gray-800">{selectedReservation.date}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">时段</label>
                <p class="text-gray-800">{getTimeSlotLabel(selectedReservation.time_slot)}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">台号</label>
                <p class="text-gray-800">台{selectedReservation.table_number}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">人数</label>
              <p class="text-gray-800">{selectedReservation.guests_count}人</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">状态</label>
              <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedReservation.status)}`}>
                {getStatusLabel(selectedReservation.status)}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">备注</label>
              <p class="text-gray-800">{selectedReservation.notes || '-'}</p>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
                <p class="text-gray-600 text-sm">{new Date(selectedReservation.created_at).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">更新时间</label>
                <p class="text-gray-600 text-sm">{new Date(selectedReservation.updated_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <a href={`/reservations/edit/${selectedReservation.id}`} class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              编辑
            </a>
            <a href={`/logs?table=reservations&recordId=${selectedReservation.id}`} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              查看日志
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
