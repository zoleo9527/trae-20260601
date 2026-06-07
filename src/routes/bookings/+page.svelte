<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import type { Booking, UserRole } from '$lib/types';
  
  let bookings: Booking[] = $state([]);
  let allBookings: Booking[] = $state([]);
  let loading = $state(true);
  let statusFilter = $state<string>('all');
  let hasIssueFilter = $state<boolean>(false);
  let currentRole = $state<UserRole>('admin');
  let viewMode = $state<'all' | 'my'>('all');
  
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
  
  const roleNames: Record<UserRole, string> = {
    booking_clerk: '预订员',
    floor_manager: '楼面经理',
    bar_staff: '吧台',
    admin: '管理员'
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
  
  function getQuickActionLabel(booking: Booking): string | null {
    if (booking.status === 'pending' && (currentRole === 'floor_manager' || currentRole === 'admin')) {
      return '确认预订';
    }
    if (booking.status === 'supplement_required' && (currentRole === 'booking_clerk' || currentRole === 'admin')) {
      return '补录信息';
    }
    if (booking.status === 'confirmed' && (currentRole === 'floor_manager' || currentRole === 'admin')) {
      return '到店接待';
    }
    if (booking.status === 'arrived' && (currentRole === 'floor_manager' || currentRole === 'admin')) {
      return '确认到店';
    }
    if (booking.status === 'in_use' && (currentRole === 'bar_staff' || currentRole === 'admin')) {
      return '酒水/结账';
    }
    if (booking.issues.some(i => i.status === 'open') && (currentRole === 'floor_manager' || currentRole === 'admin')) {
      return '处理问题';
    }
    return null;
  }
  
  function getMyBookings(): Booking[] {
    return allBookings.filter(b => canHandleBooking(b));
  }
  
  function applyFilters(): Booking[] {
    let result = viewMode === 'my' ? getMyBookings() : allBookings;
    
    if (statusFilter !== 'all') {
      result = result.filter((r: Booking) => r.status === statusFilter);
    }
    
    if (hasIssueFilter) {
      result = result.filter((r: Booking) => r.issues.some(i => i.status === 'open'));
    }
    
    return result;
  }
  
  async function loadData() {
    loading = true;
    try {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select?.value) {
        currentRole = select.value as UserRole;
      }
      
      const urlParams = new URLSearchParams($page.url.search);
      if (urlParams.get('status')) {
        statusFilter = urlParams.get('status')!;
      }
      if (urlParams.get('hasIssue') === 'true') {
        hasIssueFilter = true;
      }
      
      const res = await fetch('/api/bookings');
      allBookings = await res.json();
      bookings = applyFilters();
    } finally {
      loading = false;
    }
  }
  
  $effect(() => {
    bookings = applyFilters();
  });
  
  $effect(() => {
    loadData();
  });
  
  let observer: MutationObserver | null = null;
  
  onMount(() => {
    observer = new MutationObserver(() => {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select && select.value !== currentRole) {
        currentRole = select.value as UserRole;
        bookings = applyFilters();
      }
    });
    
    observer.observe(document.body, { subtree: true, childList: true });
  });
  
  onDestroy(() => {
    observer?.disconnect();
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">包厢预订</h2>
      <p class="text-gray-500 mt-1">当前角色：{roleNames[currentRole]} - 查看和处理预订记录</p>
    </div>
    <div class="flex items-center gap-2">
      {#if currentRole === 'booking_clerk' || currentRole === 'admin'}
        <button class="btn btn-primary">
          + 新建预订
        </button>
      {/if}
    </div>
  </div>

  <div class="flex flex-wrap gap-4 items-start">
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">视角：</span>
      <div class="flex rounded-lg border border-gray-200 overflow-hidden">
        <button 
          class="px-3 py-1.5 text-sm transition-colors"
          class:bg-blue-600={viewMode === 'my'}
          class:text-white={viewMode === 'my'}
          class:bg-white={viewMode !== 'my'}
          class:text-gray-700={viewMode !== 'my'}
          onclick={() => viewMode = 'my'}
        >
          我处理的 ({getMyBookings().length})
        </button>
        <button 
          class="px-3 py-1.5 text-sm transition-colors"
          class:bg-blue-600={viewMode === 'all'}
          class:text-white={viewMode === 'all'}
          class:bg-white={viewMode !== 'all'}
          class:text-gray-700={viewMode !== 'all'}
          onclick={() => viewMode = 'all'}
        >
          全部 ({allBookings.length})
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-1">
      <span class="text-sm text-gray-500 flex-shrink-0">状态：</span>
      <div class="flex gap-1 flex-wrap">
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
              <span class="ml-1 text-xs opacity-70">({allBookings.filter(b => b.status === value).length})</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <label class="flex items-center gap-2 cursor-pointer">
      <input 
        type="checkbox" 
        bind:checked={hasIssueFilter}
        class="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
      />
      <span class="text-sm text-gray-600">仅显示有风险项的预订</span>
    </label>
    {#if hasIssueFilter || statusFilter !== 'all' || viewMode === 'my'}
      <button 
        class="text-sm text-blue-600 hover:text-blue-700 ml-2"
        onclick={() => { statusFilter = 'all'; hasIssueFilter = false; viewMode = 'all'; }}
      >
        清除筛选
      </button>
    {/if}
  </div>

  {#if viewMode === 'my' && getMyBookings().length > 0}
    <div class="card border-blue-200 bg-blue-50">
      <div class="p-4 border-b border-blue-200">
        <h3 class="font-semibold text-blue-800">📌 待我处理 ({getMyBookings().filter(b => b.status !== 'completed' && b.status !== 'rejected').length})</h3>
      </div>
      <div class="divide-y divide-blue-200 max-h-64 overflow-y-auto">
        {#each getMyBookings().filter(b => b.status !== 'completed' && b.status !== 'rejected').slice(0, 5) as booking}
          <button 
            class="w-full p-3 text-left hover:bg-blue-100 transition-colors"
            onclick={() => goto(`/bookings/${booking.id}`)}
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-gray-800 text-sm">
                  {booking.customerName} - {booking.roomNo}
                  {#if booking.issues.some(i => i.status === 'open')}
                    <span class="badge badge-danger ml-2 text-xs">有风险</span>
                  {/if}
                </div>
                <div class="text-xs text-gray-500 mt-1">{booking.bookingNo} · {formatDate(booking.bookedStartTime)} {formatTime(booking.bookedStartTime)}</div>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge {getStatusBadgeClass(booking.status)} text-xs">
                  {statusNames[booking.status]}
                </span>
                {#if getQuickActionLabel(booking)}
                  <span class="text-blue-600 text-xs font-medium">{getQuickActionLabel(booking)} →</span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="card overflow-hidden">
    {#if loading}
      <div class="text-center py-12 text-gray-500">加载中...</div>
    {:else if bookings.length === 0}
      <div class="text-center py-12 text-gray-400">
        <div class="text-4xl mb-3">📭</div>
        <div>暂无符合条件的预订记录</div>
        {#if hasIssueFilter || statusFilter !== 'all' || viewMode === 'my'}
          <button 
            class="text-blue-600 hover:text-blue-700 text-sm mt-2"
            onclick={() => { statusFilter = 'all'; hasIssueFilter = false; viewMode = 'all'; }}
          >
            清除筛选条件
          </button>
        {/if}
      </div>
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
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {#each bookings as booking}
            <tr 
              class="cursor-pointer transition-colors"
              class:bg-blue-50={canHandleBooking(booking) && booking.status !== 'completed' && booking.status !== 'rejected'}
              class:bg-red-50={booking.issues.some(i => i.status === 'open')}
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
                  <span class="badge badge-danger ml-1">风险</span>
                {/if}
              </td>
              <td class="font-semibold">¥{booking.totalAmount}</td>
              <td>
                {#if getQuickActionLabel(booking)}
                  <span class="text-blue-600 hover:text-blue-700 text-sm font-medium">{getQuickActionLabel(booking)} →</span>
                {:else if booking.status === 'completed' || booking.status === 'rejected'}
                  <span class="text-gray-500 text-sm">回看 →</span>
                {:else}
                  <span class="text-gray-400 hover:text-gray-500 text-sm">查看 →</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>
