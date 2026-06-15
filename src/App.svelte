<script lang="ts">
  import { onMount } from 'svelte';
  import type { User, WorkOrder } from '$lib/types';
  import Login from './components/Login.svelte';
  import WorkOrderList from './components/WorkOrderList.svelte';
  import WorkOrderDetail from './components/WorkOrderDetail.svelte';

  let currentUser: User | null = null;
  let currentView: 'login' | 'list' | 'detail' = 'login';
  let selectedOrder: WorkOrder | null = null;
  let userRole: string = '';

  async function handleLogin(username: string, password: string) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentUser = result.user;
      userRole = result.user.role;
      currentView = 'list';
    } else {
      alert(result.message || '登录失败');
    }
  }

  function handleLogout() {
    currentUser = null;
    userRole = '';
    currentView = 'login';
    selectedOrder = null;
  }

  function handleSelectOrder(order: WorkOrder) {
    selectedOrder = order;
    currentView = 'detail';
  }

  function handleBackToList() {
    selectedOrder = null;
    currentView = 'list';
  }

  onMount(() => {
    window['handleBackToList'] = handleBackToList;
  });
</script>

<div class="app-container">
  {#if currentView === 'login'}
    <Login onLogin={handleLogin} />
  {:else if currentView === 'list' && currentUser}
    <WorkOrderList 
      user={currentUser} 
      onSelectOrder={handleSelectOrder} 
      onLogout={handleLogout}
    />
  {:else if currentView === 'detail' && selectedOrder && currentUser}
    <WorkOrderDetail 
      order={selectedOrder} 
      user={currentUser}
      onBack={handleBackToList}
      onLogout={handleLogout}
    />
  {/if}
</div>

<style>
  .app-container {
    min-height: 100vh;
    background: #f8fafc;
  }
</style>
