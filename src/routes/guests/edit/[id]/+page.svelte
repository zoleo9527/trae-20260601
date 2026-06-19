<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchGuests, updateGuest, type Guest } from '$lib/api';
  import { Music, ArrowLeft, Save } from 'lucide-svelte';
  
  export let data;
  $: user = data.user;
  
  let guest: Guest | null = null;
  let name = '';
  let stage_name = '';
  let phone = '';
  let email = '';
  let genre = '';
  let agent_name = '';
  let agent_phone = '';
  let description = '';
  let status = 'active';
  let error = '';
  let success = false;

  const statusOptions = [
    { value: 'active', label: '活跃' },
    { value: 'inactive', label: '暂停' },
    { value: 'blacklisted', label: '黑名单' }
  ];

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    const id = parseInt($page.params.id);
    const guests = await fetchGuests();
    guest = guests.find(g => g.id === id);
    if (guest) {
      name = guest.name;
      stage_name = guest.stage_name || '';
      phone = guest.phone || '';
      email = guest.email || '';
      genre = guest.genre || '';
      agent_name = guest.agent_name || '';
      agent_phone = guest.agent_phone || '';
      description = guest.description || '';
      status = guest.status;
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;

    if (!name) {
      error = '请填写嘉宾姓名';
      return;
    }

    try {
      await updateGuest(parseInt($page.params.id), {
        name,
        stage_name,
        phone,
        email,
        genre,
        agent_name,
        agent_phone,
        description,
        status
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
{:else if !guest}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">嘉宾不存在</p>
  </div>
{:else}
  <div>
    <div class="flex items-center space-x-4 mb-6">
      <a href="/guests" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">编辑嘉宾</h1>
        <p class="text-gray-500 mt-1">修改嘉宾信息</p>
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

      <form onsubmit={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">姓名 <span class="text-red-500">*</span></label>
            <input
              bind:value={name}
              type="text"
              placeholder="请输入姓名"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">艺名</label>
            <input
              bind:value={stage_name}
              type="text"
              placeholder="请输入艺名"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">电话</label>
            <input
              bind:value={phone}
              type="tel"
              placeholder="请输入电话"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              bind:value={email}
              type="email"
              placeholder="请输入邮箱"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">音乐风格</label>
          <input
            bind:value={genre}
            type="text"
            placeholder="请输入音乐风格"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">经纪人</label>
            <input
              bind:value={agent_name}
              type="text"
              placeholder="请输入经纪人姓名"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">经纪人电话</label>
            <input
              bind:value={agent_phone}
              type="tel"
              placeholder="请输入经纪人电话"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            bind:value={description}
            rows="3"
            placeholder="请输入备注信息"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <select
            bind:value={status}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          >
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <a href="/guests" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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