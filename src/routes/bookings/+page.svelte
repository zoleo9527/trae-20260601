<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Booking, UserRole } from '$lib/types';
  
  let bookings: Booking[] = $state([]);
  let loading = $state(true);
  let statusFilter = $state<string>('all');
  let currentRole = $state<UserRole>('admin');
  
  const statusNames: Record<string, string> = {
    all: '全部',
    pending: '待确认',
    confirmed: '已确认',
    arrived: '已到达',
    in_use: '使用中',
    completed: '已完成',
    rejected: '已驳回',
    supplement_required: '待补录'
  };
  
  const roomTypeNames: Record<string, string> = {
    mini: '迷你包',
    small: '小包',
    medium: '中包',
    large: '大包',
    vip: 'VIP包',
    luxury: '豪华包'
  };
  
  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'confirmed': return 'badge-info';
      case 'arrived': return 'badge-purple';
      case 'in_use': return 'badge-success';
      case 'completed': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'supplement_required': return 'badge-orange';
      default: return 'badge-gray';
    }
  }
  
  function formatTime(date: string | Date | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDate(date: string | Date | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
  
  function canHandleBooking(booking: Booking): boolean {
    if (currentRole === 'admin') return true;
    if (currentRole === 'booking_clerk') {
      return booking.status === 'pending' || booking.status === 'supplement_required';
    }
    if (currentRole === 'floor_manager') {
      return booking.status === 'confirmed' || booking.status === 'arrived' || booking.status === 'in_use';
    }
    if (currentRole === 'bar_staff') {
      return booking.status === 'in_use';
    }
    return false;
  }
  
  async function loadData() {
    loading = true;
    try {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select?.value) {
        currentRole = select.value as UserRole;
      }
      
      const res = await fetch('/api/bookings');
      let data = await res.json();
      if (statusFilter !== 'all') {
        data = data.filter((r: Booking) => r.status === statusFilter);
      }
      bookings = data;
    } finally {
      loading = false;
    }
  }
  
  $effect(() => {
    loadData();
  });
  
  onMount(() => {
    const observer = new MutationObserver(() => {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select && select.value !== currentRole) {
        currentRole = select.value as UserRole;
      }
    });
    
    observer.observe(document.body, { subtree: true, childList: true });
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">包厢预订</h2>
      <p class="text-gray-500 mt-1">查看所有预订记录和处理进度</p>
    </div>
    {#if currentRole === 'booking_clerk' || currentRole === 'admin'}
      <button class="btn btn-primary">
        + 新建预订
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-2 flex-wrap">
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
        {#if value !== 'all'}
          <span class="ml-1 text-xs opacity-70">({bookings.filter(b => b.status === value).length})</span>
        {/if}
      </button>
    {/each}
  </div>

  <div class="card overflow-hidden">
    {#if loading}
      <div class="text-center py-12 text-gray-500">加载中...</div>
    {:else if bookings.length === 0}
      <div class="text-center py-12 text-gray-400">暂无记录</div>
    {:else}
      <table class="table">
        <thead>
          <tr>
            <th>预订编号</th>
            <th>客户姓名</th>
            <th>包厢</th>
            <th>预订时间</th>
            <th>人数</th>
            <th>会员</th>
            <th>状态</th>
            <th>金额</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each bookings as booking}
            <tr 
              class="cursor-pointer"
              class:bg-blue-50={canHandleBooking(booking) && booking.status !== 'completed'}
              onclick={() => goto(`/bookings/${booking.id}`)}
            >
              <td class="font-mono text-sm text-gray-600">{booking.bookingNo}</td>
              <td class="font-medium">{booking.customerName}</td>
              <td>
                <span>{booking.roomNo}</span>
                <span class="text-xs text-gray-500 ml-1">({roomTypeNames[booking.roomType]})</span>
              </td>
              <td>
                <div class="text-sm">
                  <div>{formatDate(booking.bookedStartTime)}</div>
                  <div class="text-gray-500">{formatTime(booking.bookedStartTime)} - {formatTime(booking.bookedEndTime)}</div>
                </div>
              </td>
              <td>{booking.numberOfPeople || '-'}</td>
              <td>
                {#if booking.memberName}
                  <span class="text-sm">{booking.memberName}</span>
                  {#if booking.memberLevel}
                    <span class="badge badge-purple ml-1 text-xs">{booking.memberLevel}</span>
                  {/if}
                {:else}
                  <span class="text-gray-400 text-sm">散客</span>
                {/if}
              </td>
              <td>
                <span class="badge {getStatusBadgeClass(booking.status)}">
                  {statusNames[booking.status]}
                </span>
                {#if booking.issues.some(i => i.status === 'open')}
                  <span class="badge badge-danger ml-1">!</span>
                {/if}
              </td>
              <td class="font-semibold">¥{booking.totalAmount}</td>
              <td>
                {#if canHandleBooking(booking) && booking.status !== 'completed'}
                  <span class="text-blue-600 hover:text-blue-700 text-sm font-medium">处理 →</span>
                {:else}
                  <span class="text-gray-400 hover:text-gray-500 text-sm">查看详情 →</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
