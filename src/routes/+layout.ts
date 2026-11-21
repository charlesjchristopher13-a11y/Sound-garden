// The app renders in the browser (progress lives on the device), and every
// route is prerendered to a static shell so any URL works on any static host.
export const ssr = false;
export const prerender = true;
// Every page is written as <path>/index.html, which every static host serves.
export const trailingSlash = 'always';
