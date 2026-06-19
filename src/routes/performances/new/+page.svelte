<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createPerformance, fetchGuests, type Guest } from '$lib/api';
  import { Calendar, ArrowLeft, Save, Upload } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  let guests: Guest[] = [];
  let guest_id = '';
  let date = '';
  let start_time = '';
  let end_time = '';
  let stage = 'main';
  let status: 'scheduled' | 'completed' | 'cancelled' | 'postponed' = 'scheduled';
  let notes = '';
  let error = '';
  let success = false;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    guests = await fetchGuests();
  });

  async function handleSubmit() {
    error = '';
    success = false;
    if (!guest_id || !date || !start_time || !end_time) {
      error = '请填写必要信息';
      return;
    }

    try {
      await createPerformance({
        guest_id: parseInt(guest_id),
        date,
        start_time,
        end_time,
        stage,
        status,
        notes: notes || undefined,
        created_by: user.id,
        updated_by: user.id
      });
      success = true;
      setTimeout(() => {
        goto('/performances');
      }, 800);
    } catch (e) {
      error = '安排演出失败，请重试';
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
      <a href="/performances" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">安排演出</h1>
        <p class="text-gray-500 mt-1">创建新的演出排班</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if success}
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          演出安排成功！正在跳转...
        </div>
      {/if}

      {#if error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      {/if}

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择嘉宾 <span class="text-red-500">*</span></label>
          <select
            bind:value={guest_id}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="">请选择嘉宾</option>
            {#each guests as guest}
              <option value={guest.id}>{guest.stage_name || guest.name}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">演出日期 <span class="text-red-500">*</span></label>
            <input
              bind:value={date}
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">舞台</label>
            <select
              bind:value={stage}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="main">主舞台</option>
              <option value="secondary">副舞台</option>
              <option value="outdoor">户外舞台</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">开始时间 <span class="text-red-500">*</span></label>
            <input
              bind:value={start_time}
              type="time"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">结束时间 <span class="text-red-500">*</span></label>
            <input
              bind:value={end_time}
              type="time"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="scheduled"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">已安排</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="completed"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">已完成</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="cancelled"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">已取消</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="postponed"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">已延期</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
          <textarea
            bind:value={notes}
            rows={3}
            placeholder="如：演出改期原因、特殊要求等"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          ></textarea>
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
          <a href="/performances" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </a>
          <button
            type="submit"
            class="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save class="w-5 h-5" />
            <span>保存演出</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
