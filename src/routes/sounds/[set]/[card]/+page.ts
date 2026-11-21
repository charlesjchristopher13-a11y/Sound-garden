import { error } from '@sveltejs/kit';
import { SETS, cardById, cards, cardsInSet, isSetId, setById } from '#lib/catalog.ts';
import type { EntryGenerator, PageLoad } from './$types';

const noProgress = { today: [], practiced: new Set<string>() };

// Prerender every card in every set. Personal sets (today, practiced) can
// hold any card, so they get the whole library.
export const entries: EntryGenerator = () =>
	SETS.flatMap((s) =>
		(s.personal ? cards : cardsInSet(s.id, noProgress)).map((c) => ({ set: s.id, card: c.id }))
	);

export const load: PageLoad = ({ params }) => {
	const card = cardById.get(params.card);
	if (!isSetId(params.set) || !card) error(404, 'That card does not exist.');
	return { set: setById.get(params.set)!, card };
};
