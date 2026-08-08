<script lang="ts">
	import { page } from '$app/stores';
	import { consoleTitle } from '$lib/console';
	import { GFIRE_STATES, type GFireState } from '$lib/ops/summary';
	import type { OpsSummary } from '$lib/api/types';

	type Props = {
		summary: OpsSummary | null;
	};

	let { summary }: Props = $props();

	const title = consoleTitle();
	const activeState = $derived($page.url.searchParams.get('state') ?? '');

	function hrefFor(state: GFireState): string {
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
		</a>
		{#each GFIRE_STATES as state (state)}
			<a
				href={hrefFor(state)}
				class="rail__link"
				class:rail__link--active={activeState === state}
			>
				<span>{state}</span>
				<span class="rail__count">{count(state)}</span>
			</a>
		{/each}
		<a
			href="/attention"
			class="rail__link"
			class:rail__link--active={$page.url.pathname.startsWith('/attention')}
		>
			<span>Attention</span>
			<span class="rail__count">{count('Failed') + count('Dead')}</span>
		</a>
	</nav>
</aside>

<style>
	.rail {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
		gap: 0.15rem;
	}

	.rail__link {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.35rem 0.4rem;
		border-radius: 0.35rem;
		color: var(--text-muted);
		text-decoration: none;
		font-size: 0.85rem;
	}

	.rail__link:hover,
	.rail__link--active {
		color: var(--text);
		background: color-mix(in srgb, var(--brand) 12%, transparent);
		text-decoration: none;
	}

	.rail__count {
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}
</style>
