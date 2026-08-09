<script lang="ts">
	import { stateClass } from '$lib/theme/states';

	type Props = {
		state: string;
	};

	let { state }: Props = $props();
	const cls = $derived(stateClass(state || 'unknown'));
</script>

<span class="badge {cls}">
	<span class="badge__dot" aria-hidden="true"></span>
	{state || '—'}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		line-height: 1.3;
		color: var(--state-fg, var(--text-muted));
		background: var(--state-bg, color-mix(in srgb, var(--text-muted) 14%, transparent));
		border: 1px solid color-mix(in srgb, var(--state-fg, var(--text-muted)) 28%, transparent);
	}

	.badge__dot {
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--state-fg, var(--text-muted));
		flex-shrink: 0;
	}
</style>
