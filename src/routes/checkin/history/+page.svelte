<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Student {
    name: string;
    studentId: string;
    admissionTicket: string;
    department: string;
  }
  
  interface Record {
    id: string;
    type: 'CHECK_IN' | 'ANOMALY';
    arrangement: {
      exam: { name: string };
      examRoom: { building: string; roomNumber: string };
      date: string;
      invigilator?: { name: string };
    };
    student?: Student;
    studentId?: string;
    seatNumber: string;
    status: string;
    checkedAt?: string;
    createdAt?: string;
    note?: string;
    description?: string;
    anomalyType?: string;
    checker?: { name: string };
    reporter?: { name: string };
  }
  
  let records: Record[] = [];
  let loading = true;
  let filterExam = '';
  let filterStatus = '';
  let filterType = '';
  
  const checkInStatuses = [
    { value: '', label: '全部状态' },
    { value: 'PRESENT', label: '已签到' },
    { value: 'ABSENT', label: '缺考' },
    { value: 'LATE', label: '迟到' }
  ];
  
  const anomalyStatuses = [
    { value: '', label: '全部状态' },
    { value: 'REPORTED', label: '已上报' },
    { value: 'PROCESSED', label: '已处理' }
  ];
  
  $: currentStatusOptions = filterType === 'ANOMALY' ? anomalyStatuses : filterType === 'CHECK_IN' ? checkInStatuses : [
    { value: '', label: '全部状态' },
    { value: 'PRESENT', label: '已签到' },
    { value: 'ABSENT', label: '缺考' },
    { value: 'LATE', label: '迟到' },
    { value: 'REPORTED', label: '已上报' },
    { value: 'PROCESSED', label: '已处理' }
  ];
  
  onMount(async () => {
    await loadRecords();
  });
  
  async function loadRecords() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (filterExam) params.append('examId', filterExam);
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);
      
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
  
  function handleTypeChange() {
    filterStatus = '';
    loadRecords();
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
  
  function formatTime(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  }
  
  function getStatusBadge(status: string): string {
    switch (status) {
      case 'PRESENT': return 'badge-confirmed';
      case 'ABSENT': return 'badge-rejected';
      case 'LATE': return 'badge-pending';
      case 'PENDING': return 'bg-gray-100';
      case 'REPORTED': return 'badge-warning';
      case 'PROCESSED': return 'badge-confirmed';
      default: return 'bg-gray-100';
    }
  }
  
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'PRESENT': return '已签到';
      case 'ABSENT': return '缺考';
      case 'LATE': return '迟到';
      case 'PENDING': return '待处理';
      case 'REPORTED': return '已上报';
      case 'PROCESSED': return '已处理';
      default: return status;
    }
  }
  
  function getAnomalyTypeLabel(type: string): string {
    switch (type) {
      case 'ADMISSION_ERROR': return '准考证错误';
      case 'SEAT_CONFLICT': return '座位冲突';
      case 'STUDENT_MISSING': return '学生缺失';
      case 'OTHER': return '其他异常';
      default: return type;
    }
  }
  
  function getTypeBadge(type: string): string {
    return type === 'ANOMALY' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
  }
  
  function getTypeLabel(type: string): string {
    return type === 'ANOMALY' ? '异常上报' : '签到记录';
  }
</script>

<div class="space-y-4">
  <div class="flex items-center gap-4">
    <select 
      bind:value={filterType}
      onchange={handleTypeChange}
      class="input w-36"
    >
      <option value="">全部类型</option>
      <option value="CHECK_IN">签到记录</option>
      <option value="ANOMALY">异常上报</option>
    </select>
    
    <select 
      bind:value={filterStatus}
      onchange={() => loadRecords()}
      class="input w-40"
    >
      {#each currentStatusOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
  
  {#if loading}
    <div class="text-center py-12 text-gray-500">加载中...</div>
  {:else if records.length === 0}
    <div class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
      </svg>
      <div>暂无记录</div>
    </div>
  {:else}
    <div class="card overflow-hidden">
      <table class="table">
        <thead>
          <tr>
            <th class="w-20">记录类型</th>
            <th>考试名称</th>
            <th>考试日期</th>
            <th>考场</th>
            <th>学生姓名</th>
            <th>准考证号</th>
            <th>座位号</th>
            <th>状态</th>
            <th>操作人</th>
            <th>时间</th>
            <th>详情</th>
          </tr>
        </thead>
        <tbody>
          {#each records as record}
            <tr class="hover:bg-gray-50">
              <td>
                <span class="badge {getTypeBadge(record.type)}">{getTypeLabel(record.type)}</span>
              </td>
              <td>{record.arrangement.exam.name}</td>
              <td>{formatDate(record.arrangement.date)}</td>
              <td>{record.arrangement.examRoom.building} {record.arrangement.examRoom.roomNumber}</td>
              <td>
                {#if record.student}
                  <div class="font-medium">{record.student.name}</div>
                  <div class="text-sm text-gray-500">{record.student.department}</div>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </td>
              <td class="font-mono text-sm">
                {record.student?.admissionTicket || '-'}
              </td>
              <td class="font-mono">{record.seatNumber}</td>
              <td>
                <span class="badge {getStatusBadge(record.status)}">{getStatusLabel(record.status)}</span>
              </td>
              <td>
                {record.type === 'CHECK_IN' ? record.checker?.name : record.reporter?.name || '-'}
              </td>
              <td class="text-sm">
                {formatTime(record.type === 'CHECK_IN' ? record.checkedAt : record.createdAt)}
              </td>
              <td>
                {#if record.type === 'ANOMALY'}
                  <div class="text-sm">
                    <div class="text-gray-600">类型: {getAnomalyTypeLabel(record.anomalyType || '')}</div>
                    <div class="text-gray-500 truncate max-w-xs" title={record.description}>{record.description}</div>
                  </div>
                {:else}
                  <span class="text-sm text-gray-500">{record.note || '-'}</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
