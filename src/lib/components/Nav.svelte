<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { session, clearSession } from '$lib/auth/session';
	import { canSeeAudit, canSeeOps, canSeeUsers } from '$lib/auth/roles';
	import { getTheme, toggleTheme, type Theme } from '$lib/theme/theme';
	import { onMount } from 'svelte';

	let theme = $state<Theme>('dark');

	onMount(() => {
		theme = getTheme();
	});

	const role = $derived($session?.user?.role);
	const links = $derived.by(() => {
		const items: { href: string; label: string }[] = [];
		if (canSeeOps(role)) {
			items.push(
				{ href: '/jobs', label: 'Jobs' },
				{ href: '/queues', label: 'Queues' },
				{ href: '/recurring', label: 'Recurring' },
				{ href: '/servers', label: 'Servers' }
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
</script>

<header class="nav">
	<a class="nav__brand" href="/jobs">GFireUI</a>
	<nav class="nav__links" aria-label="Console">
		{#each links as link (link.href)}
			<a
				href={link.href}
				class="nav__link"
				class:nav__link--active={$page.url.pathname === link.href ||
					$page.url.pathname.startsWith(link.href + '/')}
			>
				{link.label}
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
		>
			{theme === 'light' ? 'Dark' : 'Light'}
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
</style>
