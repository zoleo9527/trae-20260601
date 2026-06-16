<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchCurrentUser } from '$lib/store';

  onMount(() => {
    fetchCurrentUser();
  });
</script>

<slot />
