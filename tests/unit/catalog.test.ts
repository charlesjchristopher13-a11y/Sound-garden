import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	SETS,
	beginnerPath,
	cardById,
	cards,
	cardsInSet,
	filterCards,
	idForLegacy,
	partAudio,
	starterIds,
	todayIds
} from '../../src/lib/catalog.ts';

const ctx = { today: [], practiced: new Set<string>() };

describe('catalog', () => {
	it('keeps the full v3 library', () => {
		expect(cards).toHaveLength(159);
		expect(cards.filter((c) => c.blend)).toHaveLength(112);
		expect(cardsInSet('consonants', ctx)).toHaveLength(19);
		expect(cardsInSet('digraphs', ctx)).toHaveLength(8);
		expect(cardsInSet('vowels', ctx)).toHaveLength(20);
		expect(cardsInSet('two-sound', ctx)).toHaveLength(73);
		expect(cardsInSet('three-plus', ctx)).toHaveLength(39);
		expect(cardsInSet('start', ctx)).toHaveLength(12);
	});

	it('has unique, URL-safe, stable ids', () => {
		const ids = cards.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
	});

	it('maps every v3 numeric id so old stars migrate', () => {
		for (let n = 0; n < 159; n++) expect(idForLegacy.get(n), `legacy ${n}`).toBeTruthy();
	});

	it('has an audio file for every card, slow version and blend part', () => {
		const missing: string[] = [];
		const check = (p?: string) => p && !existsSync(`static/sounds/${p}`) && missing.push(p);
		for (const c of cards) {
			check(c.audio.main);
			check(c.audio.slow);
			if (c.blend) c.phonemes.forEach((p) => check(partAudio(p)));
		}
		expect(missing).toEqual([]);
	});

	it('gives every card a picture, word and spelling', () => {
		for (const c of cards) {
			expect(c.picture.emoji, c.id).toBeTruthy();
			expect(c.picture.word, c.id).toBeTruthy();
			expect(c.spelling, c.id).toBeTruthy();
			expect(c.phonemes.length, c.id).toBeGreaterThan(0);
		}
	});

	it('every set resolves', () => {
		for (const s of SETS) expect(Array.isArray(cardsInSet(s.id, ctx))).toBe(true);
	});

	it('searches spelling, sound and picture word within a family', () => {
		const blends = cardsInSet('blends', ctx);
		expect(filterCards(blends, 'l-blends', '').map((c) => c.spelling)).toEqual(['bl', 'cl', 'fl', 'gl', 'pl', 'sl']);
		expect(filterCards(blends, null, 'block').map((c) => c.id)).toEqual(['bl']);
		expect(filterCards(cards, null, '/m/').map((c) => c.id)).toContain('m');
		expect(filterCards(blends, 'r-blends', 'block')).toEqual([]);
	});
});

describe("today's practice", () => {
	it('starts with the Start here cards', () => {
		expect(beginnerPath.slice(0, 12)).toEqual(starterIds);
		expect(todayIds(() => false)).toEqual(starterIds.slice(0, 5));
	});

	it('skips cards rated secure', () => {
		const secure = new Set(['s', 'short-a']);
		expect(todayIds((id) => secure.has(id))).toEqual(['t', 'p', 'short-i', 'n', 'm']);
	});

	it('only contains real cards and no advanced content', () => {
		for (const id of beginnerPath) {
			const c = cardById.get(id);
			expect(c, id).toBeTruthy();
			expect(c!.blend?.advanced ?? false, id).toBe(false);
		}
	});
});
