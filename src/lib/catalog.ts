import data from './data/cards.json';

export type Category = 'consonant' | 'digraph' | 'vowel' | 'blend';
export type FamilyId =
	| 'l-blends'
	| 'r-blends'
	| 's-blends'
	| 'more-starters'
	| 'ending'
	| 'three-sounds'
	| 'longer-endings';

export interface Card {
	/** Stable identifier. Saved progress is keyed by it, so never change one. */
	id: string;
	/** Position-based ID from v3 of the app. Only used to migrate old saved stars. */
	legacyId: number;
	category: Category;
	/** The written letters shown on the card. */
	spelling: string;
	/** The sounds the child hears, one entry per sound. */
	phonemes: string[];
	/** The v3 sound label, e.g. "ă", "th quiet", "kw". */
	soundLabel: string;
	picture: { emoji: string; word: string };
	/** Paths relative to /sounds/. `slow` plays the parts with pauses. */
	audio: { main: string; slow?: string };
	/** Short mouth tip for the child. */
	kidTip: string | null;
	/** Longer guidance for the grown-up. */
	adultTip: string;
	examples: { beginning: string[]; middle: string[]; end: string[] };
	blend?: {
		family: FamilyId;
		position: 'beginning' | 'end';
		size: 'two' | 'three-plus';
		advanced: boolean;
	};
}

export const cards = data.cards as Card[];
export const cardById = new Map(cards.map((c) => [c.id, c]));
export const idForLegacy = new Map(cards.map((c) => [c.legacyId, c.id]));

export const FAMILIES: { id: FamilyId; label: string }[] = [
	{ id: 'l-blends', label: 'L blends' },
	{ id: 'r-blends', label: 'R blends' },
	{ id: 's-blends', label: 'S blends' },
	{ id: 'more-starters', label: 'More starters' },
	{ id: 'three-sounds', label: 'Three sounds' },
	{ id: 'ending', label: 'Ending blends' },
	{ id: 'longer-endings', label: 'Longer endings' }
];
export const familyLabel = (id: string) => FAMILIES.find((f) => f.id === id)?.label ?? id;

const CATEGORY_LABEL: Record<Category, string> = {
	consonant: 'Consonant',
	digraph: 'Digraph',
	vowel: 'Vowel',
	blend: 'Blend'
};

/** "L blends · 2 sounds · beginning" or "Vowel". */
export function describeCard(c: Card): string {
	if (!c.blend) return CATEGORY_LABEL[c.category];
	const where = c.blend.position === 'end' ? 'ending' : 'beginning';
	return `${familyLabel(c.blend.family)} · ${c.phonemes.length} sounds · ${where}`;
}

/** What the big label says: "/m/" for single sounds, the spelling for blends. */
export const bigLabel = (c: Card) => (c.blend ? c.spelling : `/${c.soundLabel}/`);

// ---------------------------------------------------------------------------
// Sets: the named groups of cards a grown-up can pick from.

export type SetId =
	| 'today'
	| 'start'
	| 'consonants'
	| 'digraphs'
	| 'vowels'
	| 'two-sound'
	| 'three-plus'
	| 'blends'
	| 'all'
	| 'practiced';

export type Level = 'beginner' | 'core' | 'challenge' | 'mixed';

export interface CardSet {
	id: SetId;
	label: string;
	emoji: string;
	blurb: string;
	level: Level;
	/** Contents depend on the learner's progress. */
	personal?: boolean;
}

