<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fetchReservations, updateReservation, type Reservation } from '$lib/api';
  import { BarChart3, ArrowLeft, Save } from 'lucide-svelte';
  import { TIME_SLOTS, normalizeTimeSlot } from '$lib/constants';
  
  export let data;
  $: user = data.user;
  
  let reservation: Reservation | null = null;
  let customer_name = '';
  let phone = '';
  let date = '';
  let time_slot = '';
  let table_number = 1;
  let guests_count = 2;
  let status = 'confirmed';
  let notes = '';
  let error = '';
  let success = false;

  const statusOptions = [
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'cancelled', label: '已取消' },
    { value: 'completed', label: '已完成' }
  ];

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    const id = parseInt($page.params.id);
    const reservations = await fetchReservations();
    reservation = reservations.find(r => r.id === id);
    if (reservation) {
      customer_name = reservation.customer_name;
      phone = reservation.phone;
      date = reservation.date;
      time_slot = normalizeTimeSlot(reservation.time_slot);
      table_number = reservation.table_number;
      guests_count = reservation.guests_count;
      status = reservation.status;
      notes = reservation.notes || '';
    }
  });

  async function handleSubmit() {
    error = '';
    success = false;

    if (!customer_name || !phone || !date || !time_slot) {
      error = '请填写必填项';
      return;
    }

    try {
      const result = await updateReservation(parseInt($page.params.id), {
        customer_name,
        phone,
        date,
        time_slot,
        table_number,
        guests_count,
        status,
        notes
      });
      if (!result.success) {
        error = result.message || '该台号在该时段已被预订';
        return;
      }
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
{:else if !reservation}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">订台不存在</p>
  </div>
{:else}
  <div>
    <div class="flex items-center space-x-4 mb-6">
      <a href="/reservations" class="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft class="w-5 h-5" />
        <span>返回</span>
      </a>
      <div>
        <h1 class="text-2xl font-bold text-gray-800">编辑订台</h1>
        <p class="text-gray-500 mt-1">修改订台信息，自动检测重复订台</p>
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

        <div class="grid grid-cols-4 gap-6">
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
              {#each TIME_SLOTS as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">台号</label>
            <input
              bind:value={table_number}
              type="number"
              min="1"
              max="50"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">人数</label>
            <input
              bind:value={guests_count}
              type="number"
              min="1"
              max="20"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
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
          <a href="/reservations" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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