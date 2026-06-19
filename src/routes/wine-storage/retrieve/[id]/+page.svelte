<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchWineStorage, retrieveWine, type WineStorage } from '$lib/api';
  import { Wine, ArrowLeft, Package, CheckCircle } from 'lucide-svelte';
  
  export let data;
  $: user = data.user;
  
  let wine: WineStorage | null = null;
  let notes = '';
  let error = '';
  let success = false;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    const id = parseInt($page.params.id);
    const wines = await fetchWineStorage();
    wine = wines.find(w => w.id === id);
  });

  async function handleSubmit() {
    error = '';
    success = false;

    try {
      await retrieveWine(parseInt($page.params.id), notes);
      success = true;
    } catch {
      error = '操作失败，请重试';
    }
  }
</script>

{#if !user}
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
  <div>
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
  </div>
{/if}