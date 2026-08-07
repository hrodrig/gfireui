<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import uPlot from 'uplot';
	import 'uplot/dist/uPlot.min.css';

	import { apiGet, ApiError } from '$lib/api/client';
	import type { OpsSummary } from '$lib/api/types';

	const STATES = ['pending', 'processing', 'succeeded', 'failed', 'dead'] as const;

	let error = $state('');
	let summary = $state<OpsSummary | null>(null);
	let jobsEl: HTMLDivElement | undefined = $state();
	let queuesEl: HTMLDivElement | undefined = $state();
	let jobsPlot: uPlot | undefined;
	let queuesPlot: uPlot | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;

	async function refresh() {
		try {
			summary = await apiGet<OpsSummary>('/api/ops/summary');
			error = '';
			draw();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load ops summary';
		}
	}

	function draw() {
		if (!summary) return;

		const jobCounts = STATES.map((s) => summary!.jobs_by_state[s] ?? 0);
		if (jobsEl) {
			jobsPlot?.destroy();
			jobsPlot = new uPlot(
				{
					width: Math.max(jobsEl.clientWidth, 280),
					height: 180,
					title: 'Jobs by state',
					series: [{}, { label: 'count', stroke: 'var(--brand)', fill: 'rgba(59,130,246,0.15)' }],
					scales: { x: { time: false } },
					axes: [
						{
							values: (_u, splits) => splits.map((i) => STATES[i] ?? '')
						},
						{}
					]
				},
				[STATES.map((_, i) => i), jobCounts],
				jobsEl
			);
		}

		const queues = summary.queues ?? [];
		const names = queues.map((q) => q.name);
		const depths = queues.map((q) => q.depth);
		if (queuesEl) {
			queuesPlot?.destroy();
			if (names.length === 0) {
				queuesEl.textContent = 'No queues reported';
				queuesPlot = undefined;
				return;
			}
			queuesEl.textContent = '';
			queuesPlot = new uPlot(
				{
					width: Math.max(queuesEl.clientWidth, 280),
					height: 180,
					title: 'Queue depth',
					series: [{}, { label: 'depth', stroke: 'var(--success)', fill: 'rgba(74,222,128,0.15)' }],
					scales: { x: { time: false } },
					axes: [
						{
							values: (_u, splits) => splits.map((i) => names[i] ?? '')
						},
						{}
					]
				},
				[names.map((_, i) => i), depths],
				queuesEl
			);
		}
	}

	onMount(() => {
		void refresh();
		timer = setInterval(() => void refresh(), 3000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
		jobsPlot?.destroy();
		queuesPlot?.destroy();
	});
</script>

<section class="ops" aria-live="polite">
	{#if error}
		<p class="ops__error" role="alert">{error}</p>
	{/if}
	<div class="ops__grid">
		<div class="ops__panel" bind:this={jobsEl}></div>
		<div class="ops__panel" bind:this={queuesEl}></div>
	</div>
	{#if summary}
		<p class="ops__meta">Updated {new Date(summary.generated_at).toLocaleTimeString()}</p>
	{/if}
</section>

<style>
	.ops__grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
	}

	.ops__panel {
		min-height: 12rem;
		padding: 0.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		color: var(--text-muted);
	}

	.ops__error {
		color: var(--danger);
	}

	.ops__meta {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}
</style>
