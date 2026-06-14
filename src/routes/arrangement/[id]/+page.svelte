<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/user';
  
  interface Arrangement {
    id: string;
    exam: { name: string; date: string; startTime: string; endTime: string };
    examRoom: { building: string; roomNumber: string; seatCount: number };
    invigilator: { name: string; department: string; phone: string };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    confirmedAt?: string;
    confirmedBy?: string;
    createdAt: string;
    createdBy: string;
  }
  
  let arrangement = null;
  let loading = true;
  let confirming = false;
  let note = '';
  
  const id = $page.params.id;
  
  onMount(async () => {
    await loadArrangement();
  });
  
  async function loadArrangement() {
    loading = true;
    try {
      const response = await fetch(`/api/arrangements/${id}`);
      if (response.ok) {
        arrangement = await response.json();
      }
    } catch (e) {
      console.error('加载监考安排失败:', e);
    } finally {
      loading = false;
    }
  }
  
  async function handleConfirm(status: 'CONFIRMED' | 'REJECTED') {
    confirming = true;
    try {
      const response = await fetch(`/api/arrangements/${id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      
      if (response.ok) {
        await loadArrangement();
      }
    } catch (e) {
      console.error('确认失败:', e);
    } finally {
      confirming = false;
    }
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
  
  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('zh-CN');
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
  
  function canConfirm(): boolean {
    const user = $currentUser;
    return user?.role === 'INVIGILATOR' && arrangement?.status === 'PENDING';
  }
</script>

{#if loading}
  <div class="text-center py-12 text-gray-500">加载中...</div>
{:else if arrangement}
  <div class="space-y-6">
    <div class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-800">监考安排详情</h2>
        <span class="badge {getStatusBadge(arrangement.status)}">{getStatusLabel(arrangement.status)}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">考试名称</div>
          <div class="font-medium text-gray-800">{arrangement.exam.name}</div>
        </div>
        
        <div>
          <div class="text-sm text-gray-500 mb-1">考试时间</div>
          <div class="font-medium text-gray-800">
            {formatDate(arrangement.exam.date)} {arrangement.exam.startTime} - {arrangement.exam.endTime}
          </div>
        </div>
        
        <div>
          <div class="text-sm text-gray-500 mb-1">监考日期</div>
          <div class="font-medium text-gray-800">{formatDate(arrangement.date)}</div>
        </div>
        
        <div>
          <div class="text-sm text-gray-500 mb-1">监考时间</div>
          <div class="font-medium text-gray-800">{arrangement.startTime} - {arrangement.endTime}</div>
        </div>
        
        <div>
          <div class="text-sm text-gray-500 mb-1">考场</div>
          <div class="font-medium text-gray-800">
            {arrangement.examRoom.building} {arrangement.examRoom.roomNumber}
          </div>
          <div class="text-sm text-gray-500">座位数: {arrangement.examRoom.seatCount}</div>
        </div>
        
        <div>
          <div class="text-sm text-gray-500 mb-1">监考老师</div>
          <div class="font-medium text-gray-800">{arrangement.invigilator.name}</div>
          <div class="text-sm text-gray-500">{arrangement.invigilator.department}</div>
          <div class="text-sm text-gray-500">{arrangement.invigilator.phone}</div>
        </div>
        
        <div>
          <div class="text-sm text-gray-500 mb-1">创建时间</div>
          <div class="text-sm text-gray-600">{formatTime(arrangement.createdAt)}</div>
        </div>
        
        {#if arrangement.confirmedAt}
          <div>
            <div class="text-sm text-gray-500 mb-1">确认时间</div>
            <div class="text-sm text-gray-600">{formatTime(arrangement.confirmedAt)}</div>
          </div>
        {/if}
      </div>
    </div>
    
    {#if canConfirm()}
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">确认监考任务</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">备注（可选）</label>
            <textarea 
              bind:value={note}
              class="input min-h-24"
              placeholder="如有特殊情况请在此说明"
            ></textarea>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              onclick={() => handleConfirm('CONFIRMED')}
              disabled={confirming}
              class="btn btn-success {confirming ? 'opacity-50' : ''}"
            >
              {confirming ? '处理中...' : '确认接受'}
            </button>
            
            <button 
              onclick={() => handleConfirm('REJECTED')}
              disabled={confirming}
              class="btn btn-danger {confirming ? 'opacity-50' : ''}"
            >
              拒绝任务
            </button>
          </div>
        </div>
      </div>
    {/if}
    
    {#if arrangement.status === 'CONFIRMED'}
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">签到确认入口</h3>
        <p class="text-gray-600 mb-4">考试当天可在此进入签到确认页面，执行学生签到操作。</p>
        <a 
          href={`/checkin/${arrangement.id}`}
          class="btn btn-primary"
        >
          进入签到确认
        </a>
      </div>
    {/if}
    
    <div class="flex items-center gap-3">
      <a href="/arrangement" class="btn btn-secondary">返回列表</a>
    </div>
  </div>
{:else}
  <div class="text-center py-12 text-gray-500">未找到监考安排</div>
{/if}