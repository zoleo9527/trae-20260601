<script>
  import { onMount } from 'svelte';
  import { getSamples, statusLabels, acknowledgeReminder } from '$lib/api.js';
  import { user, currentView, selectedSample, showNotification } from '$lib/stores.js';
  import Navbar from '$lib/components/Navbar.svelte';
  import StatisticsBar from '$lib/components/StatisticsBar.svelte';
  import SampleCard from '$lib/components/SampleCard.svelte';
  import SampleDetail from '$lib/components/SampleDetail.svelte';
  import CreateSampleModal from '$lib/components/CreateSampleModal.svelte';
  import RoleDashboard from '$lib/components/RoleDashboard.svelte';

  let samples = [];
  let loading = true;
  let error = '';
  let showCreateModal = false;
  let showRoleDashboard = true;

  let filters = {
    status: '',
    priority: '',
    keyword: ''
  };

  let statsRef;
  let roleDashboardRef;

  onMount(() => {
    loadSamples();
  });

  async function loadSamples() {
    loading = true;
    error = '';
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.keyword) params.keyword = filters.keyword;

      const result = await getSamples(params);
      samples = result.samples;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleFilterChange() {
    loadSamples();
  }

  function handleSampleSelect(event) {
    selectedSample.set(event.detail);
    currentView.set('detail');
  }

  function handleRoleSampleSelect(event) {
    selectedSample.set(event.detail);
    currentView.set('detail');
  }

  function handleCloseDetail() {
    selectedSample.set(null);
    currentView.set('list');
    loadSamples();
    if (roleDashboardRef) roleDashboardRef.loadRoleData();
  }

  function handleCreateSuccess(event) {
    showNotification({
      id: Date.now(),
      title: '创建成功',
      message: '新样本已登记',
      type: 'success'
    });
    loadSamples();
    if (statsRef) statsRef.refresh();
    if (roleDashboardRef) roleDashboardRef.loadRoleData();
  }

  function handleDetailRefresh() {
    loadSamples();
    if (statsRef) statsRef.refresh();
    if (roleDashboardRef) roleDashboardRef.loadRoleData();
  }

  async function handleAcknowledgeReminder(event) {
    try {
      await acknowledgeReminder(event.detail.id);
      showNotification({
        id: Date.now(),
        title: '已知悉',
        message: '催办提醒已确认',
        type: 'success'
      });
      if (roleDashboardRef) roleDashboardRef.loadRoleData();
    } catch (err) {
      showNotification({
        id: Date.now(),
        title: '操作失败',
        message: err.message,
        type: 'error'
      });
    }
  }

  $: canCreate = $user && ($user.role === 'acceptor' || $user.role === 'admin');
</script>

<div class="app-container">
  <Navbar />
  
  <main class="main-content">
    {#if $currentView === 'list'}
      <div class="list-view">
        {#if showRoleDashboard && $user}
          <RoleDashboard 
            bind:this={roleDashboardRef}
            on:selectSample={handleRoleSampleSelect}
            on:acknowledgeReminder={handleAcknowledgeReminder}
          />
        {/if}

        <StatisticsBar bind:this={statsRef} />

        <div class="toolbar">
          <div class="filters">
            <select bind:value={filters.status} on:change={handleFilterChange}>
              <option value="">全部状态</option>
              {#each Object.entries(statusLabels) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </select>

            <select bind:value={filters.priority} on:change={handleFilterChange}>
              <option value="">全部优先级</option>
              <option value="urgent">特急</option>
              <option value="high">紧急</option>
              <option value="normal">普通</option>
              <option value="low">低</option>
            </select>

            <input
              type="text"
              placeholder="搜索案号、案件名称..."
              bind:value={filters.keyword}
              on:input={handleFilterChange}
            />
          </div>

          <div class="toolbar-actions">
            <button class="toggle-dashboard-btn" on:click={() => showRoleDashboard = !showRoleDashboard}>
              {showRoleDashboard ? '隐藏工作台' : '显示工作台'}
            </button>
            {#if canCreate}
              <button class="create-btn" on:click={() => showCreateModal = true}>
                ➕ 新建样本登记
              </button>
            {/if}
          </div>
        </div>

        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <p>加载样本数据...</p>
          </div>
        {:else if error}
          <div class="error-state">
            <p>⚠️ {error}</p>
            <button on:click={loadSamples}>重试</button>
          </div>
        {:else if samples.length === 0}
          <div class="empty-state">
            <p>📭 暂无样本数据</p>
            {#if canCreate}
              <button class="create-btn" on:click={() => showCreateModal = true}>
                创建第一个样本
              </button>
            {/if}
          </div>
        {:else}
          <div class="samples-grid">
            {#each samples as sample (sample.id)}
              <SampleCard {sample} on:select={handleSampleSelect} />
            {/each}
          </div>
        {/if}
      </div>
    {:else if $currentView === 'detail' && $selectedSample}
      <SampleDetail 
        sampleId={$selectedSample.id} 
        on:close={handleCloseDetail}
        on:refresh={handleDetailRefresh}
      />
    {/if}
  </main>
</div>

{#if showCreateModal}
  <CreateSampleModal 
    on:close={() => showCreateModal = false}
    on:success={handleCreateSuccess}
  />
{/if}

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: #f5f7fa;
    color: #333;
  }

  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    padding: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  .list-view {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .toolbar-actions {
    display: flex;
    gap: 0.75rem;
  }

  .toggle-dashboard-btn {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-dashboard-btn:hover {
    background: #e0e0e0;
  }

  .filters select,
  .filters input {
    padding: 0.6rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 0.9rem;
    background: white;
  }

  .filters input {
    min-width: 200px;
  }

  .filters select:focus,
  .filters input:focus {
    outline: none;
    border-color: #409EFF;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .create-btn {
    background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .create-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
  }

  .samples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.25rem;
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }

  .loading-state {
    color: #666;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #409EFF;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error-state {
    color: #F56C6C;
  }

  .error-state button {
    background: #F56C6C;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    margin-top: 1rem;
    cursor: pointer;
  }

  .empty-state {
    color: #999;
  }

  @media (max-width: 768px) {
    .main-content {
      padding: 1rem;
    }

    .toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .filters {
      flex-direction: column;
    }

    .filters input {
      min-width: auto;
    }

    .create-btn {
      width: 100%;
    }

    .samples-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
