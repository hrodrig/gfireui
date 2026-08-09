/** Resolve theme CSS variables for canvas charts (uPlot cannot use var() strokes). */

export type ChartTheme = {
	brand: string;
	success: string;
	axis: string;
	grid: string;
	fillBrand: string;
	fillSuccess: string;
};

const FALLBACKS: ChartTheme = {
	brand: '#f0a94e',
	success: '#3fbf7f',
	axis: '#7d8a99',
	grid: '#232b35',
	fillBrand: 'rgba(240, 169, 78, 0.14)',
	fillSuccess: 'rgba(63, 191, 127, 0.14)'
};

export function readCssColor(name: string, fallback: string, root: Element = document.documentElement): string {
	const value = getComputedStyle(root).getPropertyValue(name).trim();
	return value || fallback;
}

export function getChartTheme(root: Element = document.documentElement): ChartTheme {
	return {
		brand: readCssColor('--brand', FALLBACKS.brand, root),
		success: readCssColor('--success', FALLBACKS.success, root),
		axis: readCssColor('--chart-axis', FALLBACKS.axis, root),
		grid: readCssColor('--chart-grid', FALLBACKS.grid, root),
		fillBrand: readCssColor('--chart-fill-brand', FALLBACKS.fillBrand, root),
		fillSuccess: readCssColor('--chart-fill-success', FALLBACKS.fillSuccess, root)
	};
}

export function chartAxisOpts(
	theme: ChartTheme,
	values?: (u: unknown, splits: number[]) => (string | number | null)[]
) {
	return {
		stroke: theme.axis,
		grid: { stroke: theme.grid, width: 1 },
		ticks: { stroke: theme.axis, width: 1 },
		font: '12px "Source Sans 3", system-ui, sans-serif',
		...(values ? { values } : {})
	};
}
