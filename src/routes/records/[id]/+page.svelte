<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import type { ConsumptionRecord, Technician, Schedule, ServiceRecord, Note } from '$lib/types';
  import { goto } from '$app/navigation';
  
  let record: ConsumptionRecord | null = $state(null);
  let technicians: Technician[] = $state([]);
  let loading = $state(true);
  let activeTab = $state<'overview' | 'scheduling' | 'service' | 'notes'>('overview');
  let currentRole = $state<'reception' | 'floor_supervisor' | 'finance' | 'admin'>('admin');
  
  let newNoteContent = $state('');
  let newNoteType = $state<'scheduling' | 'service' | 'general'>('general');
  
  let showScheduleModal = $state(false);
  let newSchedule = $state({
    technicianId: '',
    serviceItem: '',
    duration: 60,
    roomNo: '',
    notes: ''
  });
  
  const statusNames: Record<string, string> = {
    checkin: '已登记',
    scheduling: '待排班',
    in_service: '服务中',
    service_completed: '服务完成',
    checkout_pending: '待结账',
    completed: '已完成',
    cancelled: '已取消'
  };
  
  const handTagStatusNames: Record<string, string> = {
    normal: '正常',
    lost: '遗失',
    returned: '已归还'
  };
  
  const lockerStatusNames: Record<string, string> = {
    normal: '正常',
    complaint: '投诉',
    maintenance: '维修中'
  };
  
  const noteTypeNames: Record<string, string> = {
    scheduling: '排班备注',
    service: '服务备注',
    general: '通用备注',
    rejection: '退回原因'
  };
  
  const roleNames: Record<string, string> = {
    reception: '前台',
    floor_supervisor: '楼层主管',
    finance: '财务',
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
  
  function calculateDuration(start: string | Date | null, end: string | Date | null) {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / 60000);
  }
  
  function getTechnicianById(id: string) {
    return technicians.find(t => t.id === id);
  }
  
  async function loadData() {
    loading = true;
    try {
      const select = document.querySelector('header select');
      if (select?.value) {
        currentRole = select.value as any;
      }
      
      const [recordRes, techRes] = await Promise.all([
        fetch(`/api/records/${$page.params.id}`),
        fetch('/api/technicians')
      ]);
      
      record = await recordRes.json();
      technicians = await techRes.json();
    } finally {
      loading = false;
    }
  }
  
  async function updateStatus(newStatus: ConsumptionRecord['status']) {
    if (!record) return;
    
    const res = await fetch(`/api/records/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) {
      record = await res.json();
    }
  }
  
  async function addNote() {
    if (!record || !newNoteContent.trim()) return;
    
    const res = await fetch(`/api/records/${record.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newNoteContent,
        createdBy: '当前用户',
        createdByRole: currentRole,
        type: newNoteType
      })
    });
    
    if (res.ok) {
      record = await res.json();
      newNoteContent = '';
    }
  }
  
  async function updateHandTagStatus(status: 'normal' | 'lost' | 'returned') {
    if (!record) return;
    
    const res = await fetch(`/api/records/${record.id}/hand-tag`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      record = await res.json();
    }
  }
  
  async function updateLockerStatus(status: 'normal' | 'complaint' | 'maintenance') {
    if (!record) return;
    
    const res = await fetch(`/api/records/${record.id}/locker`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    
    if (res.ok) {
      record = await res.json();
    }
  }
  
  async function startService(scheduleId: string) {
    if (!record) return;
    
    const res = await fetch(`/api/records/${record.id}/service-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduleId,
        startTime: new Date().toISOString(),
        notes: ''
      })
    });
    
    if (res.ok) {
      record = await res.json();
      await updateStatus('in_service');
    }
  }
  
  async function endService(serviceId: string, scheduleId: string) {
    if (!record) return;
    
    const endTime = new Date();
    const schedule = record.schedules.find(s => s.id === scheduleId);
    const startTime = record.serviceRecords.find(s => s.id === serviceId)?.startTime;
    const actualDuration = startTime ? calculateDuration(startTime, endTime) : null;
    
    const res = await fetch(`/api/records/${record.id}/service-records`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId,
        endTime: endTime.toISOString(),
        actualDuration,
        completed: true
      })
    });
    
    if (res.ok) {
      record = await res.json();
      
      const allCompleted = record.schedules.every(s => {
        const svc = record!.serviceRecords.find(sr => sr.scheduleId === s.id);
        return svc?.completed;
      });
      
      if (allCompleted) {
        await updateStatus('service_completed');
      }
    }
  }
  
  async function createSchedule() {
    if (!record || !newSchedule.technicianId || !newSchedule.serviceItem || !newSchedule.roomNo) return;
    
    const tech = getTechnicianById(newSchedule.technicianId);
    
    const res = await fetch(`/api/records/${record.id}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newSchedule,
        technicianName: tech?.name || '',
        technicianNo: tech?.no || ''
      })
    });
    
    if (res.ok) {
      record = await res.json();
      showScheduleModal = false;
      newSchedule = { technicianId: '', serviceItem: '', duration: 60, roomNo: '', notes: '' };
    }
  }
  
  async function processPayment() {
    if (!record) return;
    
    const res = await fetch(`/api/records/${record.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: record.totalAmount })
    });
    
    if (res.ok) {
      record = await res.json();
      await updateStatus('completed');
    }
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
{:else if !record}
  <div class="text-center py-12 text-gray-500">记录不存在</div>
{:else}
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button class="btn btn-outline" onclick={() => goto('/records')}>
        ← 返回列表
      </button>
      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          {record.customerName}
          <span class="text-sm font-normal text-gray-500 ml-2 font-mono">{record.id}</span>
        </h2>
        <div class="flex items-center gap-3 mt-1">
          <span class="badge badge-info">{statusNames[record.status]}</span>
          <span class="text-sm text-gray-500">
            到店时间：{formatDateTime(record.checkinTime)}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">手牌号码</div>
        <div class="flex items-center justify-between">
          <span class:text-red-600={record.handTagStatus === 'lost'} class="text-xl font-bold">
            {record.handTagNo}
          </span>
          <span class="badge badge-{record.handTagStatus === 'lost' ? 'danger' : 'success'}">
            {handTagStatusNames[record.handTagStatus]}
          </span>
        </div>
        {#if currentRole === 'reception' || currentRole === 'admin'}
          <div class="flex gap-2 mt-3">
            {#if record.handTagStatus !== 'lost'}
              <button class="btn btn-danger text-xs py-1 px-2" onclick={() => updateHandTagStatus('lost')}>
                标记遗失
              </button>
            {/if}
            {#if record.handTagStatus !== 'returned'}
              <button class="btn btn-secondary text-xs py-1 px-2" onclick={() => updateHandTagStatus('returned')}>
                归还手牌
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">储物柜</div>
        <div class="flex items-center justify-between">
          <span class:text-orange-600={record.lockerStatus === 'complaint'} class="text-xl font-bold">
            {record.lockerNo}
          </span>
          <span class="badge badge-{record.lockerStatus === 'complaint' ? 'warning' : record.lockerStatus === 'maintenance' ? 'danger' : 'success'}">
            {lockerStatusNames[record.lockerStatus]}
          </span>
        </div>
        {#if currentRole === 'floor_supervisor' || currentRole === 'admin'}
          <div class="flex gap-2 mt-3">
            {#if record.lockerStatus !== 'complaint'}
              <button class="btn btn-secondary text-xs py-1 px-2" onclick={() => updateLockerStatus('complaint')}>
                标记投诉
              </button>
            {/if}
            {#if record.lockerStatus !== 'normal'}
              <button class="btn btn-secondary text-xs py-1 px-2" onclick={() => updateLockerStatus('normal')}>
                恢复正常
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">消费总额</div>
        <div class="text-2xl font-bold text-blue-600">¥{record.totalAmount}</div>
        <div class="text-sm text-gray-500 mt-1">
          已付：¥{record.paidAmount}
        </div>
      </div>

      <div class="card p-4">
        <div class="text-sm text-gray-500 mb-1">服务项目</div>
        <div class="text-2xl font-bold">{record.schedules.length} 项</div>
        <div class="text-sm text-gray-500 mt-1">
          {record.serviceRecords.filter(s => s.completed).length} 项已完成
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
        class:active={activeTab === 'scheduling'}
        onclick={() => activeTab = 'scheduling'}
      >
        技师排班
      </button>
      <button 
        class="tab"
        class:active={activeTab === 'service'}
        onclick={() => activeTab = 'service'}
      >
        服务计时
      </button>
      <button 
        class="tab"
        class:active={activeTab === 'notes'}
        onclick={() => activeTab = 'notes'}
      >
        备注历史 ({record.notes.length})
      </button>
    </div>

    {#if activeTab === 'overview'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 class="font-semibold text-gray-800">排班与服务进度</h3>
            </div>
            <div class="divide-y divide-gray-100">
              {#each record.schedules as schedule}
                {@const serviceRecord = record.serviceRecords.find(s => s.scheduleId === schedule.id)}
                <div class="p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="font-medium">{schedule.serviceItem}</div>
                      <div class="text-sm text-gray-500 mt-1">
                        {schedule.technicianName}（{schedule.technicianNo}号）· {schedule.roomNo} · {schedule.duration}分钟
                      </div>
                      {#if schedule.notes}
                        <div class="text-sm text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                          💡 排班备注：{schedule.notes}
                        </div>
                      {/if}
                    </div>
                    <div>
                      {#if !serviceRecord}
                        <span class="badge badge-gray">待开始</span>
                      {:else if serviceRecord.completed}
                        <span class="badge badge-success">已完成</span>
                      {:else}
                        <span class="badge badge-info">进行中</span>
                      {/if}
                    </div>
                  </div>
                  {#if serviceRecord}
                    <div class="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <div>开始时间：{formatDateTime(serviceRecord.startTime)}</div>
                      {#if serviceRecord.endTime}
                        <div>结束时间：{formatDateTime(serviceRecord.endTime)}</div>
                        <div>实际时长：{serviceRecord.actualDuration} 分钟</div>
                      {/if}
                      {#if serviceRecord.notes}
                        <div class="mt-2 text-blue-600">服务备注：{serviceRecord.notes}</div>
                      {/if}
                    </div>
                  {/if}
                </div>
              {:else}
                <div class="p-8 text-center text-gray-400">暂无排班</div>
              {/each}
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">状态流转</h3>
            </div>
            <div class="p-4 space-y-3">
              {#if record.status === 'scheduling' && (currentRole === 'floor_supervisor' || currentRole === 'admin')}
                <button class="btn btn-primary w-full" onclick={() => showScheduleModal = true}>
                  + 添加排班
                </button>
              {/if}
              
              {#if record.status === 'scheduling' && record.schedules.length > 0 && (currentRole === 'floor_supervisor' || currentRole === 'admin')}
                <button class="btn btn-primary w-full" onclick={() => updateStatus('in_service')}>
                  开始服务
                </button>
              {/if}
              
              {#if record.status === 'in_service' && (currentRole === 'floor_supervisor' || currentRole === 'admin')}
                <button class="btn btn-success w-full" onclick={() => updateStatus('service_completed')}>
                  标记服务完成
                </button>
              {/if}
              
              {#if record.status === 'service_completed' && (currentRole === 'finance' || currentRole === 'admin')}
                <button class="btn btn-primary w-full" onclick={processPayment}>
                  确认收款并结账 ¥{record.totalAmount}
                </button>
              {/if}
              
              {#if record.status === 'completed'}
                <div class="text-center py-4 text-green-600 font-medium">
                  ✓ 订单已完成
                </div>
              {/if}
            </div>
          </div>

          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">附件（占位）</h3>
            </div>
            <div class="p-4">
              <div class="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-400 text-sm">
                拖拽文件到此处或点击上传
                <div class="text-xs mt-1">支持图片、PDF 等格式</div>
              </div>
              {#if record.attachments.length > 0}
                <div class="mt-3 space-y-2">
                  {#each record.attachments as att}
                    <div class="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      📎 {att}
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          {#if record.rejectionReason}
            <div class="card border-red-200 bg-red-50">
              <div class="p-4 border-b border-red-100">
                <h3 class="font-semibold text-red-800">退回原因</h3>
              </div>
              <div class="p-4 text-sm text-red-700">
                {record.rejectionReason}
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if activeTab === 'scheduling'}
      <div class="card">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">技师排班管理</h3>
          {#if (currentRole === 'floor_supervisor' || currentRole === 'admin') && record.status !== 'completed'}
            <button class="btn btn-primary" onclick={() => showScheduleModal = true}>
              + 添加排班
            </button>
          {/if}
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>服务项目</th>
                <th>技师</th>
                <th>房间</th>
                <th>时长</th>
                <th>排班备注</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {#each record.schedules as schedule}
                {@const serviceRecord = record.serviceRecords.find(s => s.scheduleId === schedule.id)}
                <tr>
                  <td class="font-medium">{schedule.serviceItem}</td>
                  <td>{schedule.technicianName}（{schedule.technicianNo}号）</td>
                  <td>{schedule.roomNo}</td>
                  <td>{schedule.duration} 分钟</td>
                  <td class="text-sm text-orange-600">{schedule.notes || '-'}</td>
                  <td>
                    {#if !serviceRecord}
                      <span class="badge badge-gray">待开始</span>
                    {:else if serviceRecord.completed}
                      <span class="badge badge-success">已完成</span>
                    {:else}
                      <span class="badge badge-info">进行中</span>
                    {/if}
                  </td>
                  <td>
                    {#if !serviceRecord && (currentRole === 'floor_supervisor' || currentRole === 'admin') && record.status !== 'completed'}
                      <button class="btn btn-primary text-xs py-1 px-3" onclick={() => startService(schedule.id)}>
                        开始服务
                      </button>
                    {/if}
                    {#if serviceRecord && !serviceRecord.completed && (currentRole === 'floor_supervisor' || currentRole === 'admin')}
                      <button class="btn btn-success text-xs py-1 px-3" onclick={() => endService(serviceRecord.id, schedule.id)}>
                        结束服务
                      </button>
                    {/if}
                  </td>
                </tr>
              {:else}
                <tr>
                  <td colspan="7" class="text-center py-8 text-gray-400">暂无排班记录</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mt-6">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-800">可用技师</h3>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {#each technicians as tech}
            <div class="border border-gray-200 rounded-lg p-3">
              <div class="flex items-center justify-between">
                <span class="font-medium">{tech.name}</span>
                <span class="text-sm text-gray-500">{tech.no}号</span>
              </div>
              <div class="mt-1">
                <span class="badge badge-{tech.status === 'available' ? 'success' : tech.status === 'busy' ? 'warning' : 'gray'}">
                  {tech.status === 'available' ? '空闲' : tech.status === 'busy' ? '服务中' : '休息'}
                </span>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                {tech.skills.join('、')}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if activeTab === 'service'}
      <div class="card">
        <div class="p-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-800">服务计时回看</h3>
        </div>
        <div class="divide-y divide-gray-100">
          {#each record.serviceRecords as sr}
            {@const schedule = record.schedules.find(s => s.id === sr.scheduleId)}
            <div class="p-4">
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-medium">{schedule?.serviceItem}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    {schedule?.technicianName}（{schedule?.technicianNo}号）
                  </div>
                </div>
                <span class="badge badge-{sr.completed ? 'success' : 'info'}">
                  {sr.completed ? '已完成' : '进行中'}
                </span>
              </div>
              
              <div class="mt-4 grid grid-cols-3 gap-4">
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">开始时间</div>
                  <div class="font-mono text-sm mt-1">{formatDateTime(sr.startTime)}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">结束时间</div>
                  <div class="font-mono text-sm mt-1">{sr.endTime ? formatDateTime(sr.endTime) : '-'}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-xs text-gray-500">实际时长</div>
                  <div class="font-mono text-sm mt-1">
                    {sr.actualDuration != null ? `${sr.actualDuration} 分钟` : '-'}
                    {#if schedule && sr.actualDuration != null}
                      <span class="text-xs text-gray-400 ml-2">
                        (计划 {schedule.duration} 分钟)
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
              
              {#if schedule?.notes}
                <div class="mt-3 text-sm text-orange-600 bg-orange-50 p-3 rounded">
                  <strong>排班备注：</strong>{schedule.notes}
                </div>
              {/if}
              
              {#if sr.notes}
                <div class="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded">
                  <strong>服务备注：</strong>{sr.notes}
                </div>
              {/if}
              
              {#if !sr.completed && (currentRole === 'floor_supervisor' || currentRole === 'admin')}
                <div class="mt-4">
                  <button class="btn btn-success" onclick={() => endService(sr.id, sr.scheduleId)}>
                    结束服务计时
                  </button>
                </div>
              {/if}
            </div>
          {:else}
            <div class="p-8 text-center text-gray-400">暂无服务记录</div>
          {/each}
        </div>
      </div>
    {/if}

    {#if activeTab === 'notes'}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card">
            <div class="p-4 border-b border-gray-100">
              <h3 class="font-semibold text-gray-800">备注历史</h3>
            </div>
            <div class="divide-y divide-gray-100">
              {#each [...record.notes].reverse() as note}
                <div class="p-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                      {note.createdBy.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-800">{note.createdBy}</span>
                        <span class="badge badge-{note.type === 'scheduling' ? 'warning' : note.type === 'service' ? 'info' : note.type === 'rejection' ? 'danger' : 'gray'}">
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
                  <option value="scheduling">排班备注</option>
                  <option value="service">服务备注</option>
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

  {#if showScheduleModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div class="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-800">添加排班</h3>
          <button class="text-gray-400 hover:text-gray-600" onclick={() => showScheduleModal = false}>✕</button>
        </div>
        <div class="p-4 space-y-4">
          <div>
            <label class="label">服务项目</label>
            <input 
              type="text" 
              class="input" 
              placeholder="如：经典足疗（90分钟）"
              bind:value={newSchedule.serviceItem}
            />
          </div>
          <div>
            <label class="label">选择技师</label>
            <select class="select" bind:value={newSchedule.technicianId}>
              <option value="">请选择技师</option>
              {#each technicians.filter(t => t.status === 'available') as tech}
                <option value={tech.id}>{tech.no}号 - {tech.name} ({tech.skills.join('、')})</option>
              {/each}
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">时长（分钟）</label>
              <input 
                type="number" 
                class="input" 
                bind:value={newSchedule.duration}
              />
            </div>
            <div>
              <label class="label">房间号</label>
              <input 
                type="text" 
                class="input" 
                placeholder="如：302"
                bind:value={newSchedule.roomNo}
              />
            </div>
          </div>
          <div>
            <label class="label">排班备注（将传递给服务）</label>
            <textarea 
              class="textarea" 
              placeholder="特殊要求、客户偏好等..."
              bind:value={newSchedule.notes}
            ></textarea>
          </div>
        </div>
        <div class="p-4 border-t border-gray-100 flex gap-3 justify-end">
          <button class="btn btn-secondary" onclick={() => showScheduleModal = false}>
            取消
          </button>
          <button class="btn btn-primary" onclick={createSchedule}>
            确认添加
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}
