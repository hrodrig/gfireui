<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	import { ApiError } from '$lib/api/client';
	import { listJobs } from '$lib/api/gfire';
	import type { GFireJob } from '$lib/api/types';
	import JobTable from '$lib/components/JobTable.svelte';
	import OpsCharts from '$lib/components/OpsCharts.svelte';
	import { canSeeOps } from '$lib/auth/roles';
	import { session } from '$lib/auth/session';

	let jobs = $state<GFireJob[]>([]);
	let stateFilter = $state('');
	let queueFilter = $state('');
	let error = $state('');
	let loading = $state(true);

	const role = $derived($session?.user?.role);

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
		void load();
	});
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
	<section class="page">
		<header class="page__head">
			<h1>Jobs</h1>
		</header>

		<OpsCharts />

		<form
			class="filters"
			onsubmit={(e) => {
				e.preventDefault();
				void load();
			}}
		>
			<label>
				State
				<input bind:value={stateFilter} placeholder="pending" />
			</label>
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
			<JobTable jobs={jobs} onSelect={(id) => goto(`/jobs/${id}`)} />
		{/if}
	</section>
{/if}

<style>
	.page {
		display: grid;
		gap: 1.25rem;
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
	}

	input {
		padding: 0.45rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		background: var(--bg-card);
		color: var(--text);
		font: inherit;
	}

	.muted {
		color: var(--text-muted);
	}

	.error {
		color: var(--danger);
	}
</style>
