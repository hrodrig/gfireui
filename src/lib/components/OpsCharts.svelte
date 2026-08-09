<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import uPlot from 'uplot';
	import 'uplot/dist/uPlot.min.css';

	import { apiGet, ApiError } from '$lib/api/client';
	import type { OpsSummary } from '$lib/api/types';
	import { ActivityBuffer } from '$lib/ops/activityBuffer';
	import { chartAxisOpts, getChartTheme } from '$lib/theme/chartTheme';
	import { stateClass, stateToken } from '$lib/theme/states';

	const BAR_STATES = [
		'Enqueued',
		'Scheduled',
		'Processing',
		'Awaiting',
		'Succeeded',
		'Failed',
		'Dead'
	] as const;

	let error = $state('');
	let summary = $state<OpsSummary | null>(null);
	let activityEl: HTMLDivElement | undefined = $state();
	let queuesEl: HTMLDivElement | undefined = $state();
	let activityPlot: uPlot | undefined;
	let queuesPlot: uPlot | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;
	let themeObserver: MutationObserver | undefined;
	const buffer = new ActivityBuffer(90);
	let queueEmpty = $state(false);

	const barRows = $derived.by(() => {
		const max = Math.max(1, ...BAR_STATES.map((s) => summary?.jobs_by_state?.[s] ?? 0));
		return BAR_STATES.map((state) => {
			const count = summary?.jobs_by_state?.[state] ?? 0;
			return { state, count, pct: (count / max) * 100 };
		});
	});

	async function refresh() {
		try {
			summary = await apiGet<OpsSummary>('/api/ops/summary');
			error = '';
			const processing = summary.jobs_by_state?.Processing ?? 0;
			const succeeded = summary.jobs_by_state?.Succeeded ?? 0;
			const queueDepth = (summary.queues ?? []).reduce((n, q) => n + (q.depth ?? 0), 0);
			buffer.push({ processing, succeeded, queueDepth });
			drawActivity();
			drawQueues();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load ops summary';
		}
	}

	function cssStateColor(state: string): string {
		const token = stateToken(state);
		return (
			getComputedStyle(document.documentElement).getPropertyValue(token).trim() ||
			getChartTheme().axis
		);
	}

	function drawActivity() {
		if (!activityEl) return;
		const samples = buffer.list();
		activityPlot?.destroy();
		if (samples.length < 2) {
			activityEl.textContent = 'Collecting activity samples…';
			activityPlot = undefined;
			return;
		}
		activityEl.textContent = '';
		const theme = getChartTheme();
		const xs = samples.map((s) => s.t / 1000);
		activityPlot = new uPlot(
			{
				width: Math.max(activityEl.clientWidth, 280),
				height: 160,
				title: 'Activity (last ~polls)',
				series: [
					{},
					{
						label: 'Processing',
						stroke: cssStateColor('Processing'),
						fill: 'rgba(79, 166, 224, 0.12)',
						width: 2
					},
					{
						label: 'Succeeded Δ',
						stroke: cssStateColor('Succeeded'),
						width: 2
					}
				],
				scales: { x: { time: true } },
				axes: [chartAxisOpts(theme), chartAxisOpts(theme)]
			},
			[xs, samples.map((s) => s.processing), samples.map((s) => s.succeededDelta)],
			activityEl
		);
	}

	function drawQueues() {
		if (!queuesEl || !summary) return;
		const queues = summary.queues ?? [];
		const names = queues.map((q) => q.name);
		const depths = queues.map((q) => q.depth);
		const total = depths.reduce((a, b) => a + b, 0);
		queuesPlot?.destroy();
		queueEmpty = names.length === 0 || total === 0;
		if (queueEmpty) {
			queuesEl.textContent = '';
			queuesPlot = undefined;
			return;
		}
		queuesEl.textContent = '';
		const theme = getChartTheme();
		queuesPlot = new uPlot(
			{
				width: Math.max(queuesEl.clientWidth, 280),
				height: 180,
				title: 'Queue depth',
				series: [
					{},
					{
						label: 'depth',
						stroke: theme.brand,
						fill: theme.fillBrand,
						paths: uPlot.paths.bars!({ size: [0.6, Infinity] }),
						points: { show: false }
					}
				],
				scales: { x: { time: false } },
				axes: [
					chartAxisOpts(theme, (_u, splits) => splits.map((i) => names[i] ?? '')),
					chartAxisOpts(theme)
				]
			},
			[names.map((_, i) => i), depths],
			queuesEl
		);
	}

	onMount(() => {
		void refresh();
		timer = setInterval(() => void refresh(), 3000);
		themeObserver = new MutationObserver(() => {
			drawActivity();
			drawQueues();
		});
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme']
		});
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
		themeObserver?.disconnect();
		activityPlot?.destroy();
		queuesPlot?.destroy();
	});
