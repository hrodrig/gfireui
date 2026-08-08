<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	import { ApiError } from '$lib/api/client';
	import { listJobs } from '$lib/api/gfire';
	import type { GFireJob, OpsSummary } from '$lib/api/types';
	import JobTable from '$lib/components/JobTable.svelte';
	import StateRail from '$lib/components/StateRail.svelte';
	import { canSeeOps } from '$lib/auth/roles';
	import { session } from '$lib/auth/session';
	import { getCachedOpsSummary, subscribeOpsSummary } from '$lib/ops/summary';

	let failed = $state<GFireJob[]>([]);
	let dead = $state<GFireJob[]>([]);
	let error = $state('');
	let loading = $state(true);
	let summary = $state<OpsSummary | null>(getCachedOpsSummary());

	const role = $derived($session?.user?.role);
	const total = $derived(failed.length + dead.length);

	async function load() {
		loading = true;
		error = '';
		try {
			const [f, d] = await Promise.all([listJobs('state=Failed'), listJobs('state=Dead')]);
			failed = f;
			dead = d;
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load attention jobs';
			failed = [];
			dead = [];
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void load();
		return subscribeOpsSummary((s) => (summary = s));
	});
</script>

{#if !canSeeOps(role)}
	<section>
		<p class="muted">Ops access required.</p>
	</section>
{:else}
	<section class="ops">
		<StateRail {summary} />
		<div class="ops__main">
			<header>
				<h1>Attention</h1>
				<p class="muted">
					Failed (retryable) and Dead (DLQ) — GFire-native distinction, not a generic “retries” bag.
				</p>
			</header>

			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}

			{#if loading}
				<p class="muted">Loading…</p>
			{:else if total === 0}
				<p class="ok" role="status">All clear — no Failed or Dead jobs.</p>
			{:else}
				<section>
					<h2>Failed ({failed.length})</h2>
					<JobTable
						jobs={failed}
						onSelect={(id) => goto(`/jobs/${id}`)}
						emptyMessage="No Failed jobs."
					/>
				</section>
				<section>
					<h2>Dead ({dead.length})</h2>
					<JobTable
						jobs={dead}
						onSelect={(id) => goto(`/jobs/${id}`)}
						emptyMessage="No Dead jobs."
					/>
				</section>
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
	}

	h1,
	h2 {
		margin: 0;
	}

	.ok {
		padding: 0.85rem 1rem;
		border-radius: 0.45rem;
		background: color-mix(in srgb, var(--success) 18%, transparent);
		border: 1px solid var(--border);
	}

	.error {
		color: var(--danger);
	}

	.muted {
		color: var(--text-muted);
	}
</style>
