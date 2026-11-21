import { cards, cardById, huntSingleIds, type Card } from './catalog';

export type PoolId = 'singles' | 'beginning-blends' | 'l-blends' | 'r-blends' | 's-blends' | 'today';

export const POOLS: { id: PoolId; label: string; emoji: string; prompt: string }[] = [
	{ id: 'singles', label: 'Single sounds', emoji: '🌱', prompt: 'Which picture starts with that sound?' },
	{ id: 'beginning-blends', label: 'Beginning blends', emoji: '🧩', prompt: 'Which picture starts with those sounds?' },
	{ id: 'l-blends', label: 'L blends', emoji: '🍃', prompt: 'Which picture starts with those sounds?' },
	{ id: 'r-blends', label: 'R blends', emoji: '🌈', prompt: 'Which picture starts with those sounds?' },
	{ id: 's-blends', label: 'S blends', emoji: '🐍', prompt: 'Which picture starts with those sounds?' },
	{ id: 'today', label: "Today's practice", emoji: '🌤️', prompt: 'Which picture has that sound?' }
];

export function poolCards(pool: PoolId, todayIds: string[] = []): Card[] {
	const beginningTwo = (c: Card) =>
		c.blend?.position === 'beginning' && c.blend.size === 'two' && !c.blend.advanced;
	switch (pool) {
		case 'singles':
			return huntSingleIds.map((id) => cardById.get(id)!).filter(Boolean);
		case 'beginning-blends':
			return cards.filter(beginningTwo);
		case 'l-blends':
		case 'r-blends':
		case 's-blends':
			return cards.filter((c) => beginningTwo(c) && c.blend!.family === pool);
		case 'today':
			return todayIds.map((id) => cardById.get(id)!).filter(Boolean);
	}
}

/** Two cards a listener could not tell apart: same clip or same sound sequence. */
export function soundsAlike(a: Card, b: Card): boolean {
	return a.audio.main === b.audio.main || a.phonemes.join('+') === b.phonemes.join('+');
}

export interface Round {
	target: Card;
	options: [Card, Card];
}

/**
 * Builds `n` rounds. Targets are drawn without replacement (reshuffling only
 * if the pool is smaller than `n`) and never repeat back to back. The
 * distractor never sounds like the target, and the target's side alternates
 * fairly rather than following a pattern a child can learn.
 */
export function makeRounds(pool: Card[], n = 5, rand: () => number = Math.random): Round[] {
	const distinct = pool.filter((c, i) => pool.findIndex((d) => soundsAlike(c, d)) === i);
	if (distinct.length < 2) return [];

	const shuffle = <T>(xs: T[]) => {
		const a = [...xs];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	};

	const targets: Card[] = [];
	while (targets.length < n) {
		for (const c of shuffle(distinct)) {
			if (targets.length === n) break;
			if (targets.at(-1)?.id === c.id) continue;
			targets.push(c);
		}
	}

	const sides = shuffle(Array.from({ length: n }, (_, i) => i % 2 === 0));
	return targets.map((target, i) => {
		const others = distinct.filter((c) => !soundsAlike(c, target));
		const distractor = others[Math.floor(rand() * others.length)];
		return {
			target,
			options: sides[i] ? [target, distractor] : [distractor, target]
		};
	});
}
