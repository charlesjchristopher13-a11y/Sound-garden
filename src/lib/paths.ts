import { resolve } from '$app/paths';

/** The configured base path ('' at a domain root, '/Sound-garden' on GitHub Pages). */
const root = resolve('/').replace(/\/$/, '');

/**
 * Prefix an app path like `/sounds/start?q=b` with the base path and give it
 * the trailing slash every page URL uses: `/Sound-garden/sounds/start/?q=b`.
 */
export function to(path: string): string {
	const i = path.search(/[?#]/);
	const [pathname, rest] = i < 0 ? [path, ''] : [path.slice(0, i), path.slice(i)];
	return root + (pathname.endsWith('/') ? pathname : pathname + '/') + rest;
}
