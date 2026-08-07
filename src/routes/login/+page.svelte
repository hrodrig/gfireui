<script lang="ts">
	import { goto } from '$app/navigation';
	import { ApiError, apiLogin } from '$lib/api/client';
	import { session } from '$lib/auth/session';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	$effect(() => {
		if ($session?.user) {
			void goto('/jobs');
		}
	});

	async function onSubmit(event: Event) {
		event.preventDefault();
		error = '';
		busy = true;
		try {
			await apiLogin(email.trim(), password);
			await goto('/jobs');
		} catch (err) {
			error = err instanceof ApiError ? err.message : 'Login failed';
		} finally {
			busy = false;
		}
	}
</script>

<section class="login">
	<div class="login__card">
		<h1>GFireUI</h1>
		<p class="login__lead">Sign in to the ops console</p>
		<form class="login__form" onsubmit={onSubmit}>
			<label>
				<span>Email</span>
				<input
					type="email"
					name="email"
					autocomplete="username"
					required
					bind:value={email}
				/>
			</label>
			<label>
				<span>Password</span>
				<input
					type="password"
					name="password"
					autocomplete="current-password"
					required
					bind:value={password}
				/>
			</label>
			{#if error}
				<p class="login__error" role="alert">{error}</p>
			{/if}
			<button type="submit" class="button-primary" disabled={busy}>
				{busy ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	</div>
</section>

<style>
	.login {
		min-height: calc(100vh - 4rem);
		display: grid;
		place-items: center;
	}

	.login__card {
		width: min(100%, 22rem);
		padding: 1.75rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
	}

	.login__lead {
		margin: 0.25rem 0 1.25rem;
		color: var(--text-muted);
	}

	.login__form {
		display: grid;
		gap: 0.85rem;
	}

	label {
		display: grid;
		gap: 0.35rem;
		font-size: 0.875rem;
	}

	input {
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		background: var(--bg-page);
		color: var(--text);
		font: inherit;
	}

	.login__error {
		margin: 0;
		color: var(--danger);
		font-size: 0.875rem;
	}

	.button-primary {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
	}
</style>
