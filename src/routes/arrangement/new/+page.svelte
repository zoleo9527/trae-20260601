<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  interface Exam {
    id: string;
    name: string;
    date: string;
    startTime: string;
    endTime: string;
  }
  
  interface ExamRoom {
    id: string;
    building: string;
    roomNumber: string;
    seatCount: number;
  }
  
  interface Invigilator {
    id: string;
    name: string;
    department: string;
  }
  
  let exams = [];
  let examRooms = [];
  let invigilators = [];
  
  let selectedExam = '';
  let selectedRoom = '';
  let selectedInvigilator = '';
  let startTime = '';
  let endTime = '';
  let date = '';
  
  let conflictMessage = '';
  let loading = false;
  let checking = false;
  
  onMount(async () => {
    await Promise.all([
      loadExams(),
      loadExamRooms(),
      loadInvigilators()
    ]);
  });
  
  async function loadExams() {
    try {
      const response = await fetch('/api/exams');
      if (response.ok) {
        exams = await response.json();
      }
    } catch (e) {
      console.error('加载考试失败:', e);
    }
  }
  
  async function loadExamRooms() {
    try {
      const response = await fetch('/api/exam-rooms');
      if (response.ok) {
        const data = await response.json();
        examRooms = data.examRooms || [];
      }
    } catch (e) {
      console.error('加载考场失败:', e);
    }
  }
  
  async function loadInvigilators() {
    try {
      const response = await fetch('/api/users?role=INVIGILATOR');
      if (response.ok) {
        invigilators = await response.json();
      }
    } catch (e) {
      console.error('加载监考老师失败:', e);
    }
  }
  
  async function checkConflict() {
    if (!selectedInvigilator || !date || !startTime || !endTime) return;
    
    checking = true;
    conflictMessage = '';
    
    try {
      const params = new URLSearchParams({
        invigilatorId: selectedInvigilator,
        date,
        startTime,
        endTime
      });
      
      const response = await fetch(`/api/arrangements/check-conflict?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.hasConflict) {
          conflictMessage = `发现时间冲突：该监考老师已有 ${data.conflicts.length} 个监考任务在同一时间段`;
        }
      }
    } catch (e) {
      console.error('检测冲突失败:', e);
    } finally {
      checking = false;
    }
  }
  
  async function handleSubmit() {
    if (!selectedExam || !selectedRoom || !selectedInvigilator || !date || !startTime || !endTime) {
      return;
    }
    
    loading = true;
    
    try {
      const response = await fetch('/api/arrangements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedExam,
          examRoomId: selectedRoom,
          invigilatorId: selectedInvigilator,
          date,
          startTime,
          endTime,
          status: 'PENDING',
          createdBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''
        })
      });
      
      if (response.ok) {
        goto('/arrangement');
      }
    } catch (e) {
      console.error('创建监考安排失败:', e);
    } finally {
      loading = false;
    }
  }
  
  $: if (selectedInvigilator && date && startTime && endTime) {
    checkConflict();
  }
</script>

<div class="max-w-2xl mx-auto">
  <div class="card p-6">
    <h2 class="text-xl font-semibold text-gray-800 mb-6">新建监考安排</h2>
    
    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">考试</label>
        <select 
          bind:value={selectedExam}
          class="input"
          required
        >
          <option value="">请选择考试</option>
          {#each exams as exam}
            <option value={exam.id}>{exam.name}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">考场</label>
        <select 
          bind:value={selectedRoom}
          class="input"
          required
        >
          <option value="">请选择考场</option>
          {#each examRooms as room}
            <option value={room.id}>{room.building} {room.roomNumber} (座位数: {room.seatCount})</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">监考老师</label>
        <select 
          bind:value={selectedInvigilator}
          class="input"
          required
        >
          <option value="">请选择监考老师</option>
          {#each invigilators as inv}
            <option value={inv.id}>{inv.name} - {inv.department}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">监考日期</label>
        <input 
          type="date"
          bind:value={date}
          class="input"
          required
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">开始时间</label>
          <input 
            type="time"
            bind:value={startTime}
            class="input"
            required
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">结束时间</label>
          <input 
            type="time"
            bind:value={endTime}
            class="input"
            required
          />
        </div>
      </div>
      
      {#if checking}
        <div class="text-center py-3">
          <div class="text-gray-500">正在检测时间冲突...</div>
        </div>
      {:else if conflictMessage}
        <div class="p-4 rounded-md bg-danger/10 border border-danger/20">
          <div class="flex items-center gap-2 text-danger">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.542 0 2.602-1.654 1.99-3.04l-3.432-8.696c-.61-1.54-2.602-1.54-3.212 0L9.326 14.96c-.612 1.548.448 3.04 1.99 3.04z"></path>
            </svg>
            <span class="font-medium">{conflictMessage}</span>
          </div>
        </div>
      {:else if selectedInvigilator && date && startTime && endTime}
        <div class="p-4 rounded-md bg-success/10 border border-success/20">
          <div class="flex items-center gap-2 text-success">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="font-medium">未发现时间冲突</span>
          </div>
        </div>
      {/if}
      
      <div class="flex items-center gap-3 pt-4">
        <button 
          type="submit"
          disabled={loading || conflictMessage !== ''}
          class="btn btn-primary {loading || conflictMessage ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          {loading ? '创建中...' : '创建安排'}
        </button>
        
        <a href="/arrangement" class="btn btn-secondary">取消</a>
      </div>
    </form>
  </div>
</div>