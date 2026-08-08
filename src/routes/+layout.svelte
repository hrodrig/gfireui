<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppFooter from '$lib/components/AppFooter.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { hydrateSession, session } from '$lib/auth/session';
	import { consoleTitle } from '$lib/console';
	import { startOpsSummaryPoll } from '$lib/ops/summary';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { children } = $props();

	let ready = $state(false);
	const title = consoleTitle();

	onMount(() => {
		let stopPoll: (() => void) | undefined;
		const unsub = session.subscribe((s) => {
			if (s && !stopPoll) stopPoll = startOpsSummaryPoll(3000);
			if (!s && stopPoll) {
				stopPoll();
				stopPoll = undefined;
			}
		});
		void hydrateSession().then(() => {
			ready = true;
		});
		return () => {
			unsub();
			stopPoll?.();
		};
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
	<title>{title}</title>
</svelte:head>

<ToastHost />

{#if !ready}
	<main class="boot">Loading…</main>
{:else if $page.url.pathname === '/login'}
	<main class="app-shell app-shell--login">
		{@render children?.()}
	</main>
{:else if $session}
	<div class="app">
		<Nav />
		<main class="app-shell">
			{@render children?.()}
		</main>
		<AppFooter />
	</div>
{:else}
	<main class="boot">Redirecting…</main>
{/if}

<style>
	.boot {
		padding: 2rem;
		color: var(--text-muted);
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-shell {
		padding: 1.25rem;
		flex: 1;
	}

	.app-shell--login {
		padding: 0;
	}
</style>
