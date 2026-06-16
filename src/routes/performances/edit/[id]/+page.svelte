<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchPerformances, fetchGuests, updatePerformance, type Performance, type Guest } from '$lib/api';
  import { currentUser, fetchCurrentUser } from '$lib/store';
  import { Calendar, ArrowLeft, Save, Upload } from 'lucide-svelte';

  let performance: Performance | null = null;
  let guests: Guest[] = [];
  let guest_id = '';
  let date = '';
  let start_time = '';
  let end_time = '';
  let stage = 'main';
  let status: 'scheduled' | 'completed' | 'cancelled' | 'postponed' = 'scheduled';
  let notes = '';
  let error = '';

  export let params;

  onMount(async () => {
    await fetchCurrentUser();
    if ($currentUser && params.id) {
      const performances = await fetchPerformances();
      performance = performances.find(p => p.id === parseInt(params.id));
      guests = await fetchGuests();
      
      if (performance) {
        guest_id = String(performance.guest_id);
        date = performance.date;
        start_time = performance.start_time;
        end_time = performance.end_time;
        stage = performance.stage;
        status = performance.status;
        notes = performance.notes || '';
      }
    }
  });

  async function handleSubmit() {
    error = '';
    if (!guest_id || !date || !start_time || !end_time || !performance) {
      error = '请填写必要信息';
      return;
    }

    try {
      await updatePerformance(performance.id, {
        guest_id: parseInt(guest_id),
        date,
        start_time,
        end_time,
        stage,
        status,
        notes: notes || undefined
      });
      window.location.href = '/performances';
    } catch (e) {
      error = '更新演出信息失败，请重试';
    }
  }
</script>

{#if !$currentUser}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">请先登录</p>
  </div>
{:else if !performance}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">演出不存在</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <a href="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Calendar class="w-6 h-6 text-white" />
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
            <a href="/performances" class="flex items-center space-x-2 text-purple-600 font-medium">
              <Calendar class="w-5 h-5" />
              <span>演出排班</span>
            </a>
            <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <span>订台记录</span>
            </a>
            <a href="/wine-storage" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21"></path>
              </svg>
              <span>酒水寄存</span>
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
        <a href="/performances" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
          <ArrowLeft class="w-5 h-5" />
          <span>返回</span>
        </a>
        <h1 class="text-2xl font-bold text-gray-800">编辑演出</h1>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        {#if error}
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-600 mb-6">
            {error}
          </div>
        {/if}

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择嘉宾 *</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">演出日期 *</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">开始时间 *</label>
              <input
                bind:value={start_time}
                type="time"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">结束时间 *</label>
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
            <label class="block text-sm font-medium text-gray-700 mb-3">附件管理（占位）</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
              <Upload class="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p class="text-gray-500">点击或拖拽上传文件</p>
              <p class="text-gray-400 text-sm mt-1">支持图片、PDF等格式</p>
            </div>
          </div>

          <div class="flex items-center justify-end space-x-4">
            <a href="/performances" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              取消
            </a>
            <button
              type="submit"
              class="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save class="w-5 h-5" />
              <span>保存修改</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
{/if}
