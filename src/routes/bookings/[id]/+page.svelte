<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { Booking, Room, Member, DrinkItem, Note, IssueRecord, RejectionType, UserRole } from '$lib/types';
  import { goto } from '$app/navigation';
  
  let booking: Booking | null = $state(null);
  let rooms: Room[] = $state([]);
  let members: Member[] = $state([]);
  let drinkItems: DrinkItem[] = $state([]);
  let loading = $state(true);
  let activeTab = $state<'overview' | 'drinks' | 'issues' | 'notes'>('overview');
  let currentRole = $state<'booking_clerk' | 'floor_manager' | 'bar_staff' | 'admin'>('admin');
  let currentUser = $state('当前用户');
  
  let newNoteContent = $state('');
  let newNoteType = $state<'booking' | 'checkin' | 'drink' | 'member' | 'general' | 'issue'>('general');
  
  let showRejectModal = $state(false);
  let showSupplementModal = $state(false);
  let showIssueModal = $state(false);
  let showDrinkModal = $state(false);
  
  let rejectReason = $state('');
  let rejectSupplementary = $state('');
  let supplementInfo = $state('');
  let issueType = $state<RejectionType>('booking_rejection');
  let issueReason = $state('');
  let issueSupplementary = $state('');
  
  let selectedDrinks = $state<{drinkId: string, quantity: number}[]>([]);
  
  const statusNames: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    arrived: '已到达',
    in_use: '使用中',
    completed: '已完成',
    cancelled: '已取消',
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
  
  const noteTypeNames: Record<string, string> = {
    booking: '预订备注',
    checkin: '到店备注',
    drink: '酒水备注',
    member: '会员备注',
    rejection: '驳回原因',
    supplement: '补录备注',
    general: '通用备注',
    issue: '问题记录'
  };
  
  const issueTypeNames: Record<RejectionType, string> = {
    booking_rejection: '预订驳回',
    checkin_rejection: '到店驳回',
    drink_issue: '酒水问题',
    member_issue: '会员问题',
    room_issue: '包厢问题'
  };
  
  const roleNames: Record<string, string> = {
    booking_clerk: '预订员',
    floor_manager: '楼面经理',
    bar_staff: '吧台',
    admin: '管理员'
  };
  
  function formatDateTime(date: string | Date | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  function formatTime(date: string | Date | null) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  function getIssueBadgeClass(type: RejectionType) {
    switch (type) {
      case 'booking_rejection': return 'badge-danger';
      case 'checkin_rejection': return 'badge-danger';
      case 'drink_issue': return 'badge-warning';
      case 'member_issue': return 'badge-warning';
      case 'room_issue': return 'badge-warning';
      default: return 'badge-gray';
    }
  }
  
  function getMemberById(id: string) {
    return members.find(m => m.id === id);
  }
  
  function getDrinkItemById(id: string) {
    return drinkItems.find(d => d.id === id);
  }
  
  function calculateDrinkTotal() {
    return selectedDrinks.reduce((sum, item) => {
      const drink = getDrinkItemById(item.drinkId);
      return sum + (drink?.price || 0) * item.quantity;
    }, 0);
  }
  
  async function loadData() {
    loading = true;
    try {
      const select = document.querySelector('header select') as HTMLSelectElement | null;
      if (select?.value) {
        currentRole = select.value as any;
      }
      
      const [bookingRes, roomsRes, membersRes, drinksRes] = await Promise.all([
        fetch(`/api/bookings/${$page.params.id}`),
        fetch('/api/rooms'),
        fetch('/api/members'),
        fetch('/api/drink-items')
      ]);
      
      booking = await bookingRes.json();
      rooms = await roomsRes.json();
      members = await membersRes.json();
      drinkItems = await drinksRes.json();
    } finally {
      loading = false;
    }
  }
  
  async function addNote() {
    if (!booking || !newNoteContent.trim()) return;
    
    const res = await fetch(`/api/bookings/${booking.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newNoteContent,
        createdBy: currentUser,
        createdByRole: currentRole,
        type: newNoteType
      })
    });
    
    if (res.ok) {
      booking = await res.json();
      newNoteContent = '';
    }
  }
  
  async function confirmBooking() {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'confirm',
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  async function submitReject() {
    if (!booking || !rejectReason.trim()) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'reject',
        reason: rejectReason,
        supplementaryNotes: rejectSupplementary,
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
      showRejectModal = false;
      rejectReason = '';
      rejectSupplementary = '';
    }
  }
  
  async function submitSupplement() {
    if (!booking || !supplementInfo.trim()) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'request_supplement',
        supplementInfo,
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
      showSupplementModal = false;
      supplementInfo = '';
    }
  }
  
  async function completeSupplement() {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'complete_supplement',
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  async function markArrived() {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'mark_arrived',
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  async function checkIn() {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'checkin',
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  async function completeBooking() {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'complete',
        operator: currentUser,
        operatorRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  async function submitIssue() {
    if (!booking || !issueReason.trim()) return;
    
    const res = await fetch(`/api/bookings/${booking.id}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: issueType,
        reason: issueReason,
        supplementaryNotes: issueSupplementary,
        createdBy: currentUser,
        createdByRole: currentRole
      })
    });
    
    if (res.ok) {
      booking = await res.json();
      showIssueModal = false;
      issueReason = '';
      issueSupplementary = '';
    }
  }
  
  async function resolveIssue(issueId: string) {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}/issues`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        issueId, 
        resolvedBy: currentUser,
        action: 'resolve'
      })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  function addDrinkSelection(drinkId: string) {
    const existing = selectedDrinks.find(d => d.drinkId === drinkId);
    if (existing) {
      existing.quantity++;
    } else {
      selectedDrinks = [...selectedDrinks, { drinkId, quantity: 1 }];
    }
  }
  
  function removeDrinkSelection(drinkId: string) {
    selectedDrinks = selectedDrinks.filter(d => d.drinkId !== drinkId);
  }
  
  function updateDrinkQuantity(drinkId: string, quantity: number) {
    const item = selectedDrinks.find(d => d.drinkId === drinkId);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
  }
  
  async function submitDrinkOrder() {
    if (!booking || selectedDrinks.length === 0) return;
    
    const items = selectedDrinks.map(sd => {
      const drink = getDrinkItemById(sd.drinkId)!;
      return {
        drinkId: sd.drinkId,
        drinkName: drink.name,
        quantity: sd.quantity,
        price: drink.price,
        subtotal: drink.price * sd.quantity
      };
    });
    
    const res = await fetch(`/api/bookings/${booking.id}/drink-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    
    if (res.ok) {
      booking = await res.json();
      showDrinkModal = false;
      selectedDrinks = [];
    }
  }
  
  async function updateDrinkStatus(orderId: string, status: 'preparing' | 'delivered') {
    if (!booking) return;
    
    const res = await fetch(`/api/bookings/${booking.id}/drink-orders`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status })
    });
    
    if (res.ok) {
      booking = await res.json();
    }
  }
  
  function canConfirmBooking() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'floor_manager') return true;
    return false;
  }
  
  function canRejectBooking() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'floor_manager') return true;
    return false;
  }
  
  function canRequestSupplement() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'floor_manager') return true;
    return false;
  }
  
  function canCompleteSupplement() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'booking_clerk') return true;
    return false;
  }
  
  function canCheckIn() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'floor_manager') return true;
    return false;
  }
  
  function canAddDrink() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'bar_staff') return true;
    if (currentRole === 'floor_manager') return true;
    return false;
  }
  
  function canCompleteBooking() {
    if (currentRole === 'admin') return true;
    if (currentRole === 'bar_staff') return true;
    return false;
  }
  
  onMount(() => {
    loadData();
    
    const observer = new MutationObserver(() => {
      const select = document.querySelector('header select');
      if (select && select.value !== currentRole) {
        currentRole = select.value as any;
      }
    });
    
    observer.observe(document.body, { subtree: true, childList: true });
  });
