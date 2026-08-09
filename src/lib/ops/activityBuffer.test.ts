import { describe, expect, it } from 'vitest';

import { ActivityBuffer } from './activityBuffer';

describe('ActivityBuffer', () => {
	it('tracks succeeded deltas and caps length', () => {
		const buf = new ActivityBuffer(3);
		buf.push({ processing: 1, succeeded: 10, queueDepth: 0, t: 1 });
		buf.push({ processing: 2, succeeded: 12, queueDepth: 1, t: 2 });
		buf.push({ processing: 0, succeeded: 12, queueDepth: 0, t: 3 });
		buf.push({ processing: 1, succeeded: 15, queueDepth: 2, t: 4 });
		const list = buf.list();
		expect(list).toHaveLength(3);
		expect(list[0].t).toBe(2);
		expect(list[0].succeededDelta).toBe(2);
		expect(list[2].succeededDelta).toBe(3);
		expect(list[2].processing).toBe(1);
	});

	it('first sample has zero delta', () => {
		const buf = new ActivityBuffer();
		const s = buf.push({ processing: 0, succeeded: 5, queueDepth: 0 });
		expect(s.succeededDelta).toBe(0);
	});
});
