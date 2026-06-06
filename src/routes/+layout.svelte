<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Layout from '$lib/components/Layout.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	const user = $derived($page.data.user);
	const isLoginPage = $derived($page.url.pathname === '/login');
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isLoginPage || !user}
	{@render children()}
{:else}
	<Layout {user}>{@render children()}</Layout>
{/if}
