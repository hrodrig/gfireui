import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/lib/test/vitest-setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'text-summary'],
			// Quality gate targets lib business logic (routes/components: future E2E / component tests).
			include: ['src/lib/**/*.{ts,js}'],
			exclude: [
				'src/lib/**/*.{test,spec}.{ts,js}',
				'src/lib/test/**',
				'src/lib/api/types.ts',
				'src/lib/index.ts',
				'src/lib/**/*.d.ts'
			],
			thresholds: {
				statements: 80,
				lines: 80
			}
		}
	},
	resolve: {
		alias: {
			'$env/static/public': path.resolve(rootDir, 'src/lib/test/env-public.ts'),
			'$env/dynamic/public': path.resolve(rootDir, 'src/lib/test/env-dynamic-public.ts'),
			'$app/navigation': path.resolve(rootDir, 'src/lib/test/navigation-stub.ts')
		}
	}
});
