/** Client-side ring buffer for Hangfire-style activity motion (U-046). */

export type ActivitySample = {
	t: number;
	processing: number;
	succeededDelta: number;
	queueDepth: number;
};

const DEFAULT_MAX = 90;

export class ActivityBuffer {
	private samples: ActivitySample[] = [];
	private prevSucceeded = 0;
	private primed = false;
	readonly max: number;

	constructor(max = DEFAULT_MAX) {
		this.max = max;
	}

	reset() {
		this.samples = [];
		this.prevSucceeded = 0;
		this.primed = false;
	}

	push(input: {
		processing: number;
		succeeded: number;
		queueDepth: number;
		t?: number;
	}): ActivitySample {
		const t = input.t ?? Date.now();
		const succeededDelta = this.primed ? Math.max(0, input.succeeded - this.prevSucceeded) : 0;
		this.prevSucceeded = input.succeeded;
		this.primed = true;
		const sample: ActivitySample = {
			t,
			processing: input.processing,
			succeededDelta,
			queueDepth: input.queueDepth
		};
		this.samples.push(sample);
		if (this.samples.length > this.max) {
			this.samples.splice(0, this.samples.length - this.max);
		}
		return sample;
	}

	list(): ActivitySample[] {
		return this.samples.slice();
	}

	get length(): number {
		return this.samples.length;
	}
}
