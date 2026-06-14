<script lang="ts">
  import { onMount } from 'svelte';
  
  interface CheckInRecord {
    id: string;
    arrangement: {
      exam: { name: string };
      examRoom: { building: string; roomNumber: string };
      date: string;
    };
    student: {
      name: string;
      studentId: string;
      admissionTicket: string;
      department: string;
    };
    seatNumber: string;
    status: string;
    checkedAt: string;
    note?: string;
  }
  
  let records = [];
  let loading = true;
  let filterExam = '';
  let filterStatus = '';
  
  onMount(async () => {
    await loadRecords();
  });
  
  async function loadRecords() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (filterExam) params.append('examId', filterExam);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await fetch(`/api/checkin/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        records = data.records || [];
      }
    } catch (e) {
      console.error('加载签到记录失败:', e);
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
  
  function formatTime(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  }
  
  function getStatusBadge(status: string): string {
    switch (status) {
      case 'PRESENT': return 'badge-confirmed';
      case 'ABSENT': return 'badge-rejected';
      case 'LATE': return 'badge-pending';
      default: return 'bg-gray-100';
    }
  }
  
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'PRESENT': return '已签到';
      case 'ABSENT': return '缺考';
      case 'LATE': return '迟到';
      default: return status;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-4">
    <select 
      bind:value={filterStatus}
      onchange={() => loadRecords()}
      class="input w-40"
    >
      <option value="">全部状态</option>
      <option value="PRESENT">已签到</option>
      <option value="ABSENT">缺考</option>
      <option value="LATE">迟到</option>
    </select>
  </div>
  
  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else if records.length === 0}
    <div class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      <div>暂无签到记录</div>
    </div>
  {:else}
    <div class="card overflow-hidden">
      <table class="table">
        <thead>
          <tr>
            <th>考试名称</th>
            <th>考试日期</th>
            <th>考场</th>
            <th>学生姓名</th>
            <th>准考证号</th>
            <th>座位号</th>
            <th>状态</th>
            <th>签到时间</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          {#each records as record}
            <tr class="hover:bg-gray-50">
              <td>{record.arrangement.exam.name}</td>
              <td>{formatDate(record.arrangement.date)}</td>
              <td>{record.arrangement.examRoom.building} {record.arrangement.examRoom.roomNumber}</td>
              <td>
                <div class="font-medium">{record.student.name}</div>
                <div class="text-sm text-gray-500">{record.student.department}</div>
              </td>
              <td class="font-mono text-sm">{record.student.admissionTicket}</td>
              <td class="font-mono">{record.seatNumber}</td>
              <td>
                <span class="badge {getStatusBadge(record.status)}">{getStatusLabel(record.status)}</span>
              </td>
              <td class="text-sm">{formatTime(record.checkedAt)}</td>
              <td class="text-sm text-gray-500">{record.note || '-'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>