import { defineConfig, devices } from '@playwright/test';

// BASE_PATH=/Sound-garden npm run test:e2e checks the GitHub Pages layout.
const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://localhost:4173${base}/`,
		launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] }
	},
	webServer: {
		command: `npm run build && node tests/static-server.mjs build '${base}' 4173`,
		port: 4173,
		reuseExistingServer: false,
		timeout: 180_000
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'phone', use: { ...devices['Pixel 7'] } }
	]
});
