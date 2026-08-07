import type { Role } from '$lib/api/types';

export function canSeeUsers(role: Role | undefined): boolean {
	return role === 'Administrator';
}

export function canSeeAudit(role: Role | undefined): boolean {
	return role === 'Administrator' || role === 'Auditor';
}

export function canMutateJobs(role: Role | undefined): boolean {
	return role === 'Administrator' || role === 'Operator';
}

export function canSeeOps(role: Role | undefined): boolean {
	return role === 'Administrator' || role === 'Operator' || role === 'Auditor';
}
