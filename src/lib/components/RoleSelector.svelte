<script>
  import { currentUser } from '$lib/stores.js';

  const users = [
    { id: 1, name: '张伟', role: 'inspector', roleLabel: '巡检工程师', phone: '13800138001', department: '维保部一组' },
    { id: 2, name: '李强', role: 'inspector', roleLabel: '巡检工程师', phone: '13800138002', department: '维保部二组' },
    { id: 3, name: '王芳', role: 'property', roleLabel: '物业联系人', phone: '13900139001', department: '阳光花园物业' },
    { id: 4, name: '陈静', role: 'property', roleLabel: '物业联系人', phone: '13900139002', department: '金茂大厦物业' },
    { id: 5, name: '刘建国', role: 'supervisor', roleLabel: '维保主管', phone: '13700137001', department: '维保部' }
  ];

  const switchUser = (user) => {
    currentUser.set(user);
  };
</script>

<div class="role-selector">
  <span class="label">当前身份：</span>
  <div class="user-list">
    {#each users as user}
      <button
        class="user-btn"
        class:active={$currentUser.id === user.id}
        data-role={user.role}
        on:click={() => switchUser(user)}
      >
        {user.roleLabel} · {user.name}
      </button>
    {/each}
  </div>
</div>

<style>
  .role-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }

  .label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }

  .user-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .user-btn {
    padding: 6px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    background: white;
    font-size: 13px;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
  }

  .user-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  .user-btn.active[data-role="inspector"] {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  .user-btn.active[data-role="property"] {
    background: #dcfce7;
    border-color: #22c55e;
    color: #15803d;
  }

  .user-btn.active[data-role="supervisor"] {
    background: #fef3c7;
    border-color: #f59e0b;
    color: #b45309;
  }
</style>
