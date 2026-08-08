<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import { ApiError } from '$lib/api/client';
	import { listJobs } from '$lib/api/gfire';
	import type { GFireJob, OpsSummary } from '$lib/api/types';
	import JobTable from '$lib/components/JobTable.svelte';
	import OpsCharts from '$lib/components/OpsCharts.svelte';
	import StateRail from '$lib/components/StateRail.svelte';
	import { canSeeOps } from '$lib/auth/roles';
	import { session } from '$lib/auth/session';
	import { getCachedOpsSummary, subscribeOpsSummary } from '$lib/ops/summary';

	let jobs = $state<GFireJob[]>([]);
	let queueFilter = $state('');
	let error = $state('');
	let loading = $state(true);
	let summary = $state<OpsSummary | null>(getCachedOpsSummary());

	const role = $derived($session?.user?.role);
	const stateFilter = $derived($page.url.searchParams.get('state') ?? '');

	async function load() {
		loading = true;
		error = '';
		const params = new URLSearchParams();
		if (stateFilter) params.set('state', stateFilter);
		if (queueFilter) params.set('queue', queueFilter);
		try {
			jobs = await listJobs(params.toString());
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load jobs';
			jobs = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		const stop = subscribeOpsSummary((s) => (summary = s));
		return stop;
	});

	$effect(() => {
		// reload when state query changes
		void stateFilter;
		void load();
	});

	const emptyMessage = $derived(
		stateFilter
			? `No ${stateFilter} jobs right now.`
			: 'No jobs matched. Enqueue work against the engine to see activity here.'
	);
</script>

{#if !canSeeOps(role)}
	<section>
		<h1>Welcome</h1>
		<p class="muted">
			Your role ({role ?? 'Guest'}) has limited access. Ask an Administrator for Operator or Auditor
			permissions to view ops screens.
		</p>
	</section>
{:else}
	<section class="ops">
		<StateRail {summary} />
		<div class="ops__main">
			<header class="page__head">
				<h1>Jobs{stateFilter ? ` · ${stateFilter}` : ''}</h1>
			</header>

			{#if !stateFilter}
				<OpsCharts />
			{/if}

			<form
				class="filters"
				onsubmit={(e) => {
					e.preventDefault();
					void load();
				}}
			>
				<label>
					Queue
					<input bind:value={queueFilter} placeholder="default" />
				</label>
				<button type="submit">Apply</button>
			</form>

			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
			{#if loading}
				<p class="muted">Loading jobs…</p>
			{:else}
				<JobTable jobs={jobs} onSelect={(id) => goto(`/jobs/${id}`)} {emptyMessage} />
			{/if}
		</div>
	</section>
{/if}

<style>
	.ops {
		display: grid;
		grid-template-columns: minmax(10rem, 12rem) 1fr;
		gap: 1.25rem;
		align-items: start;
	}

	@media (max-width: 720px) {
		.ops {
			grid-template-columns: 1fr;
		}
	}

	.ops__main {
		display: grid;
		gap: 1.25rem;
		min-width: 0;
	}

	.page__head h1 {
		margin: 0;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: end;
	}

	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.error {
		color: var(--danger);
	}

	.muted {
		color: var(--text-muted);
	}
</style>
