import { createStore, get, set, type UseStore } from 'idb-keyval';
import { cards, cardById, idForLegacy, todayIds } from './catalog';

/**
 * Per-learner practice records, saved on this device.
 *
 * Storage: IndexedDB first (survives better than localStorage and holds more),
 * localStorage if IndexedDB is unavailable, memory only as a last resort. Any
 * save failure is surfaced through `saveError` so the grown-up knows.
 */

export type Rating = 'practice' | 'secure';
export type CardStatus = 'new' | 'tried' | 'practice' | 'secure';

export interface CardRecord {
	/** Days the learner pressed "I tried it!" (YYYY-MM-DD, newest last, max 60). */
	triedOn: string[];
	/** The grown-up's judgement. */
	rating?: Rating;
	ratedOn?: string;
	/** Sound Hunt: rounds found on the first try / rounds with a miss. */
	huntFirstTry?: number;
	huntMissed?: number;
}

export interface Learner {
	id: string;
	name: string;
	createdOn: string;
	cards: Record<string, CardRecord>;
}

export interface SavedState {
	schema: 1;
	activeId: string;
	learners: Learner[];
}

export type Persistence = 'indexeddb' | 'localstorage' | 'memory';

const KEY = 'sound-garden:v4';
const LEGACY_KEY = 'sound-garden-practiced';
const MAX_DAYS = 60;

