import { expect, test } from '@playwright/test';

test("a beginner reaches today's practice in one tap and can save a star", async ({ page }) => {
	await page.goto('./');
	await expect(page.getByRole('heading', { level: 1, name: "Today's practice" })).toBeVisible();
	await expect(page.getByRole('list', { name: "Today's cards" }).getByRole('listitem')).toHaveCount(5);

	await page.getByRole('link', { name: /Start practice/ }).click();
	await expect(page).toHaveURL(/\/sounds\/today\/s\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toContainText('sun');

	await page.getByRole('button', { name: 'Hear', exact: true }).click();
	await expect(page.locator('.status')).toHaveText(/Your turn!/, { timeout: 5000 });

	// Mouth shows how to make the sound.
	await page.getByRole('button', { name: 'Mouth' }).click();
	await expect(page.getByText('Teeth close. Hiss like a snake!')).toBeVisible();

	await page.getByRole('button', { name: /I tried it!/ }).click();
	await expect(page.getByRole('button', { name: /Tried today!/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByLabel('1 cards practiced')).toBeVisible();

	// Progress survives a reload.
	await page.reload();
	await expect(page.getByRole('button', { name: /Tried today!/ })).toBeVisible();

	await page.getByRole('link', { name: /^Next/ }).click();
	await expect(page).toHaveURL(/\/sounds\/today\/short-a\/$/);
});

test('blend card plays parts and walks the filtered set', async ({ page }) => {
	await page.goto('./sounds/blends?family=l-blends');
	await expect(page.getByRole('list', { name: /cards$/ }).getByRole('listitem')).toHaveCount(6);
	await page.getByRole('link', { name: /block/ }).click();
	await expect(page).toHaveURL(/\/sounds\/blends\/bl\/\?family=l-blends$/);
	await expect(page.getByText('1 of 6')).toBeVisible();

	await page.getByRole('button', { name: 'Hear /b/' }).click();
	await expect(page.locator('.status')).toHaveText(/Your turn!/, { timeout: 5000 });

	await page.getByRole('link', { name: /^Back/ }).click();
	await expect(page).toHaveURL(/\/sl\/\?family=l-blends$/); // wraps to the end

	// Returning to the grid restores the filter and focuses the card.
	await page.getByRole('link', { name: 'Pick a picture' }).click();
	await expect(page).toHaveURL(/\/sounds\/blends\/\?family=l-blends$/);
	await expect(page.locator('#tile-sl')).toBeFocused();
});

test('search explains its scope and offers a wider search', async ({ page }) => {
	await page.goto('./sounds/blends?family=r-blends');
	await page.getByText('Find a sound').click();
	const box = page.getByLabel(/Search in All blends › R blends/);
	await box.fill('block');
	await expect(page.getByText('No cards match “block” in All blends › R blends.')).toBeVisible();
	await page.getByRole('link', { name: /Show 1 match in All sounds/ }).click();
	await expect(page).toHaveURL(/\/sounds\/all\/\?q=block$/);
	await expect(page.getByRole('list', { name: /cards$/ }).getByRole('listitem')).toHaveCount(1);
	await page.getByRole('button', { name: 'Clear search' }).click();
	await expect(page.getByRole('list', { name: /cards$/ }).getByRole('listitem')).toHaveCount(159);
});

test('Sound Hunt plays five rounds and records results', async ({ page }) => {
	await page.goto('./play');
	await page.getByLabel(/L blends/).check();
	await page.getByRole('button', { name: /Start L blends/ }).click();
	for (let round = 0; round < 5; round++) {
		const choices = page.getByRole('group', { name: 'Pictures' }).getByRole('button');
		await choices.first().click();
		if (!(await page.getByText(/You found it/).isVisible())) await choices.nth(1).click();
		await expect(page.getByText(/You found it/)).toBeVisible();
		await page.getByRole('button', { name: /Next round|Finish/ }).click();
	}
	await expect(page.getByRole('heading', { name: 'You grew 5 sound flowers!' })).toBeFocused();
	await page.goto('./sounds/practiced');
	await expect(page.getByRole('list', { name: /cards$/ }).getByRole('listitem').first()).toBeVisible();
});

test('learners, ratings and backup', async ({ page }) => {
	await page.goto('./sounds/start/m');
	await page.getByText('For grown-ups').click();
	await page.getByRole('button', { name: /Secure/ }).click();
	await expect(page.getByRole('button', { name: /Secure/ })).toHaveAttribute('aria-pressed', 'true');

	await page.goto('./progress');
	await expect(page.getByRole('link', { name: 'm · moon' })).toBeVisible();

	const download = page.waitForEvent('download');
	await page.getByRole('button', { name: /Download backup/ }).click();
	expect((await download).suggestedFilename()).toMatch(/^sound-garden-backup-\d{4}-\d\d-\d\d\.json$/);

	await page.getByLabel('Add a learner').fill('Ari');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(page.getByRole('link', { name: /Progress for Ari/ })).toBeVisible();
	await expect(page.getByRole('link', { name: 'm · moon' })).toHaveCount(0);
});

test('v3 stars carry over', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('sound-garden-practiced', '[0,46]'));
	await page.goto('./sounds/practiced');
	await expect(page.getByRole('list', { name: /cards$/ }).getByRole('listitem')).toHaveCount(2);
});

test('shared card links and unknown pages work', async ({ page }) => {
	await page.goto('./sounds/vowels/short-o');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('/ŏ/');
	await page.goto('./sounds/nope');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('could not find');
});

test('swiping a card moves to the next and previous sound', async ({ page }) => {
	await page.goto('./sounds/start/s');
	const card = page.locator('article.card');
	await expect(card).toBeVisible();
	const box = (await card.boundingBox())!;
	const y = box.y + 40; // the top of the card, away from the buttons
	const drag = async (from: number, to: number) => {
		await page.mouse.move(from, y);
		await page.mouse.down();
		for (let i = 1; i <= 8; i++) await page.mouse.move(from + ((to - from) * i) / 8, y);
		await page.mouse.up();
	};

	await drag(box.x + box.width * 0.8, box.x + box.width * 0.1); // swipe left
	await expect(page).toHaveURL(/\/sounds\/start\/short-a\/$/);

	const box2 = (await page.locator('article.card').boundingBox())!;
	await drag(box2.x + box2.width * 0.1, box2.x + box2.width * 0.8); // swipe right
	await expect(page).toHaveURL(/\/sounds\/start\/s\/$/);

	// A short drag springs back and stays on the same card.
	const box3 = (await page.locator('article.card').boundingBox())!;
	await drag(box3.x + box3.width * 0.5, box3.x + box3.width * 0.45);
	await page.waitForTimeout(400);
	await expect(page).toHaveURL(/\/sounds\/start\/s\/$/);
});

test('keyboard Next keeps focus on Next', async ({ page }) => {
	await page.goto('./sounds/start/s');
	await page.getByRole('link', { name: /^Next/ }).focus();
	await page.keyboard.press('Enter');
	await expect(page).toHaveURL(/\/sounds\/start\/short-a\/$/);
	await expect(page.getByRole('link', { name: /^Next/ })).toBeFocused();
});
