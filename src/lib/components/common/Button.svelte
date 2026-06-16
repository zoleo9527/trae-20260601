<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let loading = false;
  export let fullWidth = false;
</script>

<button
  class="btn btn-{variant} btn-{size}"
  class:btn-full-width={fullWidth}
  class:btn-disabled={disabled || loading}
  disabled={disabled || loading}
  on:click
>
  {#if loading}
    <span class="spinner"></span>
  {/if}
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 0.2s;
    cursor: pointer;
    border: 2px solid transparent;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .btn-md {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  .btn-lg {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }

  .btn-primary {
    background-color: #F59E0B;
    color: white;
    box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
  }

  .btn-primary:hover:not(.btn-disabled) {
    background-color: #D97706;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
  }

  .btn-secondary {
    background-color: #92400E;
    color: white;
    box-shadow: 0 2px 4px rgba(146, 64, 14, 0.3);
  }

  .btn-secondary:hover:not(.btn-disabled) {
    background-color: #78350F;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(146, 64, 14, 0.4);
  }

  .btn-success {
    background-color: #10B981;
    color: white;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
  }

  .btn-success:hover:not(.btn-disabled) {
    background-color: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
  }

  .btn-danger {
    background-color: #EF4444;
    color: white;
    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
  }

  .btn-danger:hover:not(.btn-disabled) {
    background-color: #DC2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  }

  .btn-outline {
    background-color: transparent;
    color: #92400E;
    border-color: #92400E;
  }

  .btn-outline:hover:not(.btn-disabled) {
    background-color: #FEF3C7;
    transform: translateY(-1px);
  }

  .btn-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .btn-full-width {
    width: 100%;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>