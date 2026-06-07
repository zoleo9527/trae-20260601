<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { ConsumptionRecord } from '$lib/types';
  
  let records: ConsumptionRecord[] = $state([]);
  let loading = $state(true);
  let statusFilter = $state<string>('all');
  
  const statusNames: Record<string, string> = {
    all: '全部',
    checkin: '已登记',
    scheduling: '待排班',
    in_service: '服务中',
    service_completed: '服务完成',
    checkout_pending: '待结账',
    completed: '已完成',
    cancelled: '已取消'
  };
  
  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'checkin': return 'badge-gray';
      case 'scheduling': return 'badge-warning';
      case 'in_service': return 'badge-info';
      case 'service_completed': return 'badge-success';
      case 'checkout_pending': return 'badge-warning';
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-gray';
    }
  }
  
  function formatTime(date: string | Date | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  $effect(async () => {
    loading = true;
    try {
      const res = await fetch('/api/records');
      let data = await res.json();
      if (statusFilter !== 'all') {
        data = data.filter((r: ConsumptionRecord) => r.status === statusFilter);
      }
      records = data;
    } finally {
      loading = false;
    }
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">消费记录</h2>
      <p class="text-gray-500 mt-1">查看所有消费记录和处理进度</p>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-500">状态筛选：</span>
    {#each Object.entries(statusNames) as [value, label]}
      <button 
        class="px-3 py-1.5 text-sm rounded-md transition-colors"
        class:bg-blue-100={statusFilter === value}
        class:text-blue-700={statusFilter === value}
        class:bg-gray-100={statusFilter !== value}
        class:text-gray-600={statusFilter !== value}
        onclick={() => statusFilter = value}
      >
        {label}
      </button>
    {/each}
  </div>

  <div class="card overflow-hidden">
    {#if loading}
      <div class="text-center py-12 text-gray-500">加载中...</div>
    {:else if records.length === 0}
      <div class="text-center py-12 text-gray-400">暂无记录</div>
    {:else}
      <table class="table">
        <thead>
          <tr>
            <th>记录编号</th>
            <th>客户姓名</th>
            <th>手牌</th>
            <th>储物柜</th>
            <th>到店时间</th>
            <th>状态</th>
            <th>消费金额</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each records as record}
            <tr 
              class="cursor-pointer"
              onclick={() => goto(`/records/${record.id}`)}
            >
              <td class="font-mono text-sm text-gray-600">{record.id}</td>
              <td class="font-medium">{record.customerName}</td>
              <td>
                <span class={record.handTagStatus === 'lost' ? 'text-red-600 font-medium' : ''}>
                  {record.handTagNo}
                  {#if record.handTagStatus === 'lost'}
                    <span class="badge badge-danger ml-2">遗失</span>
                  {/if}
                </span>
              </td>
              <td>
                <span>
                  {record.lockerNo}
                  {#if record.lockerStatus === 'complaint'}
                    <span class="badge badge-warning ml-2">投诉</span>
                  {/if}
                </span>
              </td>
              <td>{formatTime(record.checkinTime)}</td>
              <td>
                <span class="badge {getStatusBadgeClass(record.status)}">
                  {statusNames[record.status]}
                </span>
              </td>
              <td class="font-semibold">¥{record.totalAmount}</td>
              <td>
                <span class="text-blue-600 hover:text-blue-700 text-sm">查看详情 →</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
