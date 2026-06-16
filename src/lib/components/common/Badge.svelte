<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' = 'primary';
  export let size: 'sm' | 'md' = 'md';
</script>

<span class="badge badge-{variant} badge-{size}">
  <slot />
</span>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-weight: 500;
    font-size: 0.875rem;
  }

  .badge-sm {
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
  }

  .badge-primary {
    background-color: #FDE68A;
    color: #92400E;
  }

  .badge-secondary {
    background-color: #FEF3C7;
    color: #78350F;
  }

  .badge-success {
    background-color: #D1FAE5;
    color: #065F46;
  }

  .badge-danger {
    background-color: #FEE2E2;
    color: #991B1B;
  }

  .badge-warning {
    background-color: #FED7AA;
    color: #9A3412;
  }

  .badge-info {
    background-color: #DBEAFE;
    color: #1E40AF;
  }
</style>