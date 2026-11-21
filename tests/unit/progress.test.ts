import { describe, expect, it } from 'vitest';
import { freshState, migrateLegacy, parseState, statusOf } from '../../src/lib/progress.svelte.ts';

describe('progress records', () => {
	it('derives status from tries, ratings and game results', () => {
		expect(statusOf(undefined)).toBe('new');
		expect(statusOf({ triedOn: ['2026-11-20'] })).toBe('tried');
		expect(statusOf({ triedOn: [], huntFirstTry: 1 })).toBe('tried');
		expect(statusOf({ triedOn: ['2026-11-20'], rating: 'secure' })).toBe('secure');
		expect(statusOf({ triedOn: [], huntMissed: 3, huntFirstTry: 1 })).toBe('practice');
	});

	it('migrates v3 stars (numeric ids) to stable ids', () => {
		const l = migrateLegacy([0, 24, 46, 999, 'x'])!;
		expect(Object.keys(l.cards).sort()).toEqual(['b', 'bl', 'short-a']);
		expect(migrateLegacy([])).toBeNull();
		expect(migrateLegacy('nope')).toBeNull();
	});

	it('round-trips a backup and drops unknown cards', () => {
		const s = freshState();
		s.learners[0].cards = { b: { triedOn: ['2026-11-20'], rating: 'secure' }, gone: { triedOn: [] } };
		const back = parseState(JSON.parse(JSON.stringify(s)));
		expect(back.learners[0].cards).toEqual({ b: { triedOn: ['2026-11-20'], rating: 'secure', ratedOn: undefined } });
		expect(back.activeId).toBe(s.activeId);
	});

	it('rejects files that are not backups', () => {
		expect(() => parseState({})).toThrow(/not a Sound Garden backup/);
		expect(() => parseState({ schema: 1, learners: [{}] })).toThrow(/damaged/);
	});
});
