<script>
  import { alerts } from './store.js';

  let levelIcon = { error: '⛔', warning: '⚠️' };
</script>

{#if $alerts.length > 0}
  <div class="alert-banner">
    {#each $alerts as alert}
      <div class="alert-item alert-{alert.level}">
        <span class="alert-icon">{levelIcon[alert.level]}</span>
        <div class="alert-content">
          <div class="alert-title">{alert.title}</div>
          <div class="alert-detail">{alert.detail}</div>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .alert-banner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 24px 12px;
  }
  .alert-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
  }
  .alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }
  .alert-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
  }
  .alert-icon {
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .alert-title {
    font-weight: 600;
    color: #1a1a1a;
  }
  .alert-detail {
    color: #555;
    margin-top: 2px;
  }
</style>
