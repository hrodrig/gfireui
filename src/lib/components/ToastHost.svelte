<script lang="ts">
	import { dismissToast, toasts, type Toast } from '$lib/toast/toast';

	function label(kind: Toast['kind']): string {
		switch (kind) {
			case 'success':
				return 'Success';
			case 'error':
				return 'Error';
			default:
				return 'Notice';
		}
	}
</script>

<div class="toast-host" aria-live="polite" aria-relevant="additions text">
	{#each $toasts as toast (toast.id)}
		<div class="toast toast--{toast.kind}" role="status">
			<div class="toast__bar" aria-hidden="true"></div>
			<div class="toast__body">
				<span class="toast__kind">{label(toast.kind)}</span>
				<p class="toast__msg">{toast.message}</p>
			</div>
			<button
				type="button"
				class="toast__close"
				aria-label="Dismiss notification"
				onclick={() => dismissToast(toast.id)}
			>
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-host {
		position: fixed;
		/* Clear sticky nav + Logout so dismiss × never hits nav actions */
		top: 4.5rem;
		right: 1rem;
		z-index: 1000;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.65rem;
		width: min(22rem, calc(100vw - 2rem));
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: grid;
		grid-template-columns: 0.25rem 1fr auto;
		align-items: stretch;
		width: 100%;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-card);
		box-shadow: 0 10px 30px rgb(15 23 42 / 0.18);
		overflow: hidden;
		transform-origin: right center;
		animation: toast-grow 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.toast__bar {
		background: var(--brand);
	}

	.toast--success .toast__bar {
		background: var(--success);
	}

	.toast--error .toast__bar {
		background: var(--danger);
	}

	.toast__body {
		padding: 0.7rem 0.75rem;
		min-width: 0;
	}

	.toast__kind {
		display: block;
		font-family: Sora, system-ui, sans-serif;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-muted);
		animation: toast-msg 0.3s ease 0.18s both;
	}

	.toast__msg {
		margin: 0.2rem 0 0;
		font-size: 0.9rem;
		line-height: 1.35;
		word-break: break-word;
		animation: toast-msg 0.35s ease 0.22s both;
	}

	.toast__close {
		align-self: start;
		margin: 0.35rem 0.35rem 0 0;
		padding: 0.15rem 0.4rem;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 1.1rem;
		line-height: 1;
		cursor: pointer;
	}

	.toast__close:hover,
	.toast__close:focus-visible {
		color: var(--text);
	}

	@keyframes toast-grow {
		0% {
			opacity: 0;
			transform: translateX(1.5rem) scaleX(0.35);
		}
		55% {
			opacity: 1;
			transform: translateX(0) scaleX(1.02);
		}
		100% {
			opacity: 1;
			transform: translateX(0) scaleX(1);
		}
	}

	@keyframes toast-msg {
		from {
			opacity: 0;
			transform: translateX(0.4rem);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
