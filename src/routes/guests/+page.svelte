<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchGuests, type Guest } from '$lib/api';
  import { Music, Plus, Edit, Trash2, Search, Filter, Eye, FileText } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  let guests: Guest[] = [];
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedGuest: Guest | null = null;
  let showDetailModal = false;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    guests = await fetchGuests();
  });

  function filterGuests() {
    return guests.filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.stage_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.phone?.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      active: '活跃',
      inactive: '暂停',
      blacklisted: '黑名单'
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-yellow-100 text-yellow-700',
      blacklisted: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  function openDetail(guest: Guest) {
    selectedGuest = guest;
    showDetailModal = true;
  }

  function closeDetail() {
    showDetailModal = false;
    selectedGuest = null;
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
        <h1 class="text-2xl font-bold text-gray-800">嘉宾名单</h1>
        <p class="text-gray-500 mt-1">管理酒吧演出嘉宾信息</p>
      </div>
      <a href="/guests/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <Plus class="w-5 h-5" />
        <span>添加嘉宾</span>
      </a>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center space-x-4 mb-6">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="搜索嘉宾姓名、艺名或电话..."
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
            <option value="active">活跃</option>
            <option value="inactive">暂停</option>
            <option value="blacklisted">黑名单</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">姓名</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">艺名</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">电话</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">风格</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">创建时间</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filterGuests() as guest}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-gray-800">{guest.name}</td>
                <td class="py-3 px-4 text-gray-600">{guest.stage_name || '-'}</td>
                <td class="py-3 px-4 text-gray-600">{guest.phone || '-'}</td>
                <td class="py-3 px-4 text-gray-600">{guest.genre || '-'}</td>
                <td class="py-3 px-4">
                  <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(guest.status)}`}>
                    {getStatusLabel(guest.status)}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-500 text-sm">{new Date(guest.created_at).toLocaleString('zh-CN')}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => openDetail(guest)}
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <a
                      href={`/guests/edit/${guest.id}`}
                      class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </a>
                    <a
                      href={`/logs?table=guests&recordId=${guest.id}`}
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
                  暂无嘉宾数据
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if showDetailModal && selectedGuest}
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={closeDetail}>
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" on:click|stopPropagation>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-800">嘉宾详情</h2>
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
                <label class="block text-sm font-medium text-gray-500 mb-1">姓名</label>
                <p class="text-gray-800">{selectedGuest.name}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">艺名</label>
                <p class="text-gray-800">{selectedGuest.stage_name || '-'}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">电话</label>
                <p class="text-gray-800">{selectedGuest.phone || '-'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">邮箱</label>
                <p class="text-gray-800">{selectedGuest.email || '-'}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">音乐风格</label>
              <p class="text-gray-800">{selectedGuest.genre || '-'}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">经纪人</label>
                <p class="text-gray-800">{selectedGuest.agent_name || '-'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">经纪人电话</label>
                <p class="text-gray-800">{selectedGuest.agent_phone || '-'}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">备注</label>
              <p class="text-gray-800">{selectedGuest.description || '-'}</p>
            </div>
            <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">状态</label>
                <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedGuest.status)}`}>
                  {getStatusLabel(selectedGuest.status)}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">创建时间</label>
                <p class="text-gray-600 text-sm">{new Date(selectedGuest.created_at).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">更新时间</label>
                <p class="text-gray-600 text-sm">{new Date(selectedGuest.updated_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <a href={`/guests/edit/${selectedGuest.id}`} class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              编辑
            </a>
            <a href="/logs?table=guests&recordId={selectedGuest.id}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              查看日志
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}