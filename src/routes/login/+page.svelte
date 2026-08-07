<script lang="ts">
	import { goto } from '$app/navigation';
	import { ApiError, apiLogin } from '$lib/api/client';
	import { session } from '$lib/auth/session';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);
	let showPassword = $state(false);

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
			if (err instanceof ApiError) {
				error = err.message;
			} else if (err instanceof TypeError) {
				error = 'Cannot reach API (check backend + CORS)';
			} else {
				error = 'Login failed';
			}
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
				<div class="login__password">
					<input
						type={showPassword ? 'text' : 'password'}
						name="password"
						autocomplete="current-password"
						required
						bind:value={password}
					/>
					<button
						type="button"
						class="login__toggle"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						aria-pressed={showPassword}
						onclick={() => (showPassword = !showPassword)}
					>
						{#if showPassword}
							<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
								<path
									fill="currentColor"
									d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
								/>
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
								<path
									fill="currentColor"
									d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
								/>
							</svg>
						{/if}
					</button>
				</div>
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
		width: 100%;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--border);
		border-radius: 0.375rem;
		background: var(--bg-page);
		color: var(--text);
		font: inherit;
		box-sizing: border-box;
	}

	.login__password {
		position: relative;
	}

	.login__password input {
		padding-right: 2.5rem;
	}

	.login__toggle {
		position: absolute;
		top: 50%;
		right: 0.35rem;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		padding: 0.25rem;
		border: none;
		border-radius: 0.25rem;
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
	}

	.login__toggle:hover,
	.login__toggle:focus-visible {
		color: var(--text);
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
