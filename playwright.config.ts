import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] }
	},
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173 --strictPort',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'phone', use: { ...devices['Pixel 7'] } }
	]
});
