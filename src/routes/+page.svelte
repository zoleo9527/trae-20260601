<script lang="ts">
  import { onMount } from 'svelte';
  import type { User, WorkOrder } from '$lib/types';
  import Login from '$lib/components/Login.svelte';
  import WorkOrderList from '$lib/components/WorkOrderList.svelte';
  import WorkOrderDetail from '$lib/components/WorkOrderDetail.svelte';

  let currentUser: User | null = null;
  let currentView: 'login' | 'list' | 'detail' = 'login';
  let selectedOrder: WorkOrder | null = null;

  async function handleLogin(username: string, password: string) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentUser = result.user;
      currentView = 'list';
    } else {
      alert(result.message || '登录失败');
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
  :root {
    --primary-color: #2563eb;
    --primary-hover: #1d4ed8;
    --success-color: #16a34a;
    --warning-color: #f59e0b;
    --danger-color: #dc2626;
    --info-color: #0ea5e9;
    --bg-color: #f8fafc;
    --card-bg: #ffffff;
    --border-color: #e2e8f0;
    --text-primary: #1e293b;
    --text-secondary: #64748b;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
    background: var(--bg-color); 
    color: var(--text-primary); 
    line-height: 1.6; 
  }

  .app-container {
    min-height: 100vh;
    background: var(--bg-color);
  }

  .container { 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 20px; 
  }

  .card { 
    background: var(--card-bg); 
    border-radius: 8px; 
    box-shadow: 0 1px 2px rgba(0,0,0,0.05); 
    border: 1px solid var(--border-color); 
    padding: 20px; 
    margin-bottom: 20px; 
  }

  .btn { 
    display: inline-flex; 
    align-items: center; 
    justify-content: center; 
    padding: 8px 16px; 
    border-radius: 6px; 
    font-weight: 500; 
    cursor: pointer; 
    border: none; 
    transition: all 0.2s; 
  }

  .btn-primary { background: var(--primary-color); color: white; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-success { background: var(--success-color); color: white; }
  .btn-warning { background: var(--warning-color); color: white; }
  .btn-danger { background: var(--danger-color); color: white; }
  .btn-outline { border: 1px solid var(--border-color); background: transparent; color: var(--text-primary); }
  .btn-sm { padding: 4px 12px; font-size: 13px; }

  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
  .form-group input, .form-group select, .form-group textarea { 
    width: 100%; 
    padding: 10px 12px; 
    border: 1px solid var(--border-color); 
    border-radius: 6px; 
    font-size: 14px; 
  }
  .form-group textarea { resize: vertical; min-height: 80px; }

  .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border-color); }
  .table th { background: var(--bg-color); font-weight: 600; color: var(--text-secondary); }

  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .badge-success { background: #dcfce7; color: #16a34a; }
  .badge-warning { background: #fef3c7; color: #f59e0b; }
  .badge-danger { background: #fee2e2; color: #dc2626; }
  .badge-info { background: #dbeafe; color: #3b82f6; }

  .modal-overlay { 
    position: fixed; 
    top: 0; 
    left: 0; 
    right: 0; 
    bottom: 0; 
    background: rgba(0,0,0,0.5); 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 1000; 
  }

  .modal-content { 
    background: white; 
    border-radius: 8px; 
    padding: 24px; 
    width: 90%; 
    max-width: 500px; 
    max-height: 80vh; 
    overflow-y: auto; 
  }

  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }

  .search-bar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .search-bar input, .search-bar select { padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 6px; }

  .flex-end { display: flex; justify-content: flex-end; gap: 8px; }
  .mt-20 { margin-top: 20px; }
</style>
