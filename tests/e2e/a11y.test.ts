import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = ['./', './sounds', './sounds/two-sound', './sounds/blends/bl', './sounds/start/s', './play', './progress', './guide'];

for (const scheme of ['light', 'dark'] as const) {
	for (const path of pages) {
		test(`${path} has no accessibility violations (${scheme})`, async ({ page }) => {
			await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
			await page.goto(path);
			await expect(page.locator('main h1')).toBeVisible();
			if (path.includes('/sounds/') && path.split('/').length === 4) await page.getByText('For grown-ups').click();
			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
				.analyze();
			const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
			expect(summary).toEqual([]);
		});
	}
}

test('keyboard: skip link and focus after navigation', async ({ page }) => {
	await page.goto('./');
	await expect(page.locator('main h1')).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
	await page.goto('./sounds');
	await page.getByRole('link', { name: /Consonants/ }).first().click();
	await expect(page.getByRole('heading', { level: 1, name: /Consonants/ })).toBeFocused();
});

test('tap targets are at least 44px', async ({ page }) => {
	await page.goto('./sounds/blends/bl');
	const small = await page.$$eval('main button, main a.btn, main .chip', (els) =>
		els
			.map((e) => e.getBoundingClientRect())
			.filter((r) => r.width > 0 && (r.height < 44 || r.width < 44))
			.map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`)
	);
	expect(small).toEqual([]);
});
