<script>
  import { STATUS_MAP } from './store.js';

  let { status } = $props();
  let info = $derived(STATUS_MAP[status] || { label: status, color: '#999' });
</script>

<span class="badge" style="background:{info.color}20;color:{info.color};border:1px solid {info.color}40">
  {info.label}
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
</style>
