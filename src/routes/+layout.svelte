<script lang="ts">
  import '../app.css';
  import Layout from '$lib/components/layout/Layout.svelte';
  import { onMount } from 'svelte';
  import { bookings, procurements, accommodations, inventory, alerts, notifications } from '$lib/stores';
  import { initializeData } from '$lib/storage';
  
  onMount(() => {
    initializeData();
    bookings.init();
    procurements.init();
    accommodations.init();
    inventory.init();
    alerts.init();
    notifications.init();
  });
</script>

<Layout>
  <slot />
</Layout>