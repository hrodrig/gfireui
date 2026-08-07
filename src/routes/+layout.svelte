<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { hydrateSession, session } from '$lib/auth/session';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	let ready = $state(false);

	onMount(async () => {
		await hydrateSession();
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		const path = $page.url.pathname;
		const authed = $session != null;
		if (!authed && path !== '/login') {
			void goto('/login');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>GFireUI</title>
</svelte:head>

<ToastHost />

{#if !ready}
	<main class="boot">Loading…</main>
{:else if $page.url.pathname === '/login'}
	<main class="app-shell app-shell--login">
		{@render children?.()}
	</main>
{:else if $session}
	<Nav />
	<main class="app-shell">
		{@render children?.()}
	</main>
{:else}
	<main class="boot">Redirecting…</main>
{/if}

<style>
	.boot {
		padding: 2rem;
		color: var(--text-muted);
	}

	.app-shell {
		padding: 1.25rem;
	}

	.app-shell--login {
		padding: 0;
	}
</style>
