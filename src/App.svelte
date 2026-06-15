<script lang="ts">
  import { onMount } from 'svelte';
  import { getUserByUsername } from './lib/db';
  import type { User, WorkOrder } from './lib/types';
  import Login from './components/Login.svelte';
  import WorkOrderList from './components/WorkOrderList.svelte';
  import WorkOrderDetail from './components/WorkOrderDetail.svelte';

  let currentUser: User | null = null;
  let currentView: 'login' | 'list' | 'detail' = 'login';
  let selectedOrder: WorkOrder | null = null;

  function handleLogin(username: string, password: string) {
    const user = getUserByUsername(username);
    if (user && user.password === password) {
      currentUser = user;
      currentView = 'list';
    } else {
      alert('用户名或密码错误');
    }
  }

  function handleLogout() {
    currentUser = null;
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
    <Login on:login={handleLogin} />
  {:else if currentView === 'list'}
    <WorkOrderList 
      user={currentUser} 
      on:select-order={handleSelectOrder} 
      on:logout={handleLogout}
    />
  {:else if currentView === 'detail' && selectedOrder && currentUser}
    <WorkOrderDetail 
      order={selectedOrder} 
      user={currentUser}
      on:back={handleBackToList}
      on:logout={handleLogout}
    />
  {/if}
</div>

<style>
  .app-container {
    min-height: 100vh;
    background: #f8fafc;
  }
</style>
