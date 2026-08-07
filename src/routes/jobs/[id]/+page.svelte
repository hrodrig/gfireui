<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	import { ApiError } from '$lib/api/client';
	import { cancelJob, deleteJob, getJob, jobId, requeueJob } from '$lib/api/gfire';
	import type { GFireJob } from '$lib/api/types';
	import { canMutateJobs } from '$lib/auth/roles';
	import { session } from '$lib/auth/session';
	import { toastError, toastSuccess } from '$lib/toast/toast';

	let job = $state<GFireJob | null>(null);
	let error = $state('');
	let busy = $state(false);

	const id = $derived($page.params.id ?? '');
	const role = $derived($session?.user?.role);
	const mutable = $derived(canMutateJobs(role));

	async function load() {
		error = '';
		try {
			job = await getJob(id);
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load job';
			job = null;
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
			else job = null;
		} catch (err) {
			toastError(err instanceof ApiError ? err.message : `Action ${action} failed`);
		} finally {
			busy = false;
		}
	}

	onMount(() => {
		void load();
	});
</script>

<section class="page">
	<p><a href="/jobs">← Jobs</a></p>
	<h1>Job {id}</h1>

	{#if error}
		<p class="error" role="alert">{error}</p>
	{/if}

	{#if job}
		<pre class="json">{JSON.stringify(job, null, 2)}</pre>
		{#if mutable}
			<div class="actions">
				<button type="button" disabled={busy} onclick={() => run('requeue')}>Requeue</button>
				<button type="button" disabled={busy} onclick={() => run('cancel')}>Cancel</button>
				<button type="button" class="danger" disabled={busy} onclick={() => run('delete')}>
					Delete
				</button>
			</div>
		{/if}
		<p class="muted">Resolved id: {jobId(job) || id}</p>
	{:else if !error}
		<p class="muted">Loading…</p>
	{/if}
</section>

<style>
	.page {
		display: grid;
		gap: 0.75rem;
	}

	.json {
		margin: 0;
		padding: 1rem;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		font-size: 0.8rem;
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
