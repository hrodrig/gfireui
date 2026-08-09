<script lang="ts">
	import type { GFireJob } from '$lib/api/types';
	import StateBadge from '$lib/components/StateBadge.svelte';
	import { listJobFields, processingServerId, type JobStateEntry } from '$lib/jobs/parse';
	import { formatClockTime, truncateId } from '$lib/theme/states';

	type Props = {
		jobs: GFireJob[];
		onSelect?: (id: string) => void;
		emptyMessage?: string;
	};

	let { jobs, onSelect, emptyMessage = 'No jobs match this filter.' }: Props = $props();
	let copiedId = $state('');

	function peer(job: GFireJob): string {
		const states = (job.states as JobStateEntry[] | undefined) ?? [];
		return processingServerId(states) ?? '—';
	}

	async function copyId(id: string, e: MouseEvent) {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(id);
			copiedId = id;
			setTimeout(() => {
				if (copiedId === id) copiedId = '';
			}, 1200);
		} catch {
			/* ignore */
		}
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
				<th scope="col">Updated</th>
			</tr>
		</thead>
		<tbody>
			{#each jobs as job}
				{@const fields = listJobFields(job as Record<string, unknown>)}
				<tr>
					<td>
						{#if fields.id}
							<span class="id-cell">
								{#if onSelect}
									<button
										type="button"
										class="linkish"
										title={fields.id}
										onclick={() => onSelect(fields.id)}
									>
										{truncateId(fields.id)}
									</button>
								{:else}
									<span title={fields.id}>{truncateId(fields.id)}</span>
								{/if}
								<button
									type="button"
									class="copy"
									title="Copy ID"
									aria-label="Copy job ID"
									onclick={(e) => void copyId(fields.id, e)}
								>
									{copiedId === fields.id ? '✓' : '⎘'}
								</button>
							</span>
						{:else}
							—
						{/if}
					</td>
					<td><StateBadge state={fields.state || '—'} /></td>
					<td>{fields.queue}</td>
					<td>{fields.name}</td>
					<td class="peer">{peer(job)}</td>
					<td class="updated">{formatClockTime(fields.updatedAt)}</td>
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

	th {
		font-family: Sora, system-ui, sans-serif;
		font-size: 0.7rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		font-weight: 600;
	}

	.id-cell {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.8rem;
	}

	.linkish {
		border: 0;
		background: none;
		padding: 0;
		color: var(--brand);
		font: inherit;
		cursor: pointer;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.copy {
		border: 0;
		background: none;
		padding: 0.1rem 0.25rem;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 0.75rem;
		line-height: 1;
	}

	.copy:hover {
		color: var(--brand);
		border-color: transparent;
	}

	.peer,
	.updated {
		font-family: ui-monospace, monospace;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.empty {
		margin: 0;
		padding: 1rem;
		color: var(--text-muted);
	}
</style>
