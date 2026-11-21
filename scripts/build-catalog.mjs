// One-time migration: converts the v3 catalog (position-based numeric IDs,
// mixed sound/spelling labels) into the typed catalog the app uses.
//
//   node scripts/build-catalog.mjs
//
// Input:  content/legacy/catalog-v3.json  (extracted from the published app.js)
// Output: src/lib/data/cards.json         (source of truth from here on)
//
// After this runs once, edit src/lib/data/cards.json directly. Never change an
// existing card `id`: saved progress is keyed by it.
import { readFileSync, writeFileSync } from 'node:fs';

const legacy = JSON.parse(readFileSync('content/legacy/catalog-v3.json', 'utf8'));

const VOWEL_IDS = {
	ă: 'short-a', ĕ: 'short-e', ĭ: 'short-i', ŏ: 'short-o', ŭ: 'short-u',
	ā: 'long-a', ē: 'long-e', ī: 'long-i', ō: 'long-o', ū: 'long-u',
	'oo · moon': 'oo-moon', 'oo · book': 'oo-book',
	ow: 'ow', oy: 'oy', ar: 'ar', or: 'or', er: 'er', air: 'air', ear: 'ear', aw: 'aw'
};

const FAMILY_IDS = {
	'L blends': 'l-blends',
	'R blends': 'r-blends',
	'S blends': 's-blends',
	'More starters': 'more-starters',
	'Ending blends': 'ending',
	'Three sounds': 'three-sounds',
	'Longer endings': 'longer-endings'
};

const audioPath = (file) => (file.startsWith('blends/') ? file : 'clear/' + file) + '.mp3';

function idFor(c) {
	if (c.parts) {
		const spelling = c.spelling ?? c.sound;
		return c.placement === 'End' ? 'end-' + spelling : spelling;
	}
	if (c.group === 'Vowels') return VOWEL_IDS[c.sound];
	if (c.sound === 'th · quiet') return 'th-quiet';
	if (c.sound === 'th · voiced') return 'th-voiced';
	return c.sound;
}

function category(c) {
	if (c.parts) return 'blend';
	if (c.group === 'Digraphs') return 'digraph';
	if (c.group === 'Vowels') return 'vowel';
	return 'consonant';
}

const cards = legacy.cards.map((c) => {
	const cat = category(c);
	const [beginning = [], middle = [], end = []] = c.positions;
	const label = c.sound.replace(' · ', ' ');
	const card = {
		id: idFor(c),
		legacyId: c.id,
		category: cat,
		// Written form shown big on the card. For single sounds this is still the
		// v3 label; the content review should replace it with real spellings.
		spelling: c.spelling ?? label,
		// What the child hears, one entry per sound. Blends use the v3 component
		// parts; single sounds use the v3 sound label.
		phonemes: c.parts ?? [label],
		soundLabel: label,
		picture: { emoji: c.emoji, word: c.word },
		audio: { main: audioPath(c.file), ...(c.slowFile ? { slow: audioPath(c.slowFile) } : {}) },
		kidTip: c.parts ? null : (legacy.tips[c.id] ?? null),
		adultTip: c.tip,
		examples: { beginning, middle, end }
	};
	if (c.parts) {
		card.blend = {
			family: FAMILY_IDS[c.family],
			position: c.placement === 'End' ? 'end' : 'beginning',
			size: c.parts.length >= 3 ? 'three-plus' : 'two',
			advanced: !!c.advanced
		};
	}
	return card;
});

const ids = new Set();
for (const c of cards) {
	if (!c.id) throw new Error('Missing id for legacy card ' + c.legacyId);
	if (ids.has(c.id)) throw new Error('Duplicate id ' + c.id);
	ids.add(c.id);
}

const starter = legacy.starter.map((n) => cards[n].id);
const huntSingles = legacy.gameIds.map((n) => cards[n].id);

writeFileSync(
	'src/lib/data/cards.json',
	JSON.stringify({ version: 1, starter, huntSingles, cards }, null, '\t') + '\n'
);
console.log(`Wrote ${cards.length} cards (${cards.filter((c) => c.blend).length} blends).`);
