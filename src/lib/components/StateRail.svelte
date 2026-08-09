<script lang="ts">
	import { page } from '$app/stores';
	import { consoleTitle } from '$lib/console';
	import type { OpsSummary } from '$lib/api/types';
	import { attentionCount } from '$lib/ops/summary';
	import { ACTIVE_STATES, TERMINAL_STATES, stateClass } from '$lib/theme/states';

	type Props = {
		summary: OpsSummary | null;
	};

	let { summary }: Props = $props();

	const title = consoleTitle();
	const activeState = $derived($page.url.searchParams.get('state') ?? '');
	const attention = $derived(attentionCount(summary));

	function hrefFor(state: string): string {
		return `/jobs?state=${encodeURIComponent(state)}`;
	}

	function count(state: string): number {
		return summary?.jobs_by_state?.[state] ?? 0;
	}
</script>

<aside class="rail" aria-label="Job states">
	<p class="rail__brand">{title}</p>
	<nav class="rail__nav">
		<a
			href="/jobs"
			class="rail__link"
			class:rail__link--active={$page.url.pathname.startsWith('/jobs') && !activeState}
		>
			<span>All</span>
			<span class="rail__count">
				{ACTIVE_STATES.reduce((n, s) => n + count(s), 0) +
					TERMINAL_STATES.reduce((n, s) => n + count(s), 0)}
			</span>
		</a>

		<p class="rail__group">Active</p>
		{#each ACTIVE_STATES as state (state)}
			<a
				href={hrefFor(state)}
				class="rail__link {stateClass(state)}"
				class:rail__link--active={activeState === state}
			>
				<span class="rail__label">
					<span class="rail__dot" aria-hidden="true"></span>
					{state}
				</span>
				<span class="rail__count">{count(state)}</span>
			</a>
		{/each}
		<a
			href="/attention"
			class="rail__link {stateClass('Attention')}"
			class:rail__link--active={$page.url.pathname.startsWith('/attention')}
		>
			<span class="rail__label">
				<span class="rail__dot" aria-hidden="true"></span>
				Attention
			</span>
			<span class="rail__count">{attention}</span>
		</a>

		<p class="rail__group">Terminal</p>
		{#each TERMINAL_STATES as state (state)}
			<a
				href={hrefFor(state)}
				class="rail__link {stateClass(state)}"
				class:rail__link--active={activeState === state}
			>
				<span class="rail__label">
					<span class="rail__dot" aria-hidden="true"></span>
					{state}
				</span>
				<span class="rail__count">{count(state)}</span>
			</a>
		{/each}
	</nav>
</aside>

<style>
	.rail {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 11rem;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
	}

	.rail__brand {
		margin: 0;
		font-family: Sora, system-ui, sans-serif;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.rail__nav {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.rail__group {
		margin: 0.55rem 0 0.15rem;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.rail__link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		border-radius: 0.35rem;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.85rem;
	}

	.rail__label {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
	}

	.rail__dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--state-fg, var(--text-muted));
		flex-shrink: 0;
	}

	.rail__link:hover,
	.rail__link--active {
		color: var(--text);
		background: color-mix(in srgb, var(--brand) 14%, transparent);
		text-decoration: none;
	}

	.rail__count {
		font-variant-numeric: tabular-nums;
		opacity: 0.9;
	}
</style>
