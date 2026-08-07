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
		setupFiles: ['./src/lib/test/vitest-setup.ts']
	},
	resolve: {
		alias: {
			'$env/static/public': path.resolve(rootDir, 'src/lib/test/env-public.ts'),
			'$app/navigation': path.resolve(rootDir, 'src/lib/test/navigation-stub.ts')
		}
	}
});
