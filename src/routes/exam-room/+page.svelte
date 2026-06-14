<script lang="ts">
  import { onMount } from 'svelte';
  
  interface ExamRoom {
    id: string;
    building: string;
    roomNumber: string;
    seatCount: number;
    facilities: string;
    status: string;
  }
  
  let examRooms = [];
  let loading = true;
  let filterBuilding = '';
  
  onMount(async () => {
    await loadExamRooms();
  });
  
  async function loadExamRooms() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (filterBuilding) params.append('building', filterBuilding);
      
      const response = await fetch(`/api/exam-rooms?${params}`);
      if (response.ok) {
        const data = await response.json();
        examRooms = data.examRooms || [];
      }
    } catch (e) {
      console.error('加载考场失败:', e);
    } finally {
      loading = false;
    }
  }
  
  function getStatusBadge(status: string): string {
    switch (status) {
      case 'AVAILABLE': return 'badge-confirmed';
      case 'OCCUPIED': return 'badge-pending';
      case 'MAINTENANCE': return 'badge-rejected';
      default: return 'badge-pending';
    }
  }
  
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'AVAILABLE': return '可用';
      case 'OCCUPIED': return '占用';
      case 'MAINTENANCE': return '维护';
      default: return status;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <select 
      bind:value={filterBuilding}
      onchange={() => loadExamRooms()}
      class="input w-40"
    >
      <option value="">全部教学楼</option>
      <option value="教学楼A">教学楼A</option>
      <option value="教学楼B">教学楼B</option>
    </select>
  </div>
  
  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else if examRooms.length === 0}
    <div class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
      </svg>
      <div>暂无考场信息</div>
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-4">
      {#each examRooms as room}
        <div class="card p-6 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="font-semibold text-gray-800">
              {room.building} {room.roomNumber}
            </div>
            <span class="badge {getStatusBadge(room.status)}">{getStatusLabel(room.status)}</span>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span class="text-gray-600">座位数: <span class="font-medium">{room.seatCount}</span></span>
            </div>
            
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m17-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
              <span class="text-gray-600">{room.facilities}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>