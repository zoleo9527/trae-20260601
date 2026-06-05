<script>
  import { ROLES, roleTodos, getBeanName, getCurveName } from './store.js';
  import StatusBadge from './StatusBadge.svelte';

  let { currentRole, onSelect } = $props();

  let todos = $derived($roleTodos[currentRole] || []);

  let roleEmoji = {
    '烘焙师': '🔥',
    '杯测员': '☕',
    '渠道客服': '📞'
  };
</script>

<div class="todo-board">
  <div class="todo-header">
    <span class="todo-emoji">{roleEmoji[currentRole]}</span>
    <span>{currentRole} 待办事项</span>
    <span class="todo-count">{todos.length}</span>
  </div>

  {#if todos.length === 0}
    <div class="empty-state">暂无待办 🎉</div>
  {:else}
    <div class="todo-list">
      {#each todos as record (record.id)}
        <button class="todo-card" onclick={() => onSelect(record.id)}>
          <div class="todo-card-top">
            <span class="todo-id">{record.id}</span>
            <StatusBadge status={record.status} />
          </div>
          <div class="todo-customer">{record.customer}</div>
          <div class="todo-bean">{getBeanName(record.beanId)} · {getCurveName(record.curveId)}</div>
          <div class="todo-feedback">{record.customerFeedback}</div>
          <div class="todo-date">投诉日期：{record.complaintDate}</div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .todo-board {
    padding: 0 24px 24px;
  }
  .todo-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
  }
  .todo-emoji {
    font-size: 20px;
  }
  .todo-count {
    background: #6366f1;
    color: #fff;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
  }
  .empty-state {
    text-align: center;
    padding: 40px 0;
    color: #999;
    font-size: 15px;
  }
  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .todo-card {
    display: block;
    width: 100%;
    text-align: left;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .todo-card:hover {
    border-color: #6366f1;
    box-shadow: 0 2px 8px rgba(99,102,241,0.12);
  }
  .todo-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .todo-id {
    font-weight: 600;
    color: #6366f1;
    font-size: 13px;
  }
  .todo-customer {
    font-weight: 600;
    color: #1a1a1a;
    font-size: 14px;
  }
  .todo-bean {
    font-size: 12px;
    color: #888;
    margin-top: 2px;
  }
  .todo-feedback {
    font-size: 13px;
    color: #444;
    margin-top: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .todo-date {
    font-size: 11px;
    color: #aaa;
    margin-top: 6px;
  }
</style>
