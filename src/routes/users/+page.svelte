<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiGet, apiPatch, apiPost } from '$lib/api/client';
	import type { Role, User } from '$lib/api/types';
	import { session } from '$lib/auth/session';
	import { toastError, toastSuccess } from '$lib/toast/toast';

	const roles: Role[] = ['Administrator', 'Operator', 'Auditor', 'Guest'];

	let users = $state<User[]>([]);
	let error = $state('');

	let first_name = $state('');
	let last_name = $state('');
	let email = $state('');
	let role = $state<Role>('Operator');
	let password = $state('');
	let enabled = $state(true);

	let confirmDialog = $state<HTMLDialogElement | null>(null);
	let pendingUser = $state<User | null>(null);
	let pendingBusy = $state(false);

	const meId = $derived($session?.user?.id);
	const pendingAction = $derived(
		pendingUser ? (pendingUser.enabled ? 'disable' : 'enable') : null
	);
	const pendingLabel = $derived(
		pendingUser
			? `${pendingUser.first_name} ${pendingUser.last_name} (${pendingUser.email})`
			: ''
	);

	function isSelf(user: User): boolean {
		return meId != null && user.id === meId;
	}

	async function load() {
		error = '';
		try {
			users = await apiGet<User[]>('/api/users');
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Failed to load users';
		}
	}

	async function createUser(event: Event) {
		event.preventDefault();
		error = '';
		try {
			await apiPost('/api/users', {
				first_name,
				last_name,
				email,
				role,
				enabled,
				password
			});
			toastSuccess('User created');
			first_name = '';
			last_name = '';
			email = '';
			password = '';
			role = 'Operator';
			enabled = true;
			await load();
		} catch (err) {
			toastError(err instanceof ApiError ? err.message : 'Create failed');
		}
	}

	function requestToggle(user: User) {
		if (isSelf(user)) {
			return;
		}
		error = '';
		pendingUser = user;
		confirmDialog?.showModal();
	}

	function cancelToggle() {
		pendingUser = null;
		confirmDialog?.close();
	}

	async function confirmToggle() {
		const user = pendingUser;
		if (!user || isSelf(user)) {
			cancelToggle();
			return;
		}
		pendingBusy = true;
		error = '';
		try {
			await apiPatch(`/api/users/${user.id}`, {
				first_name: user.first_name,
				last_name: user.last_name,
				email: user.email,
				role: user.role,
				enabled: !user.enabled
			});
			toastSuccess(user.enabled ? `Disabled ${user.email}` : `Enabled ${user.email}`);
			cancelToggle();
			await load();
		} catch (err) {
			toastError(err instanceof ApiError ? err.message : 'Update failed');
			cancelToggle();
		} finally {
			pendingBusy = false;
		}
	}

	onMount(() => {
		void load();
	});
</script>

<section class="page">
	<h1>Users</h1>
	{#if error}
		<p class="error">{error}</p>
	{/if}

	<form class="create" onsubmit={createUser}>
		<label>First name <input required bind:value={first_name} /></label>
		<label>Last name <input required bind:value={last_name} /></label>
		<label>Email <input type="email" required bind:value={email} /></label>
		<label>
			Role
			<select bind:value={role}>
				{#each roles as r (r)}
					<option value={r}>{r}</option>
				{/each}
			</select>
		</label>
		<label>Password <input type="password" required bind:value={password} /></label>
		<label class="check"><input type="checkbox" bind:checked={enabled} /> Enabled</label>
		<button type="submit">Create user</button>
	</form>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Role</th>
					<th>Enabled</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each users as user (user.id)}
					<tr>
						<td>{user.first_name} {user.last_name}</td>
						<td>{user.email}</td>
						<td>{user.role}</td>
						<td>{user.enabled ? 'yes' : 'no'}</td>
						<td>
							{#if isSelf(user)}
								<button
									type="button"
									disabled
									title="You cannot enable or disable your own account"
								>
									{user.enabled ? 'Disable' : 'Enable'}
								</button>
							{:else}
								<button type="button" onclick={() => requestToggle(user)}>
									{user.enabled ? 'Disable' : 'Enable'}
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<dialog class="confirm" bind:this={confirmDialog} oncancel={cancelToggle}>
	{#if pendingUser && pendingAction}
		<p>
			Are you sure you want to {pendingAction} the account of {pendingLabel}?
		</p>
		<div class="confirm__actions">
			<button type="button" onclick={cancelToggle} disabled={pendingBusy}>Cancel</button>
			<button
				type="button"
				class="confirm__primary"
				class:confirm__danger={pendingAction === 'disable'}
				onclick={confirmToggle}
				disabled={pendingBusy}
			>
				{pendingBusy ? 'Working…' : pendingAction === 'disable' ? 'Disable' : 'Enable'}
			</button>
		</div>
	{/if}
</dialog>

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
	.check {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	input,
	select {
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
	}
	.error {
		color: var(--danger);
	}

	.confirm {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1.25rem;
		background: var(--bg-card);
		color: var(--text);
		max-width: 28rem;
		width: calc(100% - 2rem);
	}
	.confirm::backdrop {
		background: rgb(15 23 42 / 0.45);
	}
	.confirm p {
		margin: 0 0 1rem;
		line-height: 1.45;
	}
	.confirm__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}
	.confirm__primary {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}
	.confirm__danger {
		background: var(--danger);
		border-color: var(--danger);
		color: #fff;
	}
</style>
