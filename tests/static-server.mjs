// A deliberately strict static file server that behaves like GitHub Pages:
// exact files only, directories redirect to a trailing slash and serve
// index.html, anything else gets 404.html with a 404 status. No extension
// guessing, so the browser tests catch any URL a plain static host can't serve.
//
//   node tests/static-server.mjs <dir> <base-path> <port>
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const [dir = 'build', base = '', port = '4173'] = process.argv.slice(2);
/** @type {Record<string, string>} */
const types = {
	'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
	'.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
	'.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain'
};

/**
 * @param {import('node:http').ServerResponse} res
 * @param {string} file
 */
function send(res, file, status = 200) {
	res.writeHead(status, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
	createReadStream(file).pipe(res);
}

createServer((req, res) => {
	const url = new URL(req.url ?? '/', 'http://x');
	const notFound = () => send(res, join(dir, '404.html'), 404);
	if (!url.pathname.startsWith(base + '/')) return notFound();
	const rel = normalize(decodeURIComponent(url.pathname.slice(base.length)));
	if (rel.includes('..')) return notFound();
	const path = join(dir, rel);
	if (!existsSync(path)) return notFound();
	if (statSync(path).isDirectory()) {
		if (!url.pathname.endsWith('/')) {
			res.writeHead(301, { location: url.pathname + '/' + url.search });
			return res.end();
		}
		const index = join(path, 'index.html');
		return existsSync(index) ? send(res, index) : notFound();
	}
	send(res, path);
}).listen(Number(port), () => console.log(`serving ${dir} at http://localhost:${port}${base}/`));
