<script lang="ts">
	import type { GFireJob } from '$lib/api/types';

	type Props = {
		jobs: GFireJob[];
		onSelect?: (id: string) => void;
	};

	let { jobs, onSelect }: Props = $props();

	function jobId(job: GFireJob): string {
		return String(job.id ?? job.ID ?? '');
	}

	function jobField(job: GFireJob, ...keys: string[]): string {
		for (const key of keys) {
			const value = job[key];
			if (value != null && value !== '') return String(value);
		}
		return '—';
	}
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				<th scope="col">ID</th>
				<th scope="col">State</th>
				<th scope="col">Queue</th>
				<th scope="col">Handler</th>
			</tr>
		</thead>
		<tbody>
			{#each jobs as job}
				{@const id = jobId(job)}
				<tr>
					<td>
						{#if id && onSelect}
							<button type="button" class="linkish" onclick={() => onSelect(id)}>{id}</button>
						{:else}
							{id || '—'}
						{/if}
					</td>
					<td>{jobField(job, 'state', 'State')}</td>
					<td>{jobField(job, 'queue', 'Queue')}</td>
					<td>{jobField(job, 'handler', 'Handler', 'type', 'Type')}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if jobs.length === 0}
		<p class="empty">No jobs match this filter.</p>
	{/if}
</div>

<style>
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	th,
	td {
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
	}

	th {
		font-family: Sora, system-ui, sans-serif;
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.linkish {
		border: 0;
		background: none;
		padding: 0;
		color: var(--brand);
		font: inherit;
		cursor: pointer;
		text-decoration: underline;
	}

	.empty {
		margin: 0;
		padding: 1rem;
		color: var(--text-muted);
	}
</style>
