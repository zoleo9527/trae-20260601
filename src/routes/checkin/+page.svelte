<script lang="ts">
  import { onMount } from 'svelte';
  import { currentUser } from '$lib/stores/user';
  
  interface Arrangement {
    id: string;
    exam: { name: string; date: string };
    examRoom: { building: string; roomNumber: string };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  }
  
  let arrangements = [];
  let loading = true;
  
  onMount(async () => {
    await loadTasks();
  });
  
  async function loadTasks() {
    loading = true;
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const params = new URLSearchParams();
      params.append('invigilatorId', user.id);
      params.append('status', 'CONFIRMED');
      
      const response = await fetch(`/api/checkin?${params}`);
      if (response.ok) {
        const data = await response.json();
        arrangements = data.tasks || [];
      }
    } catch (e) {
      console.error('加载签到任务失败:', e);
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
  
  function isToday(dateStr: string): boolean {
    const today = new Date().toDateString();
    return new Date(dateStr).toDateString() === today;
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold text-gray-800">我的监考任务</h2>
  </div>
  
  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else if arrangements.length === 0}
    <div class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      <div>暂无监考任务</div>
    </div>
  {:else}
    <div class="space-y-3">
      {#each arrangements as arr}
        <div class="card p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                {#if isToday(arr.date)}
                  <span class="badge bg-success text-white">今日</span>
                {/if}
                <span class="font-semibold text-gray-800">{arr.exam.name}</span>
              </div>
              
              <div class="flex items-center gap-6 text-sm text-gray-600">
                <div>
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {formatDate(arr.date)}
                </div>
                
                <div>
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {arr.startTime} - {arr.endTime}
                </div>
                
                <div>
                  <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  {arr.examRoom.building} {arr.examRoom.roomNumber}
                </div>
              </div>
            </div>
            
            <a 
              href={`/checkin/${arr.id}`}
              class="btn btn-primary"
            >
              进入签到
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>