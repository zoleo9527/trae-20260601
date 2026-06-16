<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWineStorage, retrieveWine, type WineStorage } from '$lib/api';
  import { currentUser, fetchCurrentUser } from '$lib/store';
  import { Wine, ArrowLeft, Package, CheckCircle } from 'lucide-svelte';

  export let params;

  let wine: WineStorage | null = null;
  let notes = '';
  let error = '';
  let success = false;

  onMount(async () => {
    await fetchCurrentUser();
    if ($currentUser && params.id) {
      const wines = await fetchWineStorage();
      wine = wines.find(w => w.id === parseInt(params.id));
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;

    try {
      await retrieveWine(parseInt(params.id), notes);
      success = true;
    } catch (e) {
      error = '操作失败，请重试';
    }
  }
</script>

{#if !$currentUser}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">请先登录</p>
  </div>
{:else if !wine}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">寄存记录不存在</p>
  </div>
{:else if wine.status !== 'stored'}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">该酒水已被取走或消费</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <a href="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Wine class="w-6 h-6 text-white" />
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
            <a href="/wine-storage" class="flex items-center space-x-2 text-purple-600 font-medium">
              <Wine class="w-5 h-5" />
              <span>酒水寄存</span>
            </a>
            <a href="/logs" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
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

    <main class="max-w-3xl mx-auto px-4 py-8">
      <div class="flex items-center space-x-4 mb-6">
        <a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
          <ArrowLeft class="w-5 h-5" />
          <span>返回</span>
        </a>
        <div>
          <h1 class="text-2xl font-bold text-gray-800">取走酒水</h1>
          <p class="text-gray-500 mt-1">确认客户取走寄存的酒水</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        {#if success}
          <div class="flex flex-col items-center justify-center py-12">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle class="w-8 h-8 text-green-600" />
            </div>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">取走成功</h2>
            <p class="text-gray-500 mb-6">已记录酒水取走信息</p>
            <a href="/wine-storage" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              返回列表
            </a>
          </div>
        {:else}
          <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center space-x-2">
              <Package class="w-5 h-5 text-yellow-600" />
              <span class="text-yellow-800">确认客户取走以下酒水：</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">客户姓名</label>
              <p class="text-gray-800 font-medium">{wine.customer_name}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">联系电话</label>
              <p class="text-gray-800">{wine.phone}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">存放位置</label>
              <p class="text-gray-800">{wine.storage_location}</p>
            </div>
          </div>

          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <label class="block text-sm font-medium text-gray-500 mb-1">酒品信息</label>
            <p class="text-gray-800 text-lg font-medium">{wine.wine_name} x {wine.quantity}瓶</p>
            <p class="text-gray-600 text-sm">规格：{wine.bottle_size}</p>
          </div>

          {#if error}
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          {/if}

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">取走备注（可选）</label>
            <textarea
              bind:value={notes}
              rows="3"
              placeholder="请输入取走备注，如：客户现场取走、代领人信息等"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
            <a href="/wine-storage" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </a>
            <button
              on:click={handleSubmit}
              class="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Package class="w-4 h-4" />
              <span>确认取走</span>
            </button>
          </div>
        {/if}
      </div>
    </main>
  </div>
{/if}
