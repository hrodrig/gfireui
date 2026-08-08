import { describe, expect, it } from 'vitest';

import { consoleTitle, consoleVersion, GFIREUI_REPO } from './console';

describe('consoleTitle / consoleVersion', () => {
	it('reads bake-time env from test stub', () => {
		expect(consoleTitle()).toBe('Acme Corp GFire');
		expect(consoleVersion()).toBe('0.1.1');
		expect(GFIREUI_REPO).toContain('gfireui');
	});
});
