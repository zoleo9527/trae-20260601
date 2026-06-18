<script lang="ts">
  import { onMount } from 'svelte'

  onMount(() => {
    const token = localStorage.getItem('token')
    if (token) {
      window.location.href = '/home'
    } else {
      window.location.href = '/login'
    }
  })
</script>

<div>Loading...</div>
