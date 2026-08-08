export type Role = 'Administrator' | 'Operator' | 'Auditor' | 'Guest';

export type User = {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	role: Role;
	enabled: boolean;
};

export type LoginResponse = {
	token: string;
	user: User;
};

export type ApiErrorBody = {
	error: string;
};

export type QueueSummary = {
	name: string;
	depth: number;
};

export type OpsVersionInfo = {
	name: string;
	version?: string;
	commit?: string;
	url: string;
};

export type OpsSummary = {
	jobs_by_state: Record<string, number>;
	queues: QueueSummary[];
	servers_count?: number;
	recurring_count?: number;
	versions?: OpsVersionInfo[];
	generated_at: string;
};

export type AuditEvent = {
	id: string;
	actor_user_id?: string | null;
	action: string;
	resource_type: string;
	resource_id?: string | null;
	ip?: string | null;
	user_agent?: string | null;
	payload: Record<string, unknown> | unknown;
	created_at: string;
};

/** Loose GFire job shape (fields vary by engine version / list vs detail). */
export type GFireJob = {
	id?: string;
	ID?: string;
	state?: string;
	State?: string;
	current_state?: string;
	queue?: string;
	Queue?: string;
	handler?: string;
	Handler?: string;
	name?: string;
	job?: Record<string, unknown>;
	states?: unknown[];
	[key: string]: unknown;
};
