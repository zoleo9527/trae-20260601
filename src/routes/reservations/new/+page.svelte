<script lang="ts">
  import { onMount } from 'svelte';
  import { createReservation } from '$lib/api';
  import { currentUser, fetchCurrentUser } from '$lib/store';
  import { BarChart3, ArrowLeft, Save, AlertCircle } from 'lucide-svelte';

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

  const timeSlots = ['18:00-20:00', '20:00-22:00', '22:00-00:00', '00:00-02:00'];

  onMount(async () => {
    await fetchCurrentUser();
  });

  async function handleSubmit() {
    error = '';
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
        created_by: $currentUser?.id || 1,
        updated_by: $currentUser?.id || 1
      });
      
      if (result.success) {
        window.location.href = '/reservations';
      } else {
        showDuplicateWarning = true;
      }
    } catch (e) {
      error = '创建订台失败，请重试';
    }
  }
</script>

{#if !$currentUser}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">请先登录</p>
  </div>
{:else}
  <div class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-3">
            <a href="/" class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <BarChart3 class="w-6 h-6 text-white" />
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
            <a href="/reservations" class="flex items-center space-x-2 text-purple-600 font-medium">
              <BarChart3 class="w-5 h-5" />
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
        <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
          <ArrowLeft class="w-5 h-5" />
          <span>返回</span>
        </a>
        <h1 class="text-2xl font-bold text-gray-800">新增订台</h1>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        {#if error}
          <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-600 mb-6">
            {error}
          </div>
        {/if}

        {#if showDuplicateWarning}
          <div class="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 text-orange-600 mb-6 flex items-start space-x-3">
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
              <label class="block text-sm font-medium text-gray-700 mb-2">客户姓名 *</label>
              <input
                bind:value={customer_name}
                type="text"
                placeholder="请输入客户姓名"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">联系电话 *</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">订台日期 *</label>
              <input
                bind:value={date}
                type="date"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">时段 *</label>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">台号 *</label>
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

          <div class="flex items-center justify-end space-x-4">
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
    </main>
  </div>
{/if}
