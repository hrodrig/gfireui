<script lang="ts">
	import { onMount } from 'svelte';
	import { ApiError, apiGet, apiPatch, apiPost } from '$lib/api/client';
	import type { Role, User } from '$lib/api/types';

	const roles: Role[] = ['Administrator', 'Operator', 'Auditor', 'Guest'];

	let users = $state<User[]>([]);
	let error = $state('');
	let message = $state('');

	let first_name = $state('');
	let last_name = $state('');
	let email = $state('');
	let role = $state<Role>('Operator');
	let password = $state('');
	let enabled = $state(true);

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
		message = '';
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
			message = 'User created';
			first_name = '';
			last_name = '';
			email = '';
			password = '';
			role = 'Operator';
			enabled = true;
			await load();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Create failed';
		}
	}

	async function toggleEnabled(user: User) {
		error = '';
		message = '';
		try {
			await apiPatch(`/api/users/${user.id}`, {
				first_name: user.first_name,
				last_name: user.last_name,
				email: user.email,
				role: user.role,
				enabled: !user.enabled
			});
			message = `Updated ${user.email}`;
			await load();
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Update failed';
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
	{#if message}
		<p class="ok">{message}</p>
	{/if}

	<form class="create" onsubmit={createUser}>
		<label>First name <input required bind:value={first_name} /></label>
		<label>Last name <input required bind:value={last_name} /></label>
		<label>Email <input type="email" required bind:value={email} /></label>
		<label>
			Role
			<select bind:value={role}>
				{#each roles as r}
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
				{#each users as user}
					<tr>
						<td>{user.first_name} {user.last_name}</td>
						<td>{user.email}</td>
						<td>{user.role}</td>
						<td>{user.enabled ? 'yes' : 'no'}</td>
						<td>
							<button type="button" onclick={() => toggleEnabled(user)}>
								{user.enabled ? 'Disable' : 'Enable'}
							</button>
						</td>
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
	.ok {
		color: var(--success);
	}
</style>
