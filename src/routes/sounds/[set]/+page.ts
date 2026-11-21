import { error } from '@sveltejs/kit';
import { SETS, isSetId, setById } from '#lib/catalog.ts';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => SETS.map((s) => ({ set: s.id }));

export const load: PageLoad = ({ params }) => {
	if (!isSetId(params.set)) error(404, 'That set of sounds does not exist.');
	return { set: setById.get(params.set)! };
};
