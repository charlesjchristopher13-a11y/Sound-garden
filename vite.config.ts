import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Every page is prerendered as a static file. 404.html is the
			// single-page-app fallback for any URL that was not prerendered.
			adapter: adapter({ fallback: '404.html' })
		})
	],
	test: { include: ['tests/unit/**/*.test.ts'] }
});
