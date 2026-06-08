<script>
  import { currentView } from "./stores.js";
  import ScheduleList from "./ScheduleList.svelte";
  import ScheduleDetail from "./ScheduleDetail.svelte";
</script>

<style>
  :global(body) { margin: 0; padding: 0; }
</style>

{#if $currentView === "list"}
  <ScheduleList />
{:else if $currentView === "detail"}
  <ScheduleDetail />
{/if}
