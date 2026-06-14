<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/user';
  
  interface Arrangement {
    id: string;
    exam: { name: string; date: string; startTime: string; endTime: string };
    examRoom: { building: string; roomNumber: string };
    invigilator: { name: string; department: string };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    confirmedAt?: string;
  }
  
  let arrangements = [];
  let loading = true;
  let filterStatus = '';
  let filterDate = '';
  let selectedItems = [];
  
  onMount(async () => {
    await loadArrangements();
  });
  
  async function loadArrangements() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);
      
      const response = await fetch(`/api/arrangements?${params}`);
      if (response.ok) {
        const data = await response.json();
        arrangements = data.arrangements || [];
      }
    } catch (e) {
      console.error('加载监考安排失败:', e);
    } finally {
      loading = false;
    }
  }
  
  function getStatusBadge(status: string): string {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'CONFIRMED': return 'badge-confirmed';
      case 'REJECTED': return 'badge-rejected';
      case 'COMPLETED': return 'badge-completed';
      default: return 'badge-pending';
    }
  }
  
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return '待确认';
      case 'CONFIRMED': return '已确认';
      case 'REJECTED': return '已拒绝';
      case 'COMPLETED': return '已完成';
      default: return status;
    }
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
  
  function toggleSelect(id: string) {
    const index = selectedItems.indexOf(id);
    if (index > -1) {
      selectedItems = selectedItems.filter(i => i !== id);
    } else {
      selectedItems = [...selectedItems, id];
    }
  }
  
  function toggleSelectAll() {
    if (selectedItems.length === arrangements.length) {
      selectedItems = [];
    } else {
      selectedItems = arrangements.map(a => a.id);
    }
  }
  
  async function handleBatchConfirm() {
    if (selectedItems.length === 0) return;
    
    try {
      const response = await fetch('/api/arrangements/batch-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedItems })
      });
      
      if (response.ok) {
        selectedItems = [];
        await loadArrangements();
      }
    } catch (e) {
      console.error('批量确认失败:', e);
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <select 
        bind:value={filterStatus}
        onchange={() => loadArrangements()}
        class="input w-40"
      >
        <option value="">全部状态</option>
        <option value="PENDING">待确认</option>
        <option value="CONFIRMED">已确认</option>
        <option value="COMPLETED">已完成</option>
      </select>
      
      <input 
        type="date"
        bind:value={filterDate}
        onchange={() => loadArrangements()}
        class="input w-40"
      />
    </div>
    
    {#if $currentUser?.role === 'EXAM_OFFICER'}
      <div class="flex items-center gap-3">
        {#if selectedItems.length > 0}
          <button 
            onclick={handleBatchConfirm}
            class="btn btn-primary"
          >
            批量确认 ({selectedItems.length})
          </button>
        {/if}
        
        <a href="/arrangement/new" class="btn btn-primary">
          新建安排
        </a>
      </div>
    {/if}
  </div>
  
  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else if arrangements.length === 0}
    <div class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      <div>暂无监考安排</div>
    </div>
  {:else}
    <div class="card overflow-hidden">
      <table class="table">
        <thead>
          <tr>
            {#if $currentUser?.role === 'EXAM_OFFICER'}
              <th class="w-12">
                <input 
                  type="checkbox"
                  checked={selectedItems.length === arrangements.length}
                  onchange={toggleSelectAll}
                  class="w-4 h-4 rounded"
                />
              </th>
            {/if}
            <th>考试名称</th>
            <th>考试时间</th>
            <th>考场</th>
            <th>监考老师</th>
            <th>状态</th>
            <th class="w-24">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each arrangements as arr}
            <tr class="hover:bg-gray-50">
              {#if $currentUser?.role === 'EXAM_OFFICER'}
                <td>
                  <input 
                    type="checkbox"
                    checked={selectedItems.includes(arr.id)}
                    onchange={() => toggleSelect(arr.id)}
                    class="w-4 h-4 rounded"
                  />
                </td>
              {/if}
              <td>
                <div class="font-medium text-gray-800">{arr.exam.name}</div>
              </td>
              <td>
                <div>{formatDate(arr.date)}</div>
                <div class="text-sm text-gray-500">{arr.startTime} - {arr.endTime}</div>
              </td>
              <td>
                <div>{arr.examRoom.building} {arr.examRoom.roomNumber}</div>
              </td>
              <td>
                <div class="font-medium">{arr.invigilator.name}</div>
                <div class="text-sm text-gray-500">{arr.invigilator.department}</div>
              </td>
              <td>
                <span class="badge {getStatusBadge(arr.status)}">{getStatusLabel(arr.status)}</span>
              </td>
              <td>
                <a 
                  href={`/arrangement/${arr.id}`}
                  class="text-primary hover:text-primary-700"
                >
                  查看
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>