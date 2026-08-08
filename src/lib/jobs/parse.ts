/** Helpers to normalize GFire job API payloads for the ops console. */

export type JobStateEntry = {
	name: string;
	created_at?: string;
	reason?: string;
	data?: Record<string, unknown> | null;
};

export type JobDetail = {
	id: string;
	name: string;
	queue: string;
	currentState: string;
	args: unknown;
	timeout?: string;
	retryMax?: number;
	result?: unknown;
	createdAt?: string;
	states: JobStateEntry[];
	continuations: ContinuationRow[];
};

export type ContinuationRow = {
	id: string;
	condition?: string;
	state?: string;
	name?: string;
	createdAt?: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
	return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function parseJobDetail(payload: unknown): JobDetail {
	const root = asRecord(payload) ?? {};
	const job = asRecord(root.job) ?? root;
	const id = String(job.id ?? job.ID ?? root.id ?? '');
	const currentState = String(root.current_state ?? job.state ?? job.State ?? '');
	const statesRaw = Array.isArray(root.states) ? root.states : [];
	const states: JobStateEntry[] = statesRaw.map((s) => {
		const r = asRecord(s) ?? {};
		return {
			name: String(r.name ?? r.Name ?? ''),
			created_at: r.created_at != null ? String(r.created_at) : undefined,
			reason: r.reason != null ? String(r.reason) : undefined,
			data: asRecord(r.data)
		};
	});

	const contRaw =
		(Array.isArray(root.continuations) && root.continuations) ||
		(Array.isArray(job.continuations) && job.continuations) ||
		[];
	const continuations: ContinuationRow[] = (contRaw as unknown[]).map((c) => {
		const r = asRecord(c) ?? {};
		return {
			id: String(r.id ?? r.job_id ?? ''),
			condition: r.condition != null ? String(r.condition) : undefined,
			state: r.state != null ? String(r.state) : undefined,
			name: r.name != null ? String(r.name) : r.job != null ? String(r.job) : undefined,
			createdAt: r.created_at != null ? String(r.created_at) : undefined
		};
	});

	return {
		id,
		name: String(job.name ?? job.Name ?? job.handler ?? 'job'),
		queue: String(job.queue ?? job.Queue ?? 'default'),
		currentState,
		args: job.args ?? job.Args ?? null,
		timeout: job.timeout != null ? String(job.timeout) : undefined,
		retryMax: typeof job.retry_max === 'number' ? job.retry_max : undefined,
		result: job.result ?? job.Result,
		createdAt: job.created_at != null ? String(job.created_at) : undefined,
		states,
		continuations
	};
}

export function processingServerId(states: JobStateEntry[]): string | undefined {
	for (let i = states.length - 1; i >= 0; i--) {
		if (states[i].name === 'Processing' && states[i].data?.server_id != null) {
			return String(states[i].data!.server_id);
		}
	}
	return undefined;
}

export function stateDurationMs(states: JobStateEntry[], from: string, to: string): number | undefined {
	const a = states.find((s) => s.name === from)?.created_at;
	const b = states.find((s) => s.name === to)?.created_at;
	if (!a || !b) return undefined;
	const ms = Date.parse(b) - Date.parse(a);
	return Number.isFinite(ms) && ms >= 0 ? ms : undefined;
}

export function formatDuration(ms: number | undefined): string {
	if (ms == null) return '—';
	if (ms < 1000) return `${ms}ms`;
	const s = ms / 1000;
	if (s < 60) return `${s.toFixed(s < 10 ? 2 : 1)}s`;
	const m = Math.floor(s / 60);
	const rem = Math.round(s - m * 60);
	return `${m}m ${rem}s`;
}

export function relativeTime(iso: string | undefined): string {
	if (!iso) return '—';
	const t = Date.parse(iso);
	if (!Number.isFinite(t)) return iso;
	const sec = Math.round((Date.now() - t) / 1000);
	if (sec < 60) return `${sec}s ago`;
	const min = Math.round(sec / 60);
	if (min < 60) return `${min}m ago`;
	const hr = Math.round(min / 60);
	if (hr < 48) return `${hr}h ago`;
	const d = Math.round(hr / 24);
	return `${d}d ago`;
}

export function listJobFields(job: Record<string, unknown>): {
	id: string;
	state: string;
	queue: string;
	name: string;
} {
	const nested = asRecord(job.job);
	const id = String(job.id ?? job.ID ?? nested?.id ?? '');
	const state = String(job.current_state ?? job.state ?? job.State ?? nested?.state ?? '');
	const queue = String(job.queue ?? job.Queue ?? nested?.queue ?? '—');
	const name = String(job.name ?? job.Name ?? nested?.name ?? job.handler ?? '—');
	return { id, state, queue, name };
}