</script>

{#if loading}
  <div class="text-center py-12 text-gray-500">加载中...</div>
{:else if !booking}
  <div class="text-center py-12 text-gray-500">预订不存在</div>
{:else}
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button class="btn btn-outline" onclick={() => goto('/bookings')}>
        ← 返回列表
      </button>
      <div class="flex-1">
        <h2 class="text-2xl font-bold text-gray-800">
          {booking.customerName}
          <span class="text-sm font-normal text-gray-500 ml-2 font-mono">{booking.bookingNo}</span>
        </h2>
        <div class="flex items-center gap-3 mt-1 flex-wrap">
          <span class="badge badge-{booking.status === 'rejected' ? 'danger' : booking.status === 'supplement_required' ? 'warning' : booking.status === 'completed' ? 'success' : 'info'}">
            {statusNames[booking.status]}
          </span>
          <span class="text-sm text-gray-500">
            预订时间：{formatDateTime(booking.bookedStartTime)} - {formatTime(booking.bookedEndTime)}
          </span>
          {#if booking.issues.some(i => i.status === 'open')}
            <span class="badge badge-danger">
              {booking.issues.filter(i => i.status === 'open').length} 个待处理问题
            </span>
          {/if}
        </div>
      </div>
    </div>

    {#if booking.rejectionReason}
      <div class="card border-red-300 bg-red-50">
        <div class="p-4 border-b border-red-200 flex items-center gap-2">
          <span class="text-red-600 font-semibold">❌ 已驳回</span>
        </div>
        <div class="p-4 text-sm text-red-700">
          <strong>驳回原因：</strong>{booking.rejectionReason}
        </div>
      </div>
    {/if}
    
    {#if booking.supplementRequired}
      <div class="card border-orange-300 bg-orange-50">
        <div class="p-4 border-b border-orange-200 flex items-center justify-between">
          <span class="text-orange-600 font-semibold">⚠️ 需要补充信息</span>
          {#if canCompleteSupplement()}
            <button class="btn btn-primary text-xs py-1 px-3" onclick={completeSupplement}>
              已完成补录
            </button>
          {/if}
        </div>
        <div class="p-4 text-sm text-orange-700">
          <strong>待补充：</strong>{booking.supplementRequired}
        </div>
      </div>
    {/if}

    {#if booking.issues.filter(i => i.status === 'open').length > 0}
      <div class="card border-yellow-300 bg-yellow-50">
        <div class="p-4 border-b border-yellow-200 flex items-center gap-2">
          <span class="text-yellow-600 font-semibold">⚠️ 待处理问题</span>
        </div>
        <div class="divide-y divide-yellow-200">
          {#each booking.issues.filter(i => i.status === 'open') as issue}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div>
                  <span class="badge {getIssueBadgeClass(issue.type)}">{issueTypeNames[issue.type]}</span>
                  <span class="text-sm text-gray-500 ml-2">{issue.createdBy} · {formatDateTime(issue.createdAt)}</span>
                </div>
                <span class="badge badge-danger">待处理</span>
              </div>
              <div class="mt-2 text-sm">
                <div><strong>原因：</strong>{issue.reason}</div>
                {#if issue.supplementaryNotes}
                  <div class="mt-1"><strong>补充说明：</strong>{issue.supplementaryNotes}</div>
                {/if}
              </div>
              {#if (currentRole === 'admin' || 
                (currentRole === 'booking_clerk' && issue.type === 'booking_rejection') ||
                (currentRole === 'floor_manager' && (issue.type === 'room_issue' || issue.type === 'checkin_rejection')) ||
                (currentRole === 'bar_staff' && issue.type === 'drink_issue'))}
                <button class="btn btn-primary text-xs py-1 px-3 mt-3" onclick={() => resolveIssue(issue.id)}>
                  标记已解决
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">包厢信息</div>
        <div class="text-xl font-bold text-blue-600">{booking.roomNo}</div>
        <div class="text-sm text-gray-500 mt-1">
          {roomTypeNames[booking.roomType]} · {booking.hourlyRate}元/小时
        </div>
        <div class="text-sm text-gray-500 mt-1">
          时长：{Math.round((new Date(booking.bookedEndTime).getTime() - new Date(booking.bookedStartTime).getTime()) / 60000)}分钟
        </div>
      </div>

      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">客户信息</div>
        <div class="text-xl font-bold">{booking.customerName}</div>
        <div class="text-sm text-gray-500 mt-1">{booking.customerPhone}</div>
        {#if booking.memberName}
          <div class="text-sm text-purple-600 mt-1">
            会员：{booking.memberName}
            {#if booking.memberLevel}
              <span class="badge badge-purple ml-1">{booking.memberLevel}</span>
            {/if}
          </div>
        {:else}
          <div class="text-sm text-gray-400 mt-1">散客</div>
        {/if}
      </div>

      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">消费金额</div>
        <div class="text-2xl font-bold text-blue-600">¥{booking.totalAmount}</div>
        <div class="text-sm text-gray-500 mt-1">
          包厢费：¥{booking.roomAmount}
        </div>
        <div class="text-sm text-gray-500">
          酒水费：¥{booking.totalDrinkAmount}
        </div>
        <div class="text-sm text-green-600 mt-1">
          已付：¥{booking.paidAmount + booking.useMemberBalance}
        </div>
      </div>

      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">状态时间线</div>
        <div class="text-sm space-y-1">
          {#if booking.createdAt}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>创建：{formatDateTime(booking.createdAt)}</span>
            </div>
          {/if}
          {#if booking.confirmedAt}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span>确认：{formatDateTime(booking.confirmedAt)}</span>
            </div>
          {/if}
          {#if booking.checkedInAt}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>到店：{formatDateTime(booking.checkedInAt)}</span>
            </div>
          {/if}
          {#if booking.completedAt}
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-gray-500"></span>
              <span>完成：{formatDateTime(booking.completedAt)}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab"
        class:active={activeTab === 'overview'}
        onclick={() => activeTab = 'overview'}
      >
        总览
      </button>
      <button 
        class="tab"
        class:active={activeTab === 'drinks'}
        onclick={() => activeTab = 'drinks'}
      >
        酒水订单 ({booking.drinkOrders.length})
      </button>
      <button 
        class="tab"
        class:active={activeTab === 'issues'}
        onclick={() => activeTab = 'issues'}
      >
        问题记录 ({booking.issues.length})
      </button>
      <button 
        class="tab"
        class:active={activeTab === 'notes'}
        onclick={() => activeTab = 'notes'}
      >
        备注历史 ({booking.notes.length})
      </button>
    </div>

    {#if activeTab === 'overview'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">预订处理流程</h3>
            </div>
            <div class="p-4 space-y-4">
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">1</div>
                <div class="flex-1">
                  <div class="font-medium">创建预订</div>
                  <div class="text-sm text-gray-500">{booking.createdBy} · {formatDateTime(booking.createdAt)}</div>
                </div>
                <span class="badge badge-success">已完成</span>
              </div>
              
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-full {booking.status === 'pending' || booking.status === 'supplement_required' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'} flex items-center justify-center font-medium text-sm">2</div>
                <div class="flex-1">
                  <div class="font-medium">确认预订</div>
                  {#if booking.confirmedAt}
                    <div class="text-sm text-gray-500">{booking.confirmedBy} · {formatDateTime(booking.confirmedAt)}</div>
                  {:else}
                    <div class="text-sm text-gray-500">等待确认</div>
                  {/if}
                </div>
                {#if booking.confirmedAt || booking.status === 'rejected'}
                  <span class="badge badge-{booking.status === 'rejected' ? 'danger' : 'success'}">
                    {booking.status === 'rejected' ? '已驳回' : '已完成'}
                  </span>
                {:else if booking.status === 'supplement_required'}
                  <span class="badge badge-warning">待补录</span>
                {:else}
                  <span class="badge badge-warning">待处理</span>
                {/if}
              </div>
              
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-full {booking.status === 'confirmed' || booking.status === 'arrived' ? 'bg-yellow-100 text-yellow-600' : booking.status === 'in_use' || booking.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center font-medium text-sm">3</div>
                <div class="flex-1">
                  <div class="font-medium">到店确认</div>
                  {#if booking.checkedInAt}
                    <div class="text-sm text-gray-500">{booking.checkedInBy} · {formatDateTime(booking.checkedInAt)}</div>
                  {:else}
                    <div class="text-sm text-gray-500">等待客户到店</div>
                  {/if}
                </div>
                {#if booking.checkedInAt}
                  <span class="badge badge-success">已完成</span>
                {:else if booking.status === 'arrived'}
                  <span class="badge badge-info">已到达</span>
                {:else if booking.status === 'confirmed'}
                  <span class="badge badge-gray">待到店</span>
                {:else}
                  <span class="badge badge-gray">未开始</span>
                {/if}
              </div>
              
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 rounded-full {booking.status === 'in_use' ? 'bg-yellow-100 text-yellow-600' : booking.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} flex items-center justify-center font-medium text-sm">4</div>
                <div class="flex-1">
                  <div class="font-medium">结账完成</div>
                  {#if booking.completedAt}
                    <div class="text-sm text-gray-500">{booking.completedBy} · {formatDateTime(booking.completedAt)}</div>
                  {:else}
                    <div class="text-sm text-gray-500">等待使用结束</div>
                  {/if}
                </div>
                {#if booking.completedAt}
                  <span class="badge badge-success">已完成</span>
                {:else if booking.status === 'in_use'}
                  <span class="badge badge-info">使用中</span>
                {:else}
                  <span class="badge badge-gray">未开始</span>
                {/if}
              </div>
            </div>
          </div>
          
          {#if booking.notes.length > 0}
            <div class="card">
              <div class="p-4 border-b border-gray-100">
                <h3 class="font-semibold text-gray-800">最近备注</h3>
              </div>
              <div class="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {#each [...booking.notes].reverse().slice(0, 3) as note}
                  <div class="p-4">
                    <div class="flex items-start gap-3">
                      <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                        {note.createdBy.charAt(0)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-medium text-gray-800">{note.createdBy}</span>
                          <span class="badge badge-{note.type === 'rejection' ? 'danger' : note.type === 'issue' ? 'warning' : note.type === 'supplement' ? 'warning' : 'gray'}">
                            {noteTypeNames[note.type]}
                          </span>
                          <span class="badge badge-gray">{roleNames[note.createdByRole]}</span>
                        </div>
                        <div class="text-sm text-gray-600 mt-1">{note.content}</div>
                        <div class="text-xs text-gray-400 mt-2">{formatDateTime(note.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <div class="space-y-6">
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">处理入口</h3>
            </div>
            <div class="p-4 space-y-3">
              {#if booking.status === 'pending'}
                {#if canConfirmBooking()}
                  <button class="btn btn-primary w-full" onclick={confirmBooking}>
                    ✓ 确认预订
                  </button>
                {/if}
                {#if canRejectBooking()}
                  <button class="btn btn-danger w-full" onclick={() => showRejectModal = true}>
                    ✕ 驳回预订
                  </button>
                {/if}
                {#if canRequestSupplement()}
                  <button class="btn btn-outline w-full" onclick={() => showSupplementModal = true}>
                    ⚠️ 要求补录信息
                  </button>
                {/if}
              {/if}
              
              {#if booking.status === 'supplement_required' && canCompleteSupplement()}
                <button class="btn btn-primary w-full" onclick={completeSupplement}>
                  ✓ 补录完成，提交确认
                </button>
              {/if}
              
              {#if booking.status === 'confirmed' && canCheckIn()}
                <button class="btn btn-primary w-full" onclick={markArrived}>
                  📍 标记客户已到达
                </button>
              {/if}
              
              {#if booking.status === 'arrived' && canCheckIn()}
                <button class="btn btn-primary w-full" onclick={checkIn}>
                  ✓ 确认到店，开始使用
                </button>
              {/if}
              
              {#if booking.status === 'in_use' && canAddDrink()}
                <button class="btn btn-primary w-full" onclick={() => showDrinkModal = true}>
                  🍺 添加酒水订单
                </button>
              {/if}
              
              {#if booking.status === 'in_use' && canCompleteBooking()}
                <button class="btn btn-success w-full" onclick={completeBooking}>
                  💰 结账并完成
                </button>
              {/if}
              
              {#if (currentRole === 'admin' || currentRole === 'floor_manager') && booking.status !== 'completed' && booking.status !== 'rejected'}
                <button class="btn btn-outline w-full" onclick={() => showIssueModal = true}>
                  ⚠️ 记录问题
                </button>
              {/if}
              
              {#if booking.status === 'completed'}
                <div class="text-center py-4 text-green-600 font-medium">
                  ✓ 预订已完成
                </div>
              {/if}
              
              {#if booking.status === 'rejected'}
                <div class="text-center py-4 text-red-600 font-medium">
                  ✕ 预订已驳回
                </div>
              {/if}
            </div>
          </div>

          {#if booking.memberId}
            <div class="card">
              <div class="p-4 border-b border-gray-100">
                <h3 class="font-semibold text-gray-800">会员信息</h3>
              </div>
              {#if getMemberById(booking.memberId)}
                {@const member = getMemberById(booking.memberId)!}
                <div class="p-4 space-y-2">
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-500">会员等级</span>
                    <span class="badge badge-purple">{member.level}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-500">账户余额</span>
                    <span class="font-semibold text-green-600">¥{member.balance}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-500">累计充值</span>
                    <span>¥{member.totalRecharge}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm text-gray-500">积分</span>
                    <span>{member.points}</span>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if activeTab === 'drinks'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">酒水订单</h3>
              {#if booking.status === 'in_use' && canAddDrink()}
                <button class="btn btn-primary text-sm" onclick={() => showDrinkModal = true}>
                  + 添加酒水
                </button>
              {/if}
            </div>
            <div class="divide-y divide-gray-100">
              {#each booking.drinkOrders as order}
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="font-medium">订单 #{order.id.slice(-6)}</div>
                      <div class="text-sm text-gray-500 mt-1">
                        {order.createdBy} · {formatDateTime(order.createdAt)}
                      </div>
                    </div>
                    <span class="badge badge-{order.status === 'delivered' ? 'success' : order.status === 'preparing' ? 'info' : 'warning'}">
                      {order.status === 'pending' ? '待处理' : order.status === 'preparing' ? '准备中' : '已送达'}
                    </span>
                  </div>
                  <div class="mt-3 space-y-1">
                    {#each order.items as item}
                      <div class="flex justify-between text-sm">
                        <span>{item.drinkName} × {item.quantity}</span>
                        <span>¥{item.subtotal}</span>
                      </div>
                    {/each}
                  </div>
                  <div class="mt-2 pt-2 border-t border-gray-100 flex justify-between">
                    <span class="font-medium">合计</span>
                    <span class="font-semibold text-blue-600">¥{order.totalAmount}</span>
                  </div>
                  {#if order.notes}
                    <div class="mt-2 text-sm text-gray-500">
                      备注：{order.notes}
                    </div>
                  {/if}
                  {#if (currentRole === 'bar_staff' || currentRole === 'admin') && order.status === 'pending'}
                    <div class="mt-3 flex gap-2">
                      <button class="btn btn-primary text-xs py-1 px-3" onclick={() => updateDrinkStatus(order.id, 'preparing')}>
                        开始准备
                      </button>
                    </div>
                  {/if}
                  {#if (currentRole === 'bar_staff' || currentRole === 'admin') && order.status === 'preparing'}
                    <div class="mt-3 flex gap-2">
                      <button class="btn btn-success text-xs py-1 px-3" onclick={() => updateDrinkStatus(order.id, 'delivered')}>
                        确认送达
                      </button>
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="p-8 text-center text-gray-400">暂无酒水订单</div>
              {/each}
            </div>
          </div>
        </div>
        
        <div>
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">酒水消费汇总</h3>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-500">订单数量</span>
                <span class="font-medium">{booking.drinkOrders.length} 单</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">酒水总额</span>
                <span class="font-semibold text-blue-600">¥{booking.totalDrinkAmount}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">包厢费</span>
                <span>¥{booking.roomAmount}</span>
              </div>
              <div class="pt-3 border-t border-gray-100 flex justify-between">
                <span class="font-medium">总计</span>
                <span class="text-xl font-bold text-blue-600">¥{booking.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if activeTab === 'issues'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">问题记录（所有原因集中展示）</h3>
            </div>
            <div class="divide-y divide-gray-100">
              {#each [...booking.issues].reverse() as issue}
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-2">
                      <span class="badge {getIssueBadgeClass(issue.type)}">{issueTypeNames[issue.type]}</span>
                      <span class="badge badge-{issue.status === 'open' ? 'danger' : 'success'}">
                        {issue.status === 'open' ? '待处理' : '已解决'}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">
                      {issue.createdBy} · {formatDateTime(issue.createdAt)}
                    </div>
                  </div>
                  <div class="mt-3 space-y-2">
                    <div class="text-sm">
                      <strong>原因：</strong>{issue.reason}
                    </div>
                    {#if issue.supplementaryNotes}
                      <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>补充说明：</strong>{issue.supplementaryNotes}
                      </div>
                    {/if}
                    {#if issue.status === 'resolved' && issue.resolvedAt}
                      <div class="text-xs text-green-600">
                        ✓ 于 {formatDateTime(issue.resolvedAt)} 由 {issue.resolvedBy} 标记解决
                      </div>
                    {/if}
                  </div>
                  {#if issue.status === 'open' && (currentRole === 'admin' || 
                    (currentRole === 'booking_clerk' && issue.type === 'booking_rejection') ||
                    (currentRole === 'floor_manager' && (issue.type === 'room_issue' || issue.type === 'checkin_rejection')) ||
                    (currentRole === 'bar_staff' && issue.type === 'drink_issue'))}
                    <button class="btn btn-primary text-xs py-1 px-3 mt-3" onclick={() => resolveIssue(issue.id)}>
                      标记已解决
                    </button>
                  {/if}
                </div>
              {:else}
                <div class="p-8 text-center text-gray-400">暂无问题记录</div>
              {/each}
            </div>
          </div>
        </div>
        
        <div>
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">记录问题</h3>
            </div>
            <div class="p-4">
              {#if booking.status !== 'completed' && booking.status !== 'rejected'}
                <button class="btn btn-outline w-full" onclick={() => showIssueModal = true}>
                  + 新增问题
                </button>
              {:else}
                <div class="text-center text-gray-400 text-sm">
                  预订已结束，无法新增问题
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if activeTab === 'notes'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">备注历史（包含所有问题与退回记录）</h3>
            </div>
            <div class="divide-y divide-gray-100">
              {#each [...booking.notes].reverse() as note}
                <div class="p-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                      {note.createdBy.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-medium text-gray-800">{note.createdBy}</span>
                        <span class="badge badge-{note.type === 'rejection' ? 'danger' : note.type === 'issue' ? 'warning' : note.type === 'supplement' ? 'warning' : note.type === 'drink' ? 'info' : 'gray'}">
                          {noteTypeNames[note.type]}
                        </span>
                        <span class="badge badge-gray">{roleNames[note.createdByRole]}</span>
                      </div>
                      <div class="text-sm text-gray-600 mt-1">{note.content}</div>
                      <div class="text-xs text-gray-400 mt-2">{formatDateTime(note.createdAt)}</div>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="p-8 text-center text-gray-400">暂无备注</div>
              {/each}
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">添加备注</h3>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <label class="label">备注类型</label>
                <select class="select" bind:value={newNoteType}>
                  <option value="general">通用备注</option>
                  <option value="booking">预订备注</option>
                  <option value="checkin">到店备注</option>
                  <option value="drink">酒水备注</option>
                  <option value="member">会员备注</option>
                </select>
              </div>
              <div>
                <label class="label">备注内容</label>
                <textarea 
                  class="textarea" 
                  placeholder="输入备注内容..."
                  bind:value={newNoteContent}
                ></textarea>
              </div>
              <button 
                class="btn btn-primary w-full" 
                onclick={addNote}
                disabled={!newNoteContent.trim()}
              >
                添加备注
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if showRejectModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">驳回预订</h3>
          <button class="text-gray-400 hover:text-gray-600" onclick={() => showRejectModal = false}>✕</button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="label">驳回原因 <span class="text-red-500">*</span></label>
            <textarea 
              class="textarea" 
              placeholder="请详细描述驳回原因..."
              bind:value={rejectReason}
            ></textarea>
          </div>
          <div>
            <label class="label">补充说明（选填）</label>
            <textarea 
              class="textarea" 
              placeholder="补充说明、处理措施等..."
              bind:value={rejectSupplementary}
            ></textarea>
          </div>
        </div>
        <div class="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button class="btn btn-secondary" onclick={() => showRejectModal = false}>
            取消
          </button>
          <button 
            class="btn btn-danger" 
            onclick={submitReject}
            disabled={!rejectReason.trim()}
          >
            确认驳回
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showSupplementModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">要求补充信息</h3>
          <button class="text-gray-400 hover:text-gray-600" onclick={() => showSupplementModal = false}>✕</button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="label">需要补充的信息 <span class="text-red-500">*</span></label>
            <textarea 
              class="textarea" 
              placeholder="请描述需要补充哪些信息..."
              bind:value={supplementInfo}
            ></textarea>
          </div>
        </div>
        <div class="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button class="btn btn-secondary" onclick={() => showSupplementModal = false}>
            取消
          </button>
          <button 
            class="btn btn-primary" 
            onclick={submitSupplement}
            disabled={!supplementInfo.trim()}
          >
            提交
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showIssueModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">记录问题</h3>
          <button class="text-gray-400 hover:text-gray-600" onclick={() => showIssueModal = false}>✕</button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="label">问题类型</label>
            <select class="select" bind:value={issueType}>
              {#each Object.entries(issueTypeNames) as [value, label]}
                <option value={value}>{label}</option>
              {/each}
            </select>
          </div>
          <div>
            <label class="label">问题原因 <span class="text-red-500">*</span></label>
            <textarea 
              class="textarea" 
              placeholder="请详细描述问题原因..."
              bind:value={issueReason}
            ></textarea>
          </div>
          <div>
            <label class="label">补充说明（选填）</label>
            <textarea 
              class="textarea" 
              placeholder="补充说明、处理措施等..."
              bind:value={issueSupplementary}
            ></textarea>
          </div>
        </div>
        <div class="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button class="btn btn-secondary" onclick={() => showIssueModal = false}>
            取消
          </button>
          <button 
            class="btn btn-primary" 
            onclick={submitIssue}
            disabled={!issueReason.trim()}
          >
            提交
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showDrinkModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">添加酒水订单</h3>
          <button class="text-gray-400 hover:text-gray-600" onclick={() => { showDrinkModal = false; selectedDrinks = []; }}>✕</button>
        </div>
        <div class="p-4 overflow-y-auto flex-1">
          <div class="grid grid-cols-2 gap-3">
            {#each drinkItems as drink}
              <div class="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 transition-colors"
                   class:bg-blue-50={selectedDrinks.some(d => d.drinkId === drink.id)}
                   onclick={() => addDrinkSelection(drink.id)}>
                <div class="flex items-center justify-between">
                  <span class="font-medium">{drink.name}</span>
                  <span class="text-blue-600">¥{drink.price}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">{drink.category} · 库存{drink.stock}{drink.unit}</div>
                {#const selected = selectedDrinks.find(d => d.drinkId === drink.id)}
                {#if selected}
                  <div class="mt-2 flex items-center justify-between">
                    <button class="btn btn-secondary text-xs py-0.5 px-2" 
                            onclick={(e) => { e.stopPropagation(); updateDrinkQuantity(drink.id, selected.quantity - 1); }}>
                      -
                    </button>
                    <span class="font-medium">{selected.quantity}</span>
                    <button class="btn btn-secondary text-xs py-0.5 px-2"
                            onclick={(e) => { e.stopPropagation(); updateDrinkQuantity(drink.id, selected.quantity + 1); }}>
                      +
                    </button>
                    <button class="text-red-500 text-xs"
                            onclick={(e) => { e.stopPropagation(); removeDrinkSelection(drink.id); }}>
                      移除
                    </button>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
        <div class="p-4 border-t border-gray-100">
          <div class="flex items-center justify-between mb-4">
            <span class="font-medium">已选 {selectedDrinks.reduce((sum, d) => sum + d.quantity, 0)} 件</span>
            <span class="text-xl font-bold text-blue-600">¥{calculateDrinkTotal()}</span>
          </div>
          <div class="flex gap-3 justify-end">
            <button class="btn btn-secondary" onclick={() => { showDrinkModal = false; selectedDrinks = []; }}>
              取消
            </button>
            <button 
              class="btn btn-primary" 
              onclick={submitDrinkOrder}
              disabled={selectedDrinks.length === 0}
            >
              确认下单
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}
