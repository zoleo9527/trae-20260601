<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { BarChart3, Music, Calendar, Wine, Plus } from 'lucide-svelte';
  import { fetchGuests, fetchPerformances, fetchReservations, fetchWineStorage } from '$lib/api';
  
  export let data;
  $: user = data.user;
  
  let guestCount = 0;
  let performanceCount = 0;
  let reservationCount = 0;
  let wineCount = 0;

  onMount(async () => {
    if (!user) {
      goto('/');
      return;
    }
    try {
      const guests = await fetchGuests();
      guestCount = guests.length;
      const performances = await fetchPerformances();
      performanceCount = performances.length;
      const reservations = await fetchReservations();
      reservationCount = reservations.length;
      const wines = await fetchWineStorage();
      wineCount = wines.filter(w => w.status === 'stored').length;
    } catch {
      // ignore
    }
  });
</script>

{#if user}
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">系统概览</h1>
        <p class="text-gray-500 mt-1">酒吧运营数据总览</p>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">嘉宾数量</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{guestCount}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Music class="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">演出安排</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{performanceCount}</p>
          </div>
          <div class="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
            <Calendar class="w-6 h-6 text-pink-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">订台记录</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{reservationCount}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <BarChart3 class="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">寄存酒水</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{wineCount}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Wine class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">快速操作</h2>
      <div class="grid grid-cols-4 gap-4">
        <a href="/guests/new" class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
          <Music class="w-8 h-8 text-purple-600 mb-2" />
          <span class="text-sm font-medium text-gray-700">添加嘉宾</span>
        </a>
        <a href="/performances/new" class="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
          <Calendar class="w-8 h-8 text-pink-600 mb-2" />
          <span class="text-sm font-medium text-gray-700">安排演出</span>
        </a>
        <a href="/reservations/new" class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <BarChart3 class="w-8 h-8 text-blue-600 mb-2" />
          <span class="text-sm font-medium text-gray-700">新增订台</span>
        </a>
        <a href="/wine-storage/new" class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
          <Wine class="w-8 h-8 text-green-600 mb-2" />
          <span class="text-sm font-medium text-gray-700">寄存酒水</span>
        </a>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">正在跳转到登录页...</p>
  </div>
{/if}