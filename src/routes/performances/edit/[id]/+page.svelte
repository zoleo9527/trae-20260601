<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchPerformances, fetchGuests, updatePerformance, type Performance, type Guest } from '$lib/api';
  import { Calendar, ArrowLeft, Save } from 'lucide-svelte';
  
  export let data;
  $: user = data.user;
  
  let performance: Performance | null = null;
  let guests: Guest[] = [];
  let guest_id = 0;
  let date = '';
  let start_time = '';
  let end_time = '';
  let stage = 'main';
  let status = 'scheduled';
  let notes = '';
  let error = '';
  let success = false;

  const stageOptions = [
    { value: 'main', label: '主舞台' },
    { value: 'vip', label: 'VIP区' },
    { value: 'lounge', label: '休息区' }
  ];

  const statusOptions = [
    { value: 'scheduled', label: '已安排' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
    { value: 'postponed', label: '已延期' }
  ];

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    const id = parseInt($page.params.id);
    guests = await fetchGuests();
    const performances = await fetchPerformances();
    performance = performances.find(p => p.id === id);
    if (performance) {
      guest_id = performance.guest_id;
      date = performance.date;
      start_time = performance.start_time;
      end_time = performance.end_time;
      stage = performance.stage;
      status = performance.status;
      notes = performance.notes || '';
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;

    if (!guest_id || !date || !start_time || !end_time) {
      error = '请填写必填项';
      return;
    }

    try {
      await updatePerformance(parseInt($page.params.id), {
        guest_id,
        date,
        start_time,
        end_time,
        stage,
        status,
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
{:else if !performance}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">演出不存在</p>
  </div>
{:else}
  <div>
    <div class="flex items-center space-x-4 mb-6">
      <a href="/performances" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">编辑演出</h1>
        <p class="text-gray-500 mt-1">修改演出安排，支持改期处理</p>
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
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">嘉宾 <span class="text-red-500">*</span></label>
          <select
            bind:value={guest_id}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
          >
            <option value="0">请选择嘉宾</option>
            {#each guests as guest}
              <option value={guest.id}>{guest.stage_name || guest.name}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">演出日期 <span class="text-red-500">*</span></label>
            <input
              bind:value={date}
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
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

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">舞台</label>
            <select
              bind:value={stage}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each stageOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
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
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注说明（改期原因等）</label>
          <textarea
            bind:value={notes}
            rows="3"
            placeholder="请输入备注，如改期原因、特殊情况说明等"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <a href="/performances" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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