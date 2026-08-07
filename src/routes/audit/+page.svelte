<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiGet } from '$lib/api/client';
	import type { AuditEvent } from '$lib/api/types';

	let events = $state<AuditEvent[]>([]);
	let error = $state('');
	let limit = $state(50);
	let offset = $state(0);

	async function load() {
		error = '';
		try {
			events = await apiGet<AuditEvent[]>(`/api/audit?limit=${limit}&offset=${offset}`);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load audit';
			events = [];
		}
	}

	function nextPage() {
		offset += limit;
		void load();
	}

	function prevPage() {
		offset = Math.max(0, offset - limit);
		void load();
	}

	onMount(() => {
		void load();
	});
</script>

<section class="page">
	<header class="head">
		<h1>Audit</h1>
		<div class="pager">
			<button type="button" onclick={prevPage} disabled={offset === 0}>Previous</button>
			<button type="button" onclick={nextPage} disabled={events.length < limit}>Next</button>
		</div>
	</header>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>When</th>
					<th>Action</th>
					<th>Resource</th>
					<th>Actor</th>
					<th>Payload</th>
				</tr>
			</thead>
			<tbody>
				{#each events as event}
					<tr>
						<td>{new Date(event.created_at).toLocaleString()}</td>
						<td>{event.action}</td>
						<td>{event.resource_type}{event.resource_id ? `:${event.resource_id}` : ''}</td>
						<td>{event.actor_user_id ?? '—'}</td>
						<td><code>{JSON.stringify(event.payload)}</code></td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if !error && events.length === 0}
			<p class="muted">No audit events.</p>
		{/if}
	</div>
</section>

<style>
	.page {
		display: grid;
		gap: 1rem;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	.pager {
		display: flex;
		gap: 0.5rem;
	}
	.table-wrap {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		overflow: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
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
		font-size: 0.7rem;
		word-break: break-all;
	}
</style>
