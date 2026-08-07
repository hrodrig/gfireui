<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError } from '$lib/api/client';
	import { listServers } from '$lib/api/gfire';

	let rows = $state<Record<string, unknown>[]>([]);
	let error = $state('');

	onMount(async () => {
		try {
			rows = (await listServers()) as Record<string, unknown>[];
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load servers';
		}
	});
</script>

<section>
	<h1>Servers</h1>
	{#if error}
		<p class="error">{error}</p>
	{/if}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Peer</th>
					<th>Details</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					<tr>
						<td>{String(row.id ?? row.ID ?? row.name ?? row.hostname ?? '—')}</td>
						<td><code>{JSON.stringify(row)}</code></td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if !error && rows.length === 0}
			<p class="muted">No servers reported.</p>
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
	}
	.error {
		color: var(--danger);
	}
	.muted {
		padding: 1rem;
		color: var(--text-muted);
	}
	code {
		font-size: 0.75rem;
		word-break: break-all;
	}
</style>
