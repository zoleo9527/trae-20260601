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
  
  function getSelectedDrink(drinkId: string) {
    return selectedDrinks.find(d => d.drinkId === drinkId);
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
      const select = document.querySelector('header select') as HTMLSelectElement | null;
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

    {#if booking.status === 'rejected'}
      <div class="card border-red-300 bg-red-50">
        <div class="p-4 border-b border-red-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-red-600 font-semibold text-lg">❌ 预订已驳回</span>
            <span class="badge badge-danger">终态</span>
          </div>
          <span class="text-xs text-red-500">
            {booking.notes.find(n => n.type === 'rejection')?.createdBy || '未知'} · {formatDateTime(booking.notes.find(n => n.type === 'rejection')?.createdAt || booking.updatedAt)}
          </span>
        </div>
        <div class="p-4 space-y-3">
          <div class="text-sm text-red-700">
            <strong>驳回原因：</strong>{booking.rejectionReason}
          </div>
          {#if booking.issues.filter(i => i.type === 'booking_rejection').length > 0}
            <div class="bg-white rounded-lg p-3 border border-red-200">
              <div class="text-xs font-medium text-red-600 mb-2">相关问题记录</div>
              {#each booking.issues.filter(i => i.type === 'booking_rejection') as issue}
                <div class="text-sm text-gray-600">
                  {issue.reason}
                  {#if issue.supplementaryNotes}
                    <div class="text-xs text-gray-500 mt-1">补充：{issue.supplementaryNotes}</div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
          <div class="text-xs text-red-500 flex items-center gap-1">
            <span>📌</span>
            此状态为终态，如需重新预订，请创建新的预订记录
          </div>
        </div>
      </div>
    {/if}
    
    {#if booking.status === 'supplement_required'}
      <div class="card border-orange-300 bg-orange-50">
        <div class="p-4 border-b border-orange-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-orange-600 font-semibold text-lg">⚠️ 信息待补录</span>
            <span class="badge badge-warning">处理中</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-orange-500">
              发起：{booking.notes.find(n => n.type === 'supplement')?.createdBy || '未知'}
            </span>
          </div>
        </div>
        <div class="p-4 space-y-3">
          <div class="text-sm text-orange-700">
            <strong>需补充信息：</strong>{booking.supplementRequired}
          </div>
          <div class="bg-white rounded-lg p-3 border border-orange-200">
            <div class="text-xs font-medium text-orange-600 mb-2">补录处理流程</div>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-orange-200 flex items-center justify-center text-xs">1</span>
                <span>预订员联系客户确认缺失信息</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-orange-200 flex items-center justify-center text-xs">2</span>
                <span>在下方更新预订信息</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="w-4 h-4 rounded-full bg-orange-200 flex items-center justify-center text-xs">3</span>
                <span>点击"补录完成"提交确认</span>
              </div>
            </div>
          </div>
          {#if canCompleteSupplement()}
            <button class="btn btn-primary w-full" onclick={completeSupplement}>
              ✓ 补录完成，提交确认
            </button>
          {:else}
            <div class="text-xs text-orange-500 text-center py-2">
              📌 请切换到「预订员」角色进行补录操作
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if booking.issues.filter(i => i.status === 'open').length > 0}
      <div class="card border-yellow-300 bg-yellow-50">
        <div class="p-4 border-b border-yellow-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-yellow-600 font-semibold">🔴 待处理风险项</span>
            <span class="badge badge-danger">{booking.issues.filter(i => i.status === 'open').length} 项</span>
          </div>
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
              <div class="mt-3 flex items-center justify-between">
                <div class="text-xs text-gray-500">
                  处理角色：{issue.type === 'drink_issue' ? '吧台' : issue.type === 'booking_rejection' ? '预订员' : '楼面经理'}
                </div>
                {#if (currentRole === 'admin' || 
                  (currentRole === 'booking_clerk' && issue.type === 'booking_rejection') ||
                  (currentRole === 'floor_manager' && (issue.type === 'room_issue' || issue.type === 'checkin_rejection')) ||
                  (currentRole === 'bar_staff' && issue.type === 'drink_issue'))}
                  <button class="btn btn-primary text-xs py-1 px-3" onclick={() => resolveIssue(issue.id)}>
                    标记已解决
                  </button>
                {:else}
                  <span class="text-xs text-gray-400">无权限处理</span>
                {/if}
              </div>
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
              <h3 class="font-semibold text-gray-800">📊 状态流转时间线</h3>
              <span class="text-xs text-gray-500">包厢预约 → 到店确认 全流程追踪</span>
            </div>
            <div class="p-4">
              <div class="relative">
                <div class="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200"></div>
                
                <div class="relative flex gap-4 pb-6">
                  <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm z-10 flex-shrink-0">1</div>
                  <div class="flex-1 pt-1">
                    <div class="flex items-center justify-between">
                      <div class="font-medium text-gray-800">创建预订</div>
                      <span class="badge badge-success">已完成</span>
                    </div>
                    <div class="text-sm text-gray-500 mt-1">{booking.createdBy} · {formatDateTime(booking.createdAt)}</div>
                    <div class="text-xs text-gray-400 mt-1">预订编号：{booking.bookingNo}</div>
                  </div>
                </div>

                <div class="relative flex gap-4 pb-6">
                  <div class="w-8 h-8 rounded-full {booking.status === 'pending' || booking.status === 'supplement_required' ? 'bg-yellow-500' : booking.status === 'rejected' ? 'bg-red-500' : 'bg-green-500'} flex items-center justify-center text-white font-medium text-sm z-10 flex-shrink-0">2</div>
                  <div class="flex-1 pt-1">
                    <div class="flex items-center justify-between">
                      <div class="font-medium text-gray-800">预订确认</div>
                      {#if booking.confirmedAt}
                        <span class="badge badge-success">已确认</span>
                      {:else if booking.status === 'rejected'}
                        <span class="badge badge-danger">已驳回</span>
                      {:else if booking.status === 'supplement_required'}
                        <span class="badge badge-warning">待补录</span>
                      {:else}
                        <span class="badge badge-warning">待处理</span>
                      {/if}
                    </div>
                    {#if booking.confirmedAt}
                      <div class="text-sm text-gray-500 mt-1">{booking.confirmedBy} · {formatDateTime(booking.confirmedAt)}</div>
                    {:else if booking.status === 'rejected'}
                      <div class="text-sm text-red-600 mt-1">驳回原因：{booking.rejectionReason}</div>
                    {:else if booking.status === 'supplement_required'}
                      <div class="text-sm text-orange-600 mt-1">待补：{booking.supplementRequired}</div>
                    {:else}
                      <div class="text-sm text-gray-400 mt-1">等待楼面经理确认</div>
                    {/if}
                    {#if booking.status === 'supplement_required' || booking.status === 'rejected'}
                      <div class="mt-2 p-2 rounded bg-gray-50 text-xs">
                        <span class="text-gray-500">📌 处理角色：</span>
                        <span class="font-medium">{booking.status === 'supplement_required' ? '预订员补录信息 → 楼面经理确认' : '楼面经理驳回'}</span>
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="relative flex gap-4 pb-6">
                  <div class="w-8 h-8 rounded-full {booking.status === 'confirmed' ? 'bg-blue-500' : booking.status === 'arrived' ? 'bg-purple-500' : booking.checkedInAt ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center text-white font-medium text-sm z-10 flex-shrink-0">3</div>
                  <div class="flex-1 pt-1">
                    <div class="flex items-center justify-between">
                      <div class="font-medium text-gray-800">到店确认</div>
                      {#if booking.checkedInAt}
                        <span class="badge badge-success">已到店</span>
                      {:else if booking.status === 'arrived'}
                        <span class="badge badge-purple">客户已到达</span>
                      {:else if booking.status === 'confirmed'}
                        <span class="badge badge-info">待到店</span>
                      {:else}
                        <span class="badge badge-gray">未开始</span>
                      {/if}
                    </div>
                    {#if booking.checkedInAt}
                      <div class="text-sm text-gray-500 mt-1">{booking.checkedInBy} · {formatDateTime(booking.checkedInAt)}</div>
                      <div class="text-xs text-green-600 mt-1">✓ 包厢已开始使用，实际开始时间：{formatTime(booking.actualStartTime)}</div>
                    {:else if booking.status === 'arrived'}
                      <div class="text-sm text-purple-600 mt-1">客户已到达门店，正在安排包厢</div>
                    {:else if booking.status === 'confirmed'}
                      <div class="text-sm text-blue-600 mt-1">预计到店时间：{formatDateTime(booking.bookedStartTime)}</div>
                      <div class="mt-2 p-2 rounded bg-blue-50 text-xs">
                        <span class="text-blue-600">📌 处理角色：</span>
                        <span class="font-medium">楼面经理接待并确认到店</span>
                      </div>
                    {:else}
                      <div class="text-sm text-gray-400 mt-1">等待预订确认完成</div>
                    {/if}
                  </div>
                </div>

                <div class="relative flex gap-4">
                  <div class="w-8 h-8 rounded-full {booking.status === 'in_use' ? 'bg-yellow-500' : booking.completedAt ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center text-white font-medium text-sm z-10 flex-shrink-0">4</div>
                  <div class="flex-1 pt-1">
                    <div class="flex items-center justify-between">
                      <div class="font-medium text-gray-800">结账完成</div>
                      {#if booking.completedAt}
                        <span class="badge badge-success">已完成</span>
                      {:else if booking.status === 'in_use'}
                        <span class="badge badge-info">使用中</span>
                      {:else}
                        <span class="badge badge-gray">未开始</span>
                      {/if}
                    </div>
                    {#if booking.completedAt}
                      <div class="text-sm text-gray-500 mt-1">{booking.completedBy} · {formatDateTime(booking.completedAt)}</div>
                      <div class="text-xs text-gray-500 mt-1">
                        实际时长：{booking.actualEndTime && booking.actualStartTime ? Math.round((new Date(booking.actualEndTime).getTime() - new Date(booking.actualStartTime).getTime()) / 60000) : '-'} 分钟
                      </div>
                    {:else if booking.status === 'in_use'}
                      <div class="text-sm text-yellow-600 mt-1">预计结束时间：{formatTime(booking.bookedEndTime)}</div>
                      <div class="mt-2 p-2 rounded bg-yellow-50 text-xs">
                        <span class="text-yellow-600">📌 处理角色：</span>
                        <span class="font-medium">吧台负责结账收款</span>
                      </div>
                    {:else}
                      <div class="text-sm text-gray-400 mt-1">等待客户到店使用</div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {#if booking.checkedInAt}
            <div class="card border-green-200 bg-green-50">
              <div class="p-4 border-b border-green-200">
                <h3 class="font-semibold text-green-800 flex items-center gap-2">
                  <span>📋</span> 到店确认回看
                </h3>
              </div>
              <div class="p-4 space-y-3">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-gray-500">预订时间</span>
                    <div class="font-medium mt-1">{formatDateTime(booking.bookedStartTime)} - {formatTime(booking.bookedEndTime)}</div>
                  </div>
                  <div>
                    <span class="text-gray-500">实际到店</span>
                    <div class="font-medium mt-1 text-green-600">{formatDateTime(booking.checkedInAt)}</div>
                  </div>
                  <div>
                    <span class="text-gray-500">确认人</span>
                    <div class="font-medium mt-1">{booking.checkedInBy}</div>
                  </div>
                  <div>
                    <span class="text-gray-500">包厢</span>
                    <div class="font-medium mt-1">{booking.roomNo} ({roomTypeNames[booking.roomType]})</div>
                  </div>
                </div>
                {#if booking.notes.filter(n => n.type === 'checkin').length > 0}
                  <div class="mt-3 pt-3 border-t border-green-200">
                    <div class="text-xs text-gray-500 mb-2">到店备注</div>
                    {#each booking.notes.filter(n => n.type === 'checkin') as note}
                      <div class="text-sm text-gray-700 bg-white rounded p-2">
                        {note.content}
                        <div class="text-xs text-gray-400 mt-1">{note.createdBy} · {formatDateTime(note.createdAt)}</div>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          {/if}
          
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
                {#if getSelectedDrink(drink.id)}
                  <div class="mt-2 flex items-center justify-between">
                    <button class="btn btn-secondary text-xs py-0.5 px-2" 
                            onclick={(e) => { e.stopPropagation(); updateDrinkQuantity(drink.id, (getSelectedDrink(drink.id)?.quantity || 1) - 1); }}>
                      -
                    </button>
                    <span class="font-medium">{getSelectedDrink(drink.id)?.quantity}</span>
                    <button class="btn btn-secondary text-xs py-0.5 px-2"
                            onclick={(e) => { e.stopPropagation(); updateDrinkQuantity(drink.id, (getSelectedDrink(drink.id)?.quantity || 1) + 1); }}>
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