</script>

<section class="ops" aria-live="polite">
	{#if error}
		<p class="ops__error" role="alert">{error}</p>
	{/if}

	<div class="ops__panel ops__panel--wide">
		<div class="ops__head">
			<h2 class="ops__title">Activity</h2>
			<p class="ops__sub">Sliding window from ops summary polls</p>
		</div>
		<div class="ops__chart" bind:this={activityEl}></div>
	</div>

	<div class="ops__grid">
		<div class="ops__panel">
			<div class="ops__head">
				<h2 class="ops__title">Jobs by state</h2>
				<p class="ops__sub">Distribution across the job lifecycle</p>
			</div>
			<ul class="bars">
				{#each barRows as row (row.state)}
					<li class="bars__row {stateClass(row.state)}">
						<span class="bars__label">{row.state}</span>
						<span class="bars__track">
							<span class="bars__fill" style:width="{row.pct}%"></span>
						</span>
						<span class="bars__count">{row.count}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div class="ops__panel">
			<div class="ops__head">
				<h2 class="ops__title">Queue depth</h2>
				<p class="ops__sub">Live backlog by queue</p>
			</div>
			{#if queueEmpty}
				<div class="empty">
					<p class="empty__title">No queue depth yet</p>
					<p class="empty__body">Depth appears here once jobs start piling up in a queue.</p>
				</div>
			{/if}
			<div
				class="ops__chart"
				class:ops__chart--hidden={queueEmpty}
				bind:this={queuesEl}
			></div>
		</div>
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
		margin-top: 1rem;
	}

	.ops__panel {
		min-height: 12rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		color: var(--text-muted);
	}

	.ops__panel--wide {
		min-height: 0;
	}

	.ops__head {
		margin-bottom: 0.65rem;
	}

	.ops__title {
		margin: 0;
		font-size: 0.9rem;
		color: var(--text);
	}

	.ops__sub {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		letter-spacing: 0.02em;
		color: var(--text-muted);
	}

	.ops__chart {
		min-height: 8rem;
	}

	.ops__chart--hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}

	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.45rem;
	}

	.bars__row {
		display: grid;
		grid-template-columns: 6.5rem 1fr 2rem;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.8rem;
	}

	.bars__label {
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	.bars__track {
		height: 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--border) 80%, transparent);
		overflow: hidden;
	}

	.bars__fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--state-fg, var(--brand));
		min-width: 0;
		transition: width 0.25s ease;
	}

	.bars__count {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: var(--text);
	}

	.empty {
		display: grid;
		place-content: center;
		gap: 0.35rem;
		min-height: 9rem;
		text-align: center;
		padding: 1rem;
	}

	.empty__title {
		margin: 0;
		color: var(--text);
		font-weight: 600;
		font-size: 0.9rem;
	}

	.empty__body {
		margin: 0;
		font-size: 0.8rem;
		max-width: 18rem;
		justify-self: center;
	}

	.ops__error {
		color: var(--danger);
	}

	.ops__meta {
		margin: 0.5rem 0 0;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.ops__panel :global(.uplot) {
		font-family: 'Source Sans 3', system-ui, sans-serif;
		color: var(--text-muted);
	}

	.ops__panel :global(.u-title) {
		color: var(--text);
		font-family: Sora, system-ui, sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.ops__panel :global(.u-legend) {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.ops__panel :global(.u-legend th),
	.ops__panel :global(.u-legend .u-value) {
		color: var(--text-muted);
	}
</style>
