<script lang="ts">
  import { onMount, reactive } from 'svelte';
  import { getUserByUsername } from './lib/db';
  import type { User, WorkOrder } from './lib/types';
  import Login from './components/Login.svelte';
  import WorkOrderList from './components/WorkOrderList.svelte';
  import WorkOrderDetail from './components/WorkOrderDetail.svelte';

  const state = reactive({
    currentUser: null as User | null,
    currentView: 'login' as 'login' | 'list' | 'detail',
    selectedOrder: null as WorkOrder | null
  });

  async function handleLogin(username: string, password: string) {
    const user = await getUserByUsername(username);
    if (user && user.password === password) {
      state.currentUser = user;
      state.currentView = 'list';
    } else {
      alert('用户名或密码错误');
    }
  }

  function handleLogout() {
    state.currentUser = null;
    state.currentView = 'login';
    state.selectedOrder = null;
  }

  function handleSelectOrder(order: WorkOrder) {
    state.selectedOrder = order;
    state.currentView = 'detail';
  }

  function handleBackToList() {
    state.selectedOrder = null;
    state.currentView = 'list';
  }

  onMount(() => {
    window['handleBackToList'] = handleBackToList;
  });
</script>

<div class="app-container">
  {#if state.currentView === 'login'}
    <Login on:login={handleLogin} />
  {:else if state.currentView === 'list'}
    <WorkOrderList 
      user={state.currentUser!} 
      on:select-order={handleSelectOrder} 
      on:logout={handleLogout}
    />
  {:else if state.currentView === 'detail'}
    <WorkOrderDetail 
      order={state.selectedOrder!} 
      user={state.currentUser!}
      on:back={handleBackToList}
      on:logout={handleLogout}
    />
  {/if}
</div>
