import { describe, expect, it } from 'vitest';

import { canMutateJobs, canSeeAudit, canSeeOps, canSeeUsers } from './roles';

describe('roles', () => {
	it('Administrator sees users, audit, ops, and can mutate jobs', () => {
		expect(canSeeUsers('Administrator')).toBe(true);
		expect(canSeeAudit('Administrator')).toBe(true);
		expect(canSeeOps('Administrator')).toBe(true);
		expect(canMutateJobs('Administrator')).toBe(true);
	});

	it('Operator mutates jobs and sees ops, not users/audit', () => {
		expect(canSeeUsers('Operator')).toBe(false);
		expect(canSeeAudit('Operator')).toBe(false);
		expect(canSeeOps('Operator')).toBe(true);
		expect(canMutateJobs('Operator')).toBe(true);
	});

	it('Auditor sees audit and ops only', () => {
		expect(canSeeUsers('Auditor')).toBe(false);
		expect(canSeeAudit('Auditor')).toBe(true);
		expect(canSeeOps('Auditor')).toBe(true);
		expect(canMutateJobs('Auditor')).toBe(false);
	});

	it('Guest and undefined see nothing privileged', () => {
		expect(canSeeUsers('Guest')).toBe(false);
		expect(canSeeAudit('Guest')).toBe(false);
		expect(canSeeOps('Guest')).toBe(false);
		expect(canMutateJobs('Guest')).toBe(false);
		expect(canSeeUsers(undefined)).toBe(false);
		expect(canSeeAudit(undefined)).toBe(false);
		expect(canSeeOps(undefined)).toBe(false);
		expect(canMutateJobs(undefined)).toBe(false);
	});
});
