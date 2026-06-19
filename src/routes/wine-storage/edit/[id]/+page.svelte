<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchWineStorage, updateWineStorage, type WineStorage } from '$lib/api';
  import { Wine, ArrowLeft, Save } from 'lucide-svelte';
  
  export let data;
  $: user = data.user;
  
  let wine: WineStorage | null = null;
  let customer_name = '';
  let phone = '';
  let wine_name = '';
  let quantity = 1;
  let bottle_size = 'standard';
  let storage_location = 'cellar';
  let notes = '';
  let error = '';
  let success = false;

  const bottleSizes = [
    { value: 'standard', label: '标准瓶 (750ml)' },
    { value: 'magnum', label: '大瓶 (1.5L)' },
    { value: 'jeroboam', label: '杰罗波安 (3L)' },
    { value: 'split', label: '小瓶 (187ml)' },
    { value: 'other', label: '其他' }
  ];

  const storageLocations = [
    { value: 'cellar', label: '酒窖' },
    { value: 'bar', label: '吧台' },
    { value: 'vip', label: 'VIP区' },
    { value: 'locker', label: '储物柜' }
  ];

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    const id = parseInt($page.params.id);
    const wines = await fetchWineStorage();
    wine = wines.find(w => w.id === id);
    if (wine) {
      customer_name = wine.customer_name;
      phone = wine.phone;
      wine_name = wine.wine_name;
      quantity = wine.quantity;
      bottle_size = wine.bottle_size;
      storage_location = wine.storage_location;
      notes = wine.notes || '';
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;

    if (!customer_name || !phone || !wine_name) {
      error = '请填写必填项';
      return;
    }

    try {
      await updateWineStorage(parseInt($page.params.id), {
        customer_name,
        phone,
        wine_name,
        quantity,
        bottle_size,
        storage_location,
        notes
      });
      success = true;
    } catch {
      error = '保存失败，请重试';
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
{:else}
  <div>
    <div class="flex items-center space-x-4 mb-6">
      <a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">编辑寄存记录</h1>
        <p class="text-gray-500 mt-1">修改客户寄存的酒水信息</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if success}
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          保存成功！
        </div>
      {/if}

      {#if error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">客户姓名 <span class="text-red-500">*</span></label>
            <input
              bind:value={customer_name}
              type="text"
              placeholder="请输入客户姓名"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">联系电话 <span class="text-red-500">*</span></label>
            <input
              bind:value={phone}
              type="tel"
              placeholder="请输入联系电话"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">酒名 <span class="text-red-500">*</span></label>
          <input
            bind:value={wine_name}
            type="text"
            placeholder="请输入酒名"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div class="grid grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">数量（瓶）</label>
            <input
              bind:value={quantity}
              type="number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">规格</label>
            <select
              bind:value={bottle_size}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each bottleSizes as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">存放位置</label>
            <select
              bind:value={storage_location}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each storageLocations as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            bind:value={notes}
            rows="3"
            placeholder="请输入备注信息"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <a href="/wine-storage" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </a>
          <button
            type="submit"
            class="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save class="w-4 h-4" />
            <span>保存</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}