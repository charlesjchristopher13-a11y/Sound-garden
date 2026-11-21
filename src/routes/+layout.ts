// The app renders in the browser (progress lives on the device), and every
// route is prerendered to a static shell so any URL works on any static host.
export const ssr = false;
export const prerender = true;
export const trailingSlash = 'never';
