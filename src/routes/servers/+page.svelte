<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError } from '$lib/api/client';
	import { listServers } from '$lib/api/gfire';
	import { relativeTime } from '$lib/jobs/parse';

	type ServerRow = {
		id: string;
		workers: string;
		queues: string;
		started: string;
		heartbeat: string;
		status: string;
		raw: Record<string, unknown>;
	};

	let rows = $state<ServerRow[]>([]);
	let error = $state('');

	function mapRow(raw: Record<string, unknown>): ServerRow {
		const queues = raw.queues;
		let queuesLabel = '—';
		if (Array.isArray(queues)) queuesLabel = queues.map(String).join(', ') || '—';
		else if (queues != null) queuesLabel = String(queues);
		return {
			id: String(raw.id ?? raw.ID ?? raw.name ?? raw.hostname ?? '—'),
			workers: String(raw.worker_count ?? raw.workers ?? '—'),
			queues: queuesLabel,
			started: relativeTime(
				raw.started_at != null ? String(raw.started_at) : undefined
			),
			heartbeat: relativeTime(
				raw.last_heartbeat != null
					? String(raw.last_heartbeat)
					: raw.heartbeat != null
						? String(raw.heartbeat)
						: undefined
			),
			status: String(raw.status ?? '—'),
			raw
		};
	}

	onMount(async () => {
		try {
			const list = (await listServers()) as Record<string, unknown>[];
			rows = list.map(mapRow);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load servers';
		}
	});
</script>

<section>
	<h1>Servers</h1>
	<p class="muted">GFire peers sharing storage — workers, queues, and heartbeats.</p>
	{#if error}
		<p class="error">{error}</p>
	{/if}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Workers</th>
					<th>Queues</th>
					<th>Started</th>
					<th>Heartbeat</th>
					<th>Status</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<td><code>{row.id}</code></td>
						<td>{row.workers}</td>
						<td>{row.queues}</td>
						<td>{row.started}</td>
						<td>{row.heartbeat}</td>
						<td>{row.status}</td>
						<td>
							<details>
								<summary>raw</summary>
								<pre>{JSON.stringify(row.raw, null, 2)}</pre>
							</details>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if !error && rows.length === 0}
			<p class="empty">No servers reported.</p>
		{/if}
	</div>
</section>

<style>
	.table-wrap {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		overflow: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
		vertical-align: top;
		font-size: 0.875rem;
	}
	.error {
		color: var(--danger);
	}
	.muted {
		color: var(--text-muted);
	}
	.empty {
		padding: 1rem;
		color: var(--text-muted);
	}
	code {
		font-size: 0.8rem;
	}
	pre {
		margin: 0.35rem 0 0;
		max-width: 20rem;
		overflow: auto;
		font-size: 0.7rem;
	}
</style>