export function today(d = new Date()): string {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const newId = () =>
	typeof crypto !== 'undefined' && 'randomUUID' in crypto
		? crypto.randomUUID()
		: Math.random().toString(36).slice(2);

export function newLearner(name: string): Learner {
	return { id: newId(), name, createdOn: today(), cards: {} };
}

export function freshState(): SavedState {
	const l = newLearner('My learner');
	return { schema: 1, activeId: l.id, learners: [l] };
}

export function statusOf(rec: CardRecord | undefined): CardStatus {
	if (!rec) return 'new';
	if (rec.rating) return rec.rating;
	if ((rec.huntMissed ?? 0) > (rec.huntFirstTry ?? 0) + 1) return 'practice';
	return rec.triedOn.length || rec.huntFirstTry ? 'tried' : 'new';
}

/** v3 stored an array of position-based numeric IDs. */
export function migrateLegacy(raw: unknown): Learner | null {
	if (!Array.isArray(raw) || raw.length === 0) return null;
	const l = newLearner('My learner');
	for (const n of raw) {
		const id = Number.isInteger(n) ? idForLegacy.get(n as number) : undefined;
		if (id) l.cards[id] = { triedOn: [l.createdOn] };
	}
	return Object.keys(l.cards).length ? l : null;
}

/** Validates and cleans an imported or loaded state. Throws on bad input. */
export function parseState(input: unknown): SavedState {
	const s = input as Partial<SavedState>;
	if (!s || s.schema !== 1 || !Array.isArray(s.learners) || s.learners.length === 0)
		throw new Error('This is not a Sound Garden backup file.');
	const learners: Learner[] = s.learners.map((l) => {
		if (!l || typeof l.id !== 'string' || typeof l.name !== 'string')
			throw new Error('A learner in this file is damaged.');
		const out: Record<string, CardRecord> = {};
		for (const [id, r] of Object.entries(l.cards ?? {})) {
			if (!cardById.has(id) || !r) continue; // card removed from the catalog
			out[id] = {
				triedOn: Array.isArray(r.triedOn) ? r.triedOn.filter((d) => typeof d === 'string') : [],
				...(r.rating === 'practice' || r.rating === 'secure'
					? { rating: r.rating, ratedOn: r.ratedOn }
					: {}),
				...(r.huntFirstTry ? { huntFirstTry: Number(r.huntFirstTry) || 0 } : {}),
				...(r.huntMissed ? { huntMissed: Number(r.huntMissed) || 0 } : {})
			};
		}
		return { id: l.id, name: l.name.slice(0, 40) || 'Learner', createdOn: l.createdOn ?? today(), cards: out };
	});
	const activeId = learners.some((l) => l.id === s.activeId) ? s.activeId! : learners[0].id;
	return { schema: 1, activeId, learners };
}

class Progress {
	state = $state<SavedState>(freshState());
	loaded = $state(false);
	persistence = $state<Persistence>('indexeddb');
	saveError = $state<string | null>(null);

	#store: UseStore | null = null;
	#savePending = false;

	learner = $derived(
		this.state.learners.find((l) => l.id === this.state.activeId) ?? this.state.learners[0]
	);
	practiced = $derived(
		new Set(Object.keys(this.learner.cards).filter((id) => statusOf(this.learner.cards[id]) !== 'new'))
	);
	today = $derived(todayIds((id) => this.learner.cards[id]?.rating === 'secure'));
	counts = $derived.by(() => {
		const c: Record<CardStatus, number> = { new: 0, tried: 0, practice: 0, secure: 0 };
		for (const card of cards) c[statusOf(this.learner.cards[card.id])]++;
		return c;
	});

	async init() {
		if (this.loaded) return;
		let saved: unknown;
		try {
			this.#store = createStore('sound-garden', 'state');
			saved = await get(KEY, this.#store);
		} catch {
			this.#store = null;
			this.persistence = 'localstorage';
			try {
				const raw = localStorage.getItem(KEY);
				saved = raw ? JSON.parse(raw) : undefined;
			} catch {
				this.persistence = 'memory';
			}
		}

		let migrated = false;
		try {
			this.state = saved ? parseState(saved) : freshState();
		} catch {
			this.state = freshState();
		}
		if (!saved) {
			try {
				const legacy = migrateLegacy(JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null'));
				if (legacy) {
					this.state = { schema: 1, activeId: legacy.id, learners: [legacy] };
					migrated = true;
				}
			} catch {
				/* no legacy data */
			}
		}
		this.loaded = true;
		if (this.persistence === 'memory')
			this.saveError = 'This browser is not letting Sound Garden save. Progress will be lost when the page closes.';
		if (migrated) this.#saveNow();
		// Ask the browser not to clear our data under storage pressure.
		navigator.storage?.persist?.().catch(() => {});
	}

	/** Saves right away (batched within one tick), so closing the tab loses nothing. */
	#save() {
		if (this.#savePending) return;
		this.#savePending = true;
		queueMicrotask(() => {
			this.#savePending = false;
			void this.#saveNow();
		});
	}

	async #saveNow() {
		const snapshot = $state.snapshot(this.state);
		try {
			if (this.persistence === 'indexeddb' && this.#store) await set(KEY, snapshot, this.#store);
			else if (this.persistence === 'localstorage') localStorage.setItem(KEY, JSON.stringify(snapshot));
			else return;
			this.saveError = null;
		} catch {
			this.saveError =
				'Progress could not be saved on this device. Use Progress → Download backup to keep a copy.';
		}
	}

	#rec(id: string): CardRecord {
		return (this.learner.cards[id] ??= { triedOn: [] });
	}

	status(id: string): CardStatus {
		return statusOf(this.learner.cards[id]);
	}

	triedToday(id: string): boolean {
		return this.learner.cards[id]?.triedOn.at(-1) === today();
	}

	/** "I tried it!" — counts once per card per day. */
	markTried(id: string) {
		if (this.triedToday(id)) return;
		const rec = this.#rec(id);
		rec.triedOn = [...rec.triedOn, today()].slice(-MAX_DAYS);
		this.#save();
	}

	rate(id: string, rating: Rating | null) {
		const rec = this.#rec(id);
		if (rating) {
			rec.rating = rating;
			rec.ratedOn = today();
		} else {
			delete rec.rating;
			delete rec.ratedOn;
		}
		this.#save();
	}

	recordHunt(id: string, firstTry: boolean) {
		const rec = this.#rec(id);
		if (firstTry) rec.huntFirstTry = (rec.huntFirstTry ?? 0) + 1;
		else rec.huntMissed = (rec.huntMissed ?? 0) + 1;
		this.#save();
	}

	/** Days with any "I tried it!" in the last `n` days, oldest first. */
	activity(n = 14): { day: string; count: number }[] {
		const counts = new Map<string, number>();
		for (const r of Object.values(this.learner.cards))
			for (const d of r.triedOn) counts.set(d, (counts.get(d) ?? 0) + 1);
		const out = [];
		for (let i = n - 1; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = today(d);
			out.push({ day: key, count: counts.get(key) ?? 0 });
		}
		return out;
	}

	// --- learners --------------------------------------------------------------

	addLearner(name: string) {
		const l = newLearner(name.trim().slice(0, 40) || 'Learner');
		this.state.learners.push(l);
		this.state.activeId = l.id;
		this.#save();
	}

	switchLearner(id: string) {
		if (this.state.learners.some((l) => l.id === id)) {
			this.state.activeId = id;
			this.#save();
		}
	}

	renameLearner(id: string, name: string) {
		const l = this.state.learners.find((x) => x.id === id);
		if (l && name.trim()) {
			l.name = name.trim().slice(0, 40);
			this.#save();
		}
	}

	removeLearner(id: string) {
		if (this.state.learners.length <= 1) return;
		this.state.learners = this.state.learners.filter((l) => l.id !== id);
		if (this.state.activeId === id) this.state.activeId = this.state.learners[0].id;
		this.#save();
	}

	resetLearner(id: string) {
		const l = this.state.learners.find((x) => x.id === id);
		if (l) {
			l.cards = {};
			this.#save();
		}
	}

	// --- backup ------------------------------------------------------------------

	exportJson(): string {
		return JSON.stringify({ ...$state.snapshot(this.state), exportedOn: today(), app: 'sound-garden' }, null, 2);
	}

	importJson(text: string) {
		this.state = parseState(JSON.parse(text));
		this.#saveNow();
	}
}

export const progress = new Progress();
