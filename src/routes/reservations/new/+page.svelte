<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { createReservation } from '$lib/api';
  import { BarChart3, ArrowLeft, Save, AlertCircle } from 'lucide-svelte';

  export let data;
  $: user = data.user;

  let customer_name = '';
  let phone = '';
  let date = '';
  let time_slot = '';
  let table_number = '1';
  let guests_count = '2';
  let status: 'pending' | 'confirmed' | 'cancelled' | 'completed' = 'confirmed';
  let notes = '';
  let error = '';
  let showDuplicateWarning = false;
  let success = false;

  const timeSlots = ['18:00-20:00', '20:00-22:00', '22:00-00:00', '00:00-02:00'];

  onMount(() => {
    if (!user) {
      goto('/');
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;
    showDuplicateWarning = false;
    
    if (!customer_name || !phone || !date || !time_slot || !table_number) {
      error = '请填写必要信息';
      return;
    }

    try {
      const result = await createReservation({
        customer_name,
        phone,
        date,
        time_slot,
        table_number: parseInt(table_number),
        guests_count: parseInt(guests_count),
        status,
        notes: notes || undefined,
        created_by: user.id,
        updated_by: user.id
      });
      
      if (result.success) {
        success = true;
        setTimeout(() => {
          goto('/reservations');
        }, 800);
      } else {
        showDuplicateWarning = true;
      }
    } catch (e) {
      error = '创建订台失败，请重试';
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
      <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">新增订台</h1>
        <p class="text-gray-500 mt-1">录入新的订台记录</p>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      {#if success}
        <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          订台创建成功！正在跳转...
        </div>
      {/if}

      {#if error}
        <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      {/if}

      {#if showDuplicateWarning}
        <div class="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 flex items-start space-x-3">
          <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p class="font-medium">台号已被预订</p>
            <p class="text-sm">该时段此台号已有其他客户预订，请选择其他台号或时段</p>
          </div>
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

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">订台日期 <span class="text-red-500">*</span></label>
            <input
              bind:value={date}
              type="date"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">时段 <span class="text-red-500">*</span></label>
            <select
              bind:value={time_slot}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              <option value="">请选择时段</option>
              {#each timeSlots as slot}
                <option value={slot}>{slot}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">台号 <span class="text-red-500">*</span></label>
            <select
              bind:value={table_number}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each Array.from({ length: 20 }, (_, i) => i + 1) as num}
                <option value={num}>台{num}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">人数</label>
            <select
              bind:value={guests_count}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            >
              {#each Array.from({ length: 20 }, (_, i) => i + 1) as num}
                <option value={num}>{num}人</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">状态</label>
          <div class="flex items-center space-x-4">
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="pending"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">待确认</span>
            </label>
            <label class="flex items-center space-x-2">
              <input
                type="radio"
                bind:group={status}
                value="confirmed"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">已确认</span>
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
                value="completed"
                class="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span class="text-gray-700">已完成</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注说明</label>
          <textarea
            bind:value={notes}
            rows={3}
            placeholder="如：特殊需求、备注信息等"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
          ></textarea>
        </div>

        <div class="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <a href="/reservations" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </a>
          <button
            type="submit"
            class="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Save class="w-5 h-5" />
            <span>确认订台</span>
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
