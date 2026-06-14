<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  interface Student {
    id: string;
    name: string;
    studentId: string;
    admissionTicket: string;
    department: string;
    major: string;
    seatNumber: string;
    checkInStatus: string;
  }
  
  interface Arrangement {
    id: string;
    exam: { name: string };
    examRoom: { building: string; roomNumber: string };
    date: string;
    startTime: string;
    endTime: string;
  }
  
  let arrangement = null;
  let students = [];
  let loading = true;
  let selectedStudents = [];
  let showAnomalyModal = false;
  let anomalyType = 'ADMISSION_ERROR';
  let anomalyDescription = '';
  let anomalyStudentId = '';
  
  const id = $page.params.id;
  
  onMount(async () => {
    await loadData();
  });
  
  async function loadData() {
    loading = true;
    try {
      const response = await fetch(`/api/checkin/${id}`);
      if (response.ok) {
        const data = await response.json();
        arrangement = data.arrangement;
        students = data.students || [];
      }
    } catch (e) {
      console.error('加载签到数据失败:', e);
    } finally {
      loading = false;
    }
  }
  
  async function handleCheckIn(studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') {
    try {
      const response = await fetch(`/api/checkin/${id}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, status })
      });
      
      if (response.ok) {
        await loadData();
      }
    } catch (e) {
      console.error('签到失败:', e);
    }
  }
  
  function toggleSelect(studentId: string) {
    const index = selectedStudents.indexOf(studentId);
    if (index > -1) {
      selectedStudents = selectedStudents.filter(id => id !== studentId);
    } else {
      selectedStudents = [...selectedStudents, studentId];
    }
  }
  
  function toggleSelectAll() {
    const uncheckedStudents = students.filter(s => s.checkInStatus === 'PENDING').map(s => s.id);
    if (selectedStudents.length === uncheckedStudents.length) {
      selectedStudents = [];
    } else {
      selectedStudents = uncheckedStudents;
    }
  }
  
  async function handleBatchCheckIn(status: 'PRESENT' | 'ABSENT') {
    if (selectedStudents.length === 0) return;
    
    try {
      const response = await fetch(`/api/checkin/${id}/batch-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students: selectedStudents.map(id => ({ studentId: id, status }))
        })
      });
      
      if (response.ok) {
        selectedStudents = [];
        await loadData();
      }
    } catch (e) {
      console.error('批量签到失败:', e);
    }
  }
  
  function openAnomalyModal(studentId?: string) {
    anomalyStudentId = studentId || '';
    anomalyType = 'ADMISSION_ERROR';
    anomalyDescription = '';
    showAnomalyModal = true;
  }
  
  async function handleReportAnomaly() {
    try {
      const response = await fetch(`/api/checkin/${id}/report-anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: anomalyType,
          description: anomalyDescription,
          studentId: anomalyStudentId
        })
      });
      
      if (response.ok) {
        showAnomalyModal = false;
      }
    } catch (e) {
      console.error('上报异常失败:', e);
    }
  }
  
  function getStatusBadge(status: string): string {
    switch (status) {
      case 'PRESENT': return 'badge-confirmed';
      case 'ABSENT': return 'badge-rejected';
      case 'LATE': return 'badge-pending';
      case 'PENDING': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
  
  function getStatusLabel(status: string): string {
    switch (status) {
      case 'PRESENT': return '已签到';
      case 'ABSENT': return '缺考';
      case 'LATE': return '迟到';
      case 'PENDING': return '待签到';
      default: return status;
    }
  }
  
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }
  
  $: stats = {
    total: students.length,
    present: students.filter(s => s.checkInStatus === 'PRESENT').length,
    absent: students.filter(s => s.checkInStatus === 'ABSENT').length,
    pending: students.filter(s => s.checkInStatus === 'PENDING').length
  };
</script>

{#if loading}
  <div class="text-center py-12 text-gray-500">加载中...</div>
{:else if arrangement}
  <div class="space-y-6">
    <div class="card p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-semibold text-gray-800">{arrangement.exam.name}</h2>
          <div class="text-sm text-gray-600 mt-1">
            {formatDate(arrangement.date)} {arrangement.startTime} - {arrangement.endTime} | 
            {arrangement.examRoom.building} {arrangement.examRoom.roomNumber}
          </div>
        </div>
        
        <button 
          onclick={() => openAnomalyModal()}
          class="btn btn-danger"
        >
          上报异常
        </button>
      </div>
      
      <div class="grid grid-cols-4 gap-4">
        <div class="text-center p-4 rounded-md bg-gray-50">
          <div class="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div class="text-sm text-gray-500">总人数</div>
        </div>
        
        <div class="text-center p-4 rounded-md bg-success/10">
          <div class="text-2xl font-bold text-success">{stats.present}</div>
          <div class="text-sm text-gray-500">已签到</div>
        </div>
        
        <div class="text-center p-4 rounded-md bg-danger/10">
          <div class="text-2xl font-bold text-danger">{stats.absent}</div>
          <div class="text-sm text-gray-500">缺考</div>
        </div>
        
        <div class="text-center p-4 rounded-md bg-warning/10">
          <div class="text-2xl font-bold text-warning">{stats.pending}</div>
          <div class="text-sm text-gray-500">待签到</div>
        </div>
      </div>
    </div>
    
    {#if selectedStudents.length > 0}
      <div class="flex items-center gap-3 bg-primary-50 p-4 rounded-md">
        <span class="text-primary font-medium">已选择 {selectedStudents.length} 人</span>
        <button 
          onclick={() => handleBatchCheckIn('PRESENT')}
          class="btn btn-success"
        >
          批量签到
        </button>
        <button 
          onclick={() => handleBatchCheckIn('ABSENT')}
          class="btn btn-danger"
        >
          批量缺考
        </button>
        <button 
          onclick={() => selectedStudents = []}
          class="btn btn-secondary"
        >
          取消选择
        </button>
      </div>
    {/if}
    
    <div class="card overflow-hidden">
      <table class="table">
        <thead>
          <tr>
            <th class="w-12">
              <input 
                type="checkbox"
                checked={selectedStudents.length === students.filter(s => s.checkInStatus === 'PENDING').length && students.filter(s => s.checkInStatus === 'PENDING').length > 0}
                onchange={toggleSelectAll}
                class="w-4 h-4 rounded"
              />
            </th>
            <th>座位号</th>
            <th>姓名</th>
            <th>学号</th>
            <th>准考证号</th>
            <th>院系/专业</th>
            <th>状态</th>
            <th class="w-32">操作</th>
          </tr>
        </thead>
        <tbody>
          {#each students as student}
            <tr class="hover:bg-gray-50">
              <td>
                {#if student.checkInStatus === 'PENDING'}
                  <input 
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onchange={() => toggleSelect(student.id)}
                    class="w-4 h-4 rounded"
                  />
                {:else}
                  <div class="w-4 h-4"></div>
                {/if}
              </td>
              <td>
                <span class="font-mono font-medium">{student.seatNumber}</span>
              </td>
              <td>
                <span class="font-medium text-gray-800">{student.name}</span>
              </td>
              <td>
                <span class="font-mono text-sm">{student.studentId}</span>
              </td>
              <td>
                <span class="font-mono text-sm">{student.admissionTicket}</span>
              </td>
              <td>
                <div class="text-sm">{student.department}</div>
                <div class="text-xs text-gray-500">{student.major}</div>
              </td>
              <td>
                <span class="badge {getStatusBadge(student.checkInStatus)}">{getStatusLabel(student.checkInStatus)}</span>
              </td>
              <td>
                {#if student.checkInStatus === 'PENDING'}
                  <div class="flex items-center gap-2">
                    <button 
                      onclick={() => handleCheckIn(student.id, 'PRESENT')}
                      class="text-success hover:text-green-700 text-sm font-medium"
                    >
                      签到
                    </button>
                    <button 
                      onclick={() => handleCheckIn(student.id, 'ABSENT')}
                      class="text-danger hover:text-red-700 text-sm font-medium"
                    >
                      缺考
                    </button>
                    <button 
                      onclick={() => openAnomalyModal(student.id)}
                      class="text-warning hover:text-orange-700 text-sm font-medium"
                    >
                      异常
                    </button>
                  </div>
                {:else}
                  <button 
                    onclick={() => handleCheckIn(student.id, 'PENDING')}
                    class="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    重置
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    
    <div class="flex items-center gap-3">
      <a href="/checkin" class="btn btn-secondary">返回列表</a>
      <a href="/checkin/history" class="btn btn-secondary">签到回看</a>
    </div>
  </div>
  
  {#if showAnomalyModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">上报异常</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">异常类型</label>
            <select 
              bind:value={anomalyType}
              class="input"
            >
              <option value="ADMISSION_ERROR">准考证信息错误</option>
              <option value="SEAT_CONFLICT">座位冲突</option>
              <option value="STUDENT_MISSING">学生信息缺失</option>
              <option value="OTHER">其他异常</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">异常描述</label>
            <textarea 
              bind:value={anomalyDescription}
              class="input min-h-24"
              placeholder="请详细描述异常情况"
              required
            ></textarea>
          </div>
          
          <div class="flex items-center gap-3 pt-4">
            <button 
              onclick={handleReportAnomaly}
              class="btn btn-primary"
            >
              提交上报
            </button>
            
            <button 
              onclick={() => showAnomalyModal = false}
              class="btn btn-secondary"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
{:else}
  <div class="text-center py-12 text-gray-500">未找到签到任务</div>
{/if}