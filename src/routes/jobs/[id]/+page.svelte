<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import { ApiError } from '$lib/api/client';
	import { cancelJob, deleteJob, getJob } from '$lib/api/gfire';
	import { requeueJob } from '$lib/api/gfire';
	import type { OpsSummary } from '$lib/api/types';
	import StateRail from '$lib/components/StateRail.svelte';
	import { canMutateJobs } from '$lib/auth/roles';
	import { session } from '$lib/auth/session';
	import {
		formatDuration,
		parseJobDetail,
		processingServerId,
		relativeTime,
		stateDurationMs,
		type JobDetail
	} from '$lib/jobs/parse';
	import { getCachedOpsSummary, subscribeOpsSummary } from '$lib/ops/summary';
	import { toastError, toastSuccess } from '$lib/toast/toast';

	let detail = $state<JobDetail | null>(null);
	let error = $state('');
	let busy = $state(false);
	let summary = $state<OpsSummary | null>(getCachedOpsSummary());

	const id = $derived($page.params.id ?? '');
	const role = $derived($session?.user?.role);
	const mutable = $derived(canMutateJobs(role));

	async function load() {
		error = '';
		try {
			const payload = await getJob(id);
			detail = parseJobDetail(payload);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load job';
			detail = null;
		}
	}

	async function run(action: 'requeue' | 'cancel' | 'delete') {
		busy = true;
		error = '';
		try {
			if (action === 'requeue') await requeueJob(id);
			if (action === 'cancel') await cancelJob(id);
			if (action === 'delete') await deleteJob(id);
			toastSuccess(`Action ${action} succeeded`);
			if (action !== 'delete') await load();
			else detail = null;
		} catch (err) {
			toastError(err instanceof ApiError ? err.message : `Action ${action} failed`);
		} finally {
			busy = false;
		}
	}

	onMount(() => {
		void load();
		return subscribeOpsSummary((s) => (summary = s));
	});

	const statesNewestFirst = $derived(
		detail ? [...detail.states].reverse() : []
	);
	const duration = $derived(
		detail ? stateDurationMs(detail.states, 'Processing', 'Succeeded') : undefined
	);
	const peer = $derived(detail ? processingServerId(detail.states) : undefined);
</script>

<section class="ops">
	<StateRail {summary} />
	<div class="ops__main">
		<p><a href="/jobs">← Jobs</a></p>

		{#if error}
			<p class="error" role="alert">{error}</p>
		{/if}

		{#if detail}
			<header class="head">
				<h1>{detail.name}</h1>
				<p class="muted">#{detail.id}</p>
			</header>

			<div class="banner banner--{detail.currentState.toLowerCase()}">
				Current state: <strong>{detail.currentState}</strong>
				{#if peer}
					· peer <code>{peer}</code>
				{/if}
				{#if duration != null}
					· duration {formatDuration(duration)}
				{/if}
			</div>

			<section class="panel">
				<h2>Definition</h2>
				<pre class="code">// Id: {detail.id}
// Queue: {detail.queue}
// Handler: {detail.name}
{JSON.stringify(detail.args, null, 2)}</pre>
			</section>

			<section class="panel">
				<h2>Fields</h2>
				<table class="kv">
					<tbody>
						<tr><th>Queue</th><td>{detail.queue}</td></tr>
						<tr><th>Timeout</th><td>{detail.timeout ?? '—'}</td></tr>
						<tr><th>Retry max</th><td>{detail.retryMax ?? '—'}</td></tr>
						<tr><th>Created</th><td>{relativeTime(detail.createdAt)}</td></tr>
						{#if detail.result != null}
							<tr
								><th>Result</th><td
									><pre class="mini">{JSON.stringify(detail.result, null, 2)}</pre></td
								></tr
							>
						{/if}
					</tbody>
				</table>
			</section>

			{#if detail.continuations.length > 0}
				<section class="panel">
					<h2>Continuations</h2>
					<table>
						<thead>
							<tr>
								<th>Id</th>
								<th>Condition</th>
								<th>State</th>
								<th>Name</th>
							</tr>
						</thead>
						<tbody>
							{#each detail.continuations as c}
								<tr>
									<td>
										{#if c.id}
											<a href="/jobs/{c.id}">{c.id}</a>
										{:else}
											—
										{/if}
									</td>
									<td>{c.condition ?? '—'}</td>
									<td>{c.state ?? '—'}</td>
									<td>{c.name ?? '—'}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</section>
			{/if}

			<section class="panel">
				<div class="panel__head">
					<h2>State history</h2>
					{#if mutable}
						<div class="actions">
							<button type="button" disabled={busy} onclick={() => run('requeue')}>Requeue</button>
							<button type="button" disabled={busy} onclick={() => run('cancel')}>Cancel</button>
							<button
								type="button"
								class="danger"
								disabled={busy}
								onclick={() => run('delete')}>Delete</button
							>
						</div>
					{/if}
				</div>
				<ol class="timeline">
					{#each statesNewestFirst as st}
						<li class="timeline__item">
							<span class="badge">{st.name}</span>
							<span class="muted">{relativeTime(st.created_at)}</span>
							{#if st.name === 'Processing' && st.data?.server_id}
								<span>server <code>{String(st.data.server_id)}</code></span>
							{/if}
							{#if st.reason}
								<pre class="reason">{st.reason}</pre>
							{/if}
						</li>
					{/each}
				</ol>
			</section>
		{:else if !error}
			<p class="muted">Loading…</p>
		{/if}
	</div>
</section>

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
		gap: 1rem;
		min-width: 0;
	}

	.head h1 {
		margin: 0;
	}

	.banner {
		padding: 0.65rem 0.85rem;
		border-radius: 0.45rem;
		background: color-mix(in srgb, var(--brand) 14%, transparent);
		border: 1px solid var(--border);
	}

	.panel {
		padding: 0.85rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		display: grid;
		gap: 0.65rem;
	}

	.panel h2 {
		margin: 0;
		font-size: 1rem;
	}

	.panel__head {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: center;
	}

	.code,
	.mini,
	.reason {
		margin: 0;
		padding: 0.75rem;
		overflow: auto;
		border-radius: 0.35rem;
		background: color-mix(in srgb, var(--bg) 80%, black);
		font-size: 0.8rem;
	}

	.kv th {
		text-align: left;
		padding-right: 1rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.65rem;
	}

	.timeline__item {
		display: grid;
		gap: 0.25rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}

	.badge {
		display: inline-block;
		width: fit-content;
		padding: 0.15rem 0.45rem;
		border-radius: 0.3rem;
		background: color-mix(in srgb, var(--brand) 18%, transparent);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.danger {
		border-color: var(--danger);
		color: var(--danger);
	}

	.error {
		color: var(--danger);
	}

	.muted {
		color: var(--text-muted);
	}
</style>
