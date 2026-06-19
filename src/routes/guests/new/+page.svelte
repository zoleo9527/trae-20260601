<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createGuest } from '$lib/api';
  import { Music, ArrowLeft, Save, Upload } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  let name = '';
  let stage_name = '';
  let phone = '';
  let email = '';
  let genre = '';
  let agent_name = '';
  let agent_phone = '';
  let description = '';
  let status: 'active' | 'inactive' | 'blacklisted' = 'active';
  let error = '';
  let success = false;

  onMount(() => {
    if (!user) {
      goto('/');
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;
    if (!name) {
      error = '请输入嘉宾姓名';
      return;
    }

    try {
      await createGuest({
        name,
        stage_name: stage_name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        genre: genre || undefined,
        agent_name: agent_name || undefined,
        agent_phone: agent_phone || undefined,
        description: description || undefined,
        status,
        created_by: user.id,
        updated_by: user.id
      });
      success = true;
      setTimeout(() => {
        goto('/guests');
      }, 800);
    } catch (e) {
      error = '添加嘉宾失败，请重试';
    }
  }
</script>

{#if !user}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">请先登录</p>
  </div>
{:else}
  <div>
    <div class="flex items-center space-x-4 mb-6">
      <a href="/guests" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">添加嘉宾</h1>
        <p class="text-gray-500 mt-1">录入新的嘉宾信息</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if success}
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          添加成功！正在跳转...
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
            <label class="block text-sm font-medium text-gray-700 mb-2">姓名 <span class="text-red-500">*</span></label>
            <input
              bind:value={name}
              type="text"
              placeholder="请输入嘉宾姓名"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">艺名</label>
            <input
              bind:value={stage_name}
              type="text"
              placeholder="请输入艺名（可选）"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">联系电话</label>
            <input
              bind:value={phone}
              type="tel"
              placeholder="请输入联系电话"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
            <input
              bind:value={email}
              type="email"
              placeholder="请输入邮箱地址"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">音乐风格</label>
          <input
            bind:value={genre}
            type="text"
            placeholder="如：电子音乐、摇滚、爵士等"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">经纪人姓名</label>
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
          <label class="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
          <textarea
            bind:value={description}
            rows={3}
            placeholder="请输入备注信息（可选）"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="active"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">活跃</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="inactive"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">暂停</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="blacklisted"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">黑名单</span>
            </label>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-6">
          <label class="block text-sm font-medium text-gray-700 mb-3">附件上传（占位）</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <Upload class="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p class="text-gray-500">点击或拖拽上传文件</p>
            <p class="text-gray-400 text-sm mt-1">支持图片、PDF等格式</p>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <a href="/guests" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </a>
          <button
            type="submit"
            class="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save class="w-5 h-5" />
            <span>保存嘉宾</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
