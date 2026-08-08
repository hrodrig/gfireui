<script lang="ts">
	import { onMount } from 'svelte';
	import type { OpsSummary, OpsVersionInfo } from '$lib/api/types';
	import { consoleVersion, GFIREUI_REPO } from '$lib/console';
	import { getCachedOpsSummary, subscribeOpsSummary } from '$lib/ops/summary';

	let summary = $state<OpsSummary | null>(getCachedOpsSummary());

	onMount(() => subscribeOpsSummary((s) => (summary = s)));

	const rows = $derived.by(() => {
		const fromApi = summary?.versions ?? [];
		const byName = new Map(fromApi.map((v) => [v.name, v]));
		const ui: OpsVersionInfo = {
			name: 'gfireui',
			version: consoleVersion(),
			url: GFIREUI_REPO
		};
		const backend = byName.get('gfireui-backend') ?? {
			name: 'gfireui-backend',
			url: 'https://github.com/hrodrig/gfireui-backend'
		};
		const engine = byName.get('gfire') ?? {
			name: 'gfire',
			url: 'https://github.com/hrodrig/gfire'
		};
		return [engine, ui, backend];
	});

	function label(v: OpsVersionInfo): string {
		const ver = v.version?.trim();
		return ver ? `${v.name} v${ver.replace(/^v/, '')}` : `${v.name} —`;
	}
</script>

<footer class="foot">
	{#each rows as v, i (v.name)}
		{#if i > 0}<span class="foot__sep" aria-hidden="true">·</span>{/if}
		<a href={v.url} target="_blank" rel="noopener noreferrer" title={v.commit ?? v.name}>
			{label(v)}
		</a>
	{/each}
</footer>

<style>
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem 0.5rem;
		padding: 0.75rem 1.25rem 1.25rem;
		color: var(--text-muted);
		font-size: 0.75rem;
	}

	.foot a {
		color: var(--text-muted);
		text-decoration: none;
	}

	.foot a:hover {
		color: var(--brand);
		text-decoration: underline;
	}

	.foot__sep {
		opacity: 0.5;
	}
</style>
