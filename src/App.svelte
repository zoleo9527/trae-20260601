<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Layout from './components/Layout.svelte'
  import Home from './pages/Home.svelte'
  import Rooms from './pages/Rooms.svelte'
  import Orders from './pages/Orders.svelte'
  import Inventory from './pages/Inventory.svelte'
  import Settings from './pages/Settings.svelte'
  import Login from './pages/Login.svelte'

  const routes: Record<string, any> = {
    '/': Home,
    '/rooms': Rooms,
    '/orders': Orders,
    '/inventory': Inventory,
    '/settings': Settings
  }

  let currentRoute = '/'
  let isLoggedIn = false
  let currentUser = null

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    currentRoute = path
  }

  function handlePopState() {
    currentRoute = window.location.pathname
    checkAuth()
  }

  function checkAuth() {
    const user = localStorage.getItem('currentUser')
    if (user) {
      currentUser = JSON.parse(user)
      isLoggedIn = true
    } else {
      isLoggedIn = false
      currentUser = null
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem('currentUser')
    isLoggedIn = false
    currentUser = null
    window.location.href = '/login'
  }

  function getCurrentPage() {
    if (!isLoggedIn) {
      return Login
    }
    return routes[currentRoute] || Home
  }

  onMount(() => {
    currentRoute = window.location.pathname
    checkAuth()
    window.addEventListener('popstate', handlePopState)
  })

  onDestroy(() => {
    window.removeEventListener('popstate', handlePopState)
  })
</script>

{#if isLoggedIn}
  <Layout {navigate} {currentUser} {handleLogout}>
    <svelte:component this={getCurrentPage()} />
  </Layout>
{:else}
  <svelte:component this={getCurrentPage()} />
{/if}

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
  }
</style>