export const SETS: CardSet[] = [
	{ id: 'today', label: "Today's practice", emoji: '🌤️', blurb: 'Five cards picked for this learner.', level: 'beginner', personal: true },
	{ id: 'start', label: 'Start here', emoji: '🌱', blurb: 'Twelve first sounds: s, a, t, p and friends.', level: 'beginner' },
	{ id: 'consonants', label: 'Consonants', emoji: '🪁', blurb: 'Single consonant sounds.', level: 'core' },
	{ id: 'digraphs', label: 'Digraphs', emoji: '🤝', blurb: 'Two letters, one sound: sh, ch, th…', level: 'core' },
	{ id: 'vowels', label: 'Vowels', emoji: '🌼', blurb: 'Short, long and other vowel sounds.', level: 'core' },
	{ id: 'two-sound', label: 'Two-sound blends', emoji: '🧩', blurb: 'bl, st, mp… two sounds slid together.', level: 'core' },
	{ id: 'three-plus', label: 'Three-plus sounds', emoji: '🚀', blurb: 'str, spl and longer endings.', level: 'challenge' },
	{ id: 'blends', label: 'All blends', emoji: '🌿', blurb: 'Every blend, beginning and ending.', level: 'mixed' },
	{ id: 'all', label: 'All sounds', emoji: '📚', blurb: 'The whole library.', level: 'mixed' },
	{ id: 'practiced', label: 'Practiced', emoji: '⭐', blurb: 'Cards this learner has tried.', level: 'mixed', personal: true }
];
export const setById = new Map(SETS.map((s) => [s.id, s]));
export const isSetId = (v: string): v is SetId => setById.has(v as SetId);

/** Progress-dependent inputs for the personal sets. */
export interface SetContext {
	today: string[];
	practiced: ReadonlySet<string>;
}

const byIds = (ids: string[]) => ids.map((id) => cardById.get(id)).filter((c): c is Card => !!c);

export const starterIds: string[] = data.starter;
export const huntSingleIds: string[] = data.huntSingles;

export function cardsInSet(set: SetId, ctx: SetContext): Card[] {
	switch (set) {
		case 'today':
			return byIds(ctx.today);
		case 'start':
			return byIds(starterIds);
		case 'consonants':
			return cards.filter((c) => c.category === 'consonant');
		case 'digraphs':
			return cards.filter((c) => c.category === 'digraph');
		case 'vowels':
			return cards.filter((c) => c.category === 'vowel');
		case 'two-sound':
			return cards.filter((c) => c.blend?.size === 'two');
		case 'three-plus':
			return cards.filter((c) => c.blend?.size === 'three-plus');
		case 'blends':
			return cards.filter((c) => c.blend);
		case 'all':
			return cards;
		case 'practiced':
			return cards.filter((c) => ctx.practiced.has(c.id));
	}
}

/** Blend families present in a list, in display order. */
export function familiesIn(list: Card[]): FamilyId[] {
	const present = new Set(list.map((c) => c.blend?.family).filter(Boolean));
	return FAMILIES.map((f) => f.id).filter((id) => present.has(id));
}

const norm = (s: string) => s.toLowerCase().replace(/[/\s·]+/g, ' ').trim();

export function matchesQuery(c: Card, query: string): boolean {
	const q = norm(query);
	if (!q) return true;
	const hay = norm([c.spelling, c.soundLabel, c.picture.word, c.phonemes.join(''), c.id].join(' '));
	return hay.includes(q);
}

export function filterCards(list: Card[], family: string | null, query: string): Card[] {
	return list.filter((c) => (!family || c.blend?.family === family) && matchesQuery(c, query));
}

// ---------------------------------------------------------------------------
// The beginner path: the order "Today's practice" walks through.

export const beginnerPath: string[] = (() => {
	const order = [...starterIds];
	const add = (list: Card[]) => list.forEach((c) => order.includes(c.id) || order.push(c.id));
	add(cards.filter((c) => c.category === 'consonant'));
	add(cards.filter((c) => c.category === 'vowel' && c.id.startsWith('short-')));
	add(cards.filter((c) => c.category === 'digraph'));
	add(
		cards.filter(
			(c) =>
				c.blend &&
				['l-blends', 'r-blends', 's-blends'].includes(c.blend.family) &&
				c.blend.position === 'beginning'
		)
	);
	add(cards.filter((c) => c.category === 'vowel'));
	return order;
})();

/** The next `n` cards on the beginner path that are not yet rated secure. */
export function todayIds(isSecure: (id: string) => boolean, n = 5): string[] {
	const open = beginnerPath.filter((id) => !isSecure(id));
	return (open.length ? open : beginnerPath).slice(0, n);
}

export const soundUrl = (path: string) => `sounds/${path}`;

/** Single-sound clip used for each part button on a blend card. */
export const partAudio = (phoneme: string) => `clear/${phoneme}.mp3`;
