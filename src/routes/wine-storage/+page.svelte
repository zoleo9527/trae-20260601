<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fetchWineStorage, type WineStorage } from '$lib/api';
  import { Wine, Plus, Edit, Trash2, Search, Filter, Eye, Package, FileText } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  let wines: WineStorage[] = [];
  let searchQuery = '';
  let statusFilter = 'all';
  let selectedWine: WineStorage | null = null;
  let showDetailModal = false;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    wines = await fetchWineStorage();
  });

  function filterWines() {
    return wines.filter(w => {
      const matchesSearch = w.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone.includes(searchQuery) ||
        w.wine_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = {
      stored: '寄存中',
      retrieved: '已取走',
      consumed: '已消费'
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      stored: 'bg-green-100 text-green-700',
      retrieved: 'bg-blue-100 text-blue-700',
      consumed: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  }

  function openDetail(wine: WineStorage) {
    selectedWine = wine;
    showDetailModal = true;
  }

  function closeDetail() {
    showDetailModal = false;
    selectedWine = null;
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
        <h1 class="text-2xl font-bold text-gray-800">酒水寄存</h1>
        <p class="text-gray-500 mt-1">管理客户寄存的酒水，记录存取记录</p>
      </div>
      <a href="/wine-storage/new" class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
        <Plus class="w-5 h-5" />
        <span>寄存酒水</span>
      </a>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <div class="flex items-center space-x-4 mb-6">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="搜索客户姓名、电话或酒名..."
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
            <option value="stored">寄存中</option>
            <option value="retrieved">已取走</option>
            <option value="consumed">已消费</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">客户姓名</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">联系电话</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">酒名</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">数量</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">规格</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">位置</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600">寄存时间</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {#each filterWines() as wine}
              <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="py-3 px-4 text-gray-800">{wine.customer_name}</td>
                <td class="py-3 px-4 text-gray-600">{wine.phone}</td>
                <td class="py-3 px-4 text-gray-600">{wine.wine_name}</td>
                <td class="py-3 px-4 text-gray-600">{wine.quantity}瓶</td>
                <td class="py-3 px-4 text-gray-600">{wine.bottle_size}</td>
                <td class="py-3 px-4 text-gray-600">{wine.storage_location}</td>
                <td class="py-3 px-4">
                  <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(wine.status)}`}>
                    {getStatusLabel(wine.status)}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-600 text-sm">{new Date(wine.stored_at).toLocaleDateString('zh-CN')}</td>
                <td class="py-3 px-4 text-right">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      on:click={() => openDetail(wine)}
                      class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    {#if wine.status === 'stored'}
                      <a
                        href={`/wine-storage/retrieve/${wine.id}`}
                        class="flex items-center space-x-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm"
                        title="取走"
                      >
                        <Package class="w-4 h-4" />
                        <span>取走</span>
                      </a>
                    {/if}
                    <a
                      href={`/wine-storage/edit/${wine.id}`}
                      class="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit class="w-4 h-4" />
                    </a>
                    <a
                      href={`/logs?table=wine_storage&recordId=${wine.id}`}
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
                <td colspan="9" class="py-12 text-center text-gray-500">
                  暂无寄存记录
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    {#if showDetailModal && selectedWine}
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" on:click={closeDetail}>
        <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" on:click|stopPropagation>
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-800">寄存详情</h2>
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
                <p class="text-gray-800">{selectedWine.customer_name}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">联系电话</label>
                <p class="text-gray-800">{selectedWine.phone}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">酒名</label>
              <p class="text-gray-800">{selectedWine.wine_name}</p>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">数量</label>
                <p class="text-gray-800">{selectedWine.quantity}瓶</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">规格</label>
                <p class="text-gray-800">{selectedWine.bottle_size}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">存放位置</label>
                <p class="text-gray-800">{selectedWine.storage_location}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">状态</label>
              <span class={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedWine.status)}`}>
                {getStatusLabel(selectedWine.status)}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">寄存时间</label>
              <p class="text-gray-800">{new Date(selectedWine.stored_at).toLocaleString('zh-CN')}</p>
            </div>
            {#if selectedWine.retrieved_at}
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-1">取走时间</label>
                <p class="text-gray-800">{new Date(selectedWine.retrieved_at).toLocaleString('zh-CN')}</p>
              </div>
            {/if}
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">备注</label>
              <p class="text-gray-800">{selectedWine.notes || '-'}</p>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-3 mt-6">
            <a href={`/wine-storage/edit/${selectedWine.id}`} class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              编辑
            </a>
            {#if selectedWine.status === 'stored'}
              <a href={`/wine-storage/retrieve/${selectedWine.id}`} class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                取走酒水
              </a>
            {/if}
            <a href={`/logs?table=wine_storage&recordId=${selectedWine.id}`} class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              查看日志
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
