<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	import type { OpsSummary } from '$lib/api/types';
	import { canSeeAudit, canSeeOps, canSeeUsers } from '$lib/auth/roles';
	import { clearSession, session } from '$lib/auth/session';
	import { consoleTitle } from '$lib/console';
	import {
		attentionCount,
		getCachedOpsSummary,
		hotJobsCount,
		subscribeOpsSummary
	} from '$lib/ops/summary';
	import { getTheme, toggleTheme, type Theme } from '$lib/theme/theme';

	let theme = $state<Theme>('dark');
	let summary = $state<OpsSummary | null>(getCachedOpsSummary());

	onMount(() => {
		theme = getTheme();
		return subscribeOpsSummary((s) => (summary = s));
	});

	const brand = consoleTitle();
	const role = $derived($session?.user?.role);
	const links = $derived.by(() => {
		const items: { href: string; label: string; badge?: number }[] = [];
		if (canSeeOps(role)) {
			items.push(
				{ href: '/jobs', label: 'Jobs', badge: hotJobsCount(summary) },
				{ href: '/attention', label: 'Attention', badge: attentionCount(summary) },
				{ href: '/queues', label: 'Queues' },
				{ href: '/recurring', label: 'Recurring', badge: summary?.recurring_count },
				{ href: '/servers', label: 'Servers', badge: summary?.servers_count }
			);
		}
		if (canSeeUsers(role)) {
			items.push({ href: '/users', label: 'Users' });
		}
		if (canSeeAudit(role)) {
			items.push({ href: '/audit', label: 'Audit' });
		}
		return items;
	});

	function handleThemeToggle() {
		theme = toggleTheme();
	}

	function logout() {
		clearSession();
		void goto('/login');
	}

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/jobs') {
			return path === '/jobs' || path.startsWith('/jobs/');
		}
		return path === href || path.startsWith(href + '/');
	}
</script>

<header class="nav">
	<a class="nav__brand" href="/jobs">{brand}</a>
	<nav class="nav__links" aria-label="Console">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="nav__link"
				class:nav__link--active={isActive(link.href)}
			>
				{link.label}
				{#if link.badge != null && link.badge > 0}
					<span class="nav__badge">{link.badge}</span>
				{/if}
			</a>
		{/each}
	</nav>
	<div class="nav__actions">
		{#if $session?.user}
			<span class="nav__user" title={$session.user.email}>
				{$session.user.first_name} · {$session.user.role}
			</span>
		{/if}
		<button
			type="button"
			class="theme-toggle"
			onclick={handleThemeToggle}
			aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
			title={theme === 'light' ? 'Dark mode' : 'Light mode'}
		>
			<span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
			<span class="theme-toggle__label">{theme === 'light' ? 'Dark' : 'Light'}</span>
		</button>
		<button type="button" class="button-ghost" onclick={logout}>Log out</button>
	</div>
</header>

<style>
	.nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.25rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--border);
		background: var(--bg-card);
	}

	.nav__brand {
		font-family: Sora, system-ui, sans-serif;
		font-weight: 600;
		color: var(--text);
		text-decoration: none;
	}

	.nav__links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.85rem;
		flex: 1;
	}

	.nav__link {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--text-muted);
		font-family: Sora, system-ui, sans-serif;
		font-size: 0.875rem;
		text-decoration: none;
	}

	.nav__link:hover,
	.nav__link--active {
		color: var(--brand);
		text-decoration: none;
	}

	.nav__badge {
		min-width: 1.1rem;
		padding: 0 0.3rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--brand) 22%, transparent);
		font-size: 0.7rem;
		font-variant-numeric: tabular-nums;
		text-align: center;
	}

	.nav__link[href='/attention'] .nav__badge {
		background: color-mix(in srgb, var(--state-failed) 28%, transparent);
		color: var(--state-failed);
	}

	.nav__actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-left: auto;
	}

	.nav__user {
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.button-ghost {
		background: transparent;
	}

	.theme-toggle {
		gap: 0.35rem;
	}

	.theme-toggle__label {
		font-size: 0.8rem;
	}
</style>
