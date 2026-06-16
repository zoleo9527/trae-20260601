<script lang="ts">
  export let title = '';
  export let subtitle = '';
  export let padding = true;
  export let hoverable = false;
  export let clickable = false;
</script>

<div
  class="card"
  class:card-padding={padding}
  class:card-hoverable={hoverable}
  class:card-clickable={clickable}
  on:click
>
  {#if title || subtitle}
    <div class="card-header">
      {#if title}
        <h3 class="card-title">{title}</h3>
      {/if}
      {#if subtitle}
        <p class="card-subtitle">{subtitle}</p>
      {/if}
    </div>
  {/if}
  <div class="card-body">
    <slot />
  </div>
  {#if $$slots.footer}
    <div class="card-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

<style>
  .card {
    background-color: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px rgba(146, 64, 14, 0.1);
    overflow: hidden;
    transition: all 0.2s;
  }

  .card-padding {
    padding: 1.5rem;
  }

  .card-hoverable:hover {
    box-shadow: 0 4px 16px rgba(146, 64, 14, 0.15);
    transform: translateY(-2px);
  }

  .card-clickable {
    cursor: pointer;
  }

  .card-header {
    margin-bottom: 1rem;
  }

  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #78350F;
    margin: 0;
  }

  .card-subtitle {
    font-size: 0.875rem;
    color: #92400E;
    margin-top: 0.25rem;
    margin-bottom: 0;
  }

  .card-body {
    flex: 1;
  }

  .card-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #FEF3C7;
  }
</style>