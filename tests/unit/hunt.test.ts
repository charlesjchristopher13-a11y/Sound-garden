import { describe, expect, it } from 'vitest';
import { POOLS, makeRounds, poolCards, soundsAlike } from '../../src/lib/hunt.ts';
import { cardById } from '../../src/lib/catalog.ts';

function seeded(seed: number) {
	return () => {
		seed = (seed * 1664525 + 1013904223) % 4294967296;
		return seed / 4294967296;
	};
}

describe('Sound Hunt', () => {
	it('every built-in pool can make a game', () => {
		for (const p of POOLS.filter((p) => p.id !== 'today'))
			expect(makeRounds(poolCards(p.id), 5), p.id).toHaveLength(5);
	});

	it('never offers a distractor that sounds the same as the target', () => {
		for (let s = 1; s < 200; s++) {
			for (const p of POOLS) {
				const rounds = makeRounds(poolCards(p.id, ['s', 'short-a', 't', 'p', 'short-i']), 5, seeded(s));
				for (const r of rounds) {
					const other = r.options.find((o) => o.id !== r.target.id)!;
					expect(other).toBeTruthy();
					expect(soundsAlike(other, r.target)).toBe(false);
				}
			}
		}
	});

	it('does not repeat a target back to back and balances sides', () => {
		for (let s = 1; s < 200; s++) {
			const rounds = makeRounds(poolCards('l-blends'), 5, seeded(s));
			for (let i = 1; i < rounds.length; i++) expect(rounds[i].target.id).not.toBe(rounds[i - 1].target.id);
			const left = rounds.filter((r) => r.options[0].id === r.target.id).length;
			expect(left === 2 || left === 3).toBe(true);
		}
	});

	it('treats ck and k as the same sound', () => {
		expect(soundsAlike(cardById.get('ck')!, cardById.get('k')!)).toBe(true);
	});

	it('returns no rounds when a pool cannot make a fair choice', () => {
		expect(makeRounds(poolCards('today', ['k', 'ck']), 5)).toEqual([]);
	});
});
