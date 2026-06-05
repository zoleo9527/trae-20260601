<script>
  import { ROLES, complaintRecords, alerts, ROLE_TODO_MAP } from './lib/store.js';
  import AlertBanner from './lib/AlertBanner.svelte';
  import TodoBoard from './lib/TodoBoard.svelte';
  import ComplaintDetail from './lib/ComplaintDetail.svelte';

  let currentRole = $state('渠道客服');
  let selectedId = $state(null);

  let pendingCount = $derived(
    ROLES.reduce((acc, role) => {
      acc[role] = $complaintRecords.filter(c => ROLE_TODO_MAP[role](c)).length;
      return acc;
    }, {})
  );

  function selectRecord(id) {
    selectedId = id;
  }

  function goBack() {
    selectedId = null;
  }
</script>

<div class="app-shell">
  <header class="app-header">
    <div class="header-left">
      <span class="logo">☕</span>
      <h1 class="header-title">咖啡烘焙厂 · 客诉回收与风味复盘</h1>
    </div>
    <div class="role-switcher">
      {#each ROLES as role}
        <button
          class="role-btn"
          class:active={currentRole === role}
          onclick={() => { currentRole = role; selectedId = null; }}
        >
          {role}
          {#if pendingCount[role] > 0}
            <span class="role-badge">{pendingCount[role]}</span>
          {/if}
        </button>
      {/each}
    </div>
  </header>

  {#if !selectedId}
    <AlertBanner />
    <TodoBoard {currentRole} onSelect={selectRecord} />
  {:else}
    <ComplaintDetail recordId={selectedId} onBack={goBack} {currentRole} />
  {/if}
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
    position: sticky;
    top: 0;
    z-index: 200;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    font-size: 24px;
  }
  .header-title {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    white-space: nowrap;
  }
  .role-switcher {
    display: flex;
    gap: 6px;
  }
  .role-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #666;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 500;
  }
  .role-btn:hover {
    border-color: #6366f1;
    color: #6366f1;
  }
  .role-btn.active {
    background: #6366f1;
    color: #fff;
    border-color: #6366f1;
  }
  .role-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 700;
    padding: 0 5px;
    background: rgba(255,255,255,0.3);
    color: inherit;
  }
  .role-btn:not(.active) .role-badge {
    background: #fef2f2;
    color: #dc2626;
  }
</style>
