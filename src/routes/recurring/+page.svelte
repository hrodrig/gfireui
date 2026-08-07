<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiPost } from '$lib/api/client';
	import { listRecurring } from '$lib/api/gfire';
	import { canMutateJobs } from '$lib/auth/roles';
	import { session } from '$lib/auth/session';

	let rows = $state<Record<string, unknown>[]>([]);
	let error = $state('');
	let message = $state('');
	let name = $state('');
	let cron = $state('');
	let handler = $state('');

	const mutable = $derived(canMutateJobs($session?.user?.role));

	async function load() {
		error = '';
		try {
			rows = (await listRecurring()) as Record<string, unknown>[];
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load recurring jobs';
		}
	}

	async function createRecurring(event: Event) {
		event.preventDefault();
		message = '';
		error = '';
		try {
			await apiPost('/api/gfire/v1/recurring', {
				name,
				cron,
				handler
			});
			message = 'Created recurring definition';
			name = '';
			cron = '';
			handler = '';
			await load();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Create failed';
		}
	}

	async function trigger(id: string) {
		message = '';
		error = '';
		try {
			await apiPost(`/api/gfire/v1/recurring/${encodeURIComponent(id)}/trigger`);
			message = `Triggered ${id}`;
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Trigger failed';
		}
	}

	onMount(() => {
		void load();
	});
</script>

<section class="page">
	<h1>Recurring</h1>
	{#if error}
		<p class="error">{error}</p>
	{/if}
	{#if message}
		<p class="ok">{message}</p>
	{/if}

	{#if mutable}
		<form class="create" onsubmit={createRecurring}>
			<label>Name <input required bind:value={name} /></label>
			<label>Cron <input required bind:value={cron} placeholder="0 * * * *" /></label>
			<label>Handler <input required bind:value={handler} /></label>
			<button type="submit">Create</button>
		</form>
	{/if}

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Name / ID</th>
					<th>Payload</th>
					{#if mutable}<th>Actions</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each rows as row}
					{@const id = String(row.id ?? row.ID ?? row.name ?? row.Name ?? '')}
					<tr>
						<td>{id || '—'}</td>
						<td><code>{JSON.stringify(row)}</code></td>
						{#if mutable}
							<td>
								{#if id}
									<button type="button" onclick={() => trigger(id)}>Trigger</button>
								{/if}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.page {
		display: grid;
		gap: 1rem;
	}
	.create {
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
	.ok {
		color: var(--success);
	}
	code {
		font-size: 0.75rem;
		word-break: break-all;
	}
</style>
