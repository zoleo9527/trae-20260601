<script>
  export let label;
  export let color;
  export let showResponsible = false;
  export let responsibleRole;

  const roleLabels = {
    inspector: '巡检工程师',
    property: '物业联系人',
    supervisor: '维保主管'
  };
</script>

<span class="status-badge" style="background-color: {color}15; color: {color}">
  <span class="dot" style="background-color: {color}"></span>
  {label}
  {#if showResponsible && responsibleRole}
    <span class="responsible">· {roleLabels[responsibleRole]}处理中</span>
  {/if}
</span>

<style>
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .responsible {
    opacity: 0.8;
    font-weight: 400;
  }
</style>
