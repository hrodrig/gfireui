import { afterEach, describe, expect, it } from 'vitest';

import { chartAxisOpts, getChartTheme, readCssColor } from './chartTheme';

describe('chartTheme', () => {
	afterEach(() => {
		document.documentElement.removeAttribute('style');
	});

	it('reads CSS custom properties with fallbacks', () => {
		document.documentElement.style.setProperty('--brand', ' #38bdf8 ');
		expect(readCssColor('--brand', '#000')).toBe('#38bdf8');
		expect(readCssColor('--missing-token', '#abc')).toBe('#abc');
	});

	it('builds a full chart theme from document tokens', () => {
		document.documentElement.style.setProperty('--brand', '#38bdf8');
		document.documentElement.style.setProperty('--success', '#34d399');
		document.documentElement.style.setProperty('--chart-axis', '#94a3b8');
		document.documentElement.style.setProperty('--chart-grid', '#243044');
		document.documentElement.style.setProperty('--chart-fill-brand', 'rgba(56, 189, 248, 0.14)');
		document.documentElement.style.setProperty('--chart-fill-success', 'rgba(52, 211, 153, 0.14)');

		expect(getChartTheme()).toEqual({
			brand: '#38bdf8',
			success: '#34d399',
			axis: '#94a3b8',
			grid: '#243044',
			fillBrand: 'rgba(56, 189, 248, 0.14)',
			fillSuccess: 'rgba(52, 211, 153, 0.14)'
		});
	});

	it('axis opts use light strokes suitable for dark cards', () => {
		const opts = chartAxisOpts({
			brand: '#38bdf8',
			success: '#34d399',
			axis: '#94a3b8',
			grid: '#243044',
			fillBrand: 'rgba(0,0,0,0)',
			fillSuccess: 'rgba(0,0,0,0)'
		});
		expect(opts.stroke).toBe('#94a3b8');
		expect(opts.grid.stroke).toBe('#243044');
		expect(opts.ticks.stroke).toBe('#94a3b8');
	});
});
