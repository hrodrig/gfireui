<script lang="ts">
	import type { GFireJob } from '$lib/api/types';
	import { listJobFields, processingServerId, type JobStateEntry } from '$lib/jobs/parse';

	type Props = {
		jobs: GFireJob[];
		onSelect?: (id: string) => void;
		emptyMessage?: string;
	};

	let { jobs, onSelect, emptyMessage = 'No jobs match this filter.' }: Props = $props();

	function peer(job: GFireJob): string {
		const states = (job.states as JobStateEntry[] | undefined) ?? [];
		return processingServerId(states) ?? '—';
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
				<th scope="col">Peer</th>
			</tr>
		</thead>
		<tbody>
			{#each jobs as job}
				{@const fields = listJobFields(job as Record<string, unknown>)}
				<tr>
					<td>
						{#if fields.id && onSelect}
							<button type="button" class="linkish" onclick={() => onSelect(fields.id)}>
								{fields.id}
							</button>
						{:else}
							{fields.id || '—'}
						{/if}
					</td>
					<td>{fields.state || '—'}</td>
					<td>{fields.queue}</td>
					<td>{fields.name}</td>
					<td class="peer">{peer(job)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	{#if jobs.length === 0}
		<p class="empty">{emptyMessage}</p>
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
	}

	th,
	td {
		padding: 0.65rem 0.75rem;
		border-bottom: 1px solid var(--border);
		text-align: left;
		font-size: 0.875rem;
	}

	.peer {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
	}

	.linkish {
		background: none;
		border: none;
		padding: 0;
		color: var(--brand);
		cursor: pointer;
		font: inherit;
		text-decoration: underline;
	}

	.empty {
		margin: 0;
		padding: 1rem;
		color: var(--text-muted);
	}
</style>
