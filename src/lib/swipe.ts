/**
 * Swipe a card sideways to move through a set.
 *
 * The card follows the finger (with resistance when there is nowhere to go),
 * then either flies off and calls `onnext` / `onprev`, or springs back.
 * Vertical scrolling is left to the browser (`touch-action: pan-y`), and a
 * gesture only becomes a swipe once it is clearly horizontal, so taps and
 * scrolls behave normally. Buttons and arrow keys remain the accessible way
 * to do the same thing.
 */

export type Direction = 'next' | 'prev';

export interface SwipeOptions {
	onnext?: () => void;
	onprev?: () => void;
}

/** The direction of the last card change, so the new card can slide in from the matching side. */
export const lastMove: { dir: Direction | null; refocus: 'next' | 'prev' | null } = {
	dir: null,
	refocus: null
};

const DECIDE_PX = 10;
const COMMIT_FRACTION = 0.22;
const COMMIT_VELOCITY = 0.5; // px per ms

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function swipe(node: HTMLElement, initial: SwipeOptions) {
	let opts = initial;
	let id: number | null = null;
	let x0 = 0;
	let y0 = 0;
	let t0 = 0;
	let dx = 0;
	let state: 'idle' | 'pending' | 'swiping' = 'idle';
	let suppressClick = false;

	node.style.touchAction = 'pan-y';

	const target = (d: number) => (d < 0 ? opts.onnext : opts.onprev);

	function setTransform(x: number, animate: boolean) {
		node.style.transition = animate ? 'transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.32s' : 'none';
		node.style.transform = x ? `translate3d(${x}px, 0, 0) rotate(${x / 40}deg)` : '';
		node.style.opacity = x ? String(Math.max(0.4, 1 - Math.abs(x) / (node.offsetWidth * 1.6))) : '';
	}

	function down(e: PointerEvent) {
		if (!e.isPrimary || e.button !== 0 || state !== 'idle') return;
		if ((e.target as HTMLElement).closest('input, textarea, select, details[open] .gbody')) return;
		id = e.pointerId;
		x0 = e.clientX;
		y0 = e.clientY;
		t0 = performance.now();
		dx = 0;
		state = 'pending';
	}

	function move(e: PointerEvent) {
		if (e.pointerId !== id || state === 'idle') return;
		const mx = e.clientX - x0;
		const my = e.clientY - y0;
		if (state === 'pending') {
			if (Math.abs(my) > DECIDE_PX && Math.abs(my) > Math.abs(mx)) return reset(); // a scroll
			if (Math.abs(mx) < DECIDE_PX || Math.abs(mx) < Math.abs(my) * 1.2) return;
			state = 'swiping';
			node.setPointerCapture(e.pointerId);
		}
		e.preventDefault();
		// Resist when there is no card that way.
		dx = target(mx) ? mx : mx * 0.25;
		setTransform(dx, false);
	}

	function up(e: PointerEvent) {
		if (e.pointerId !== id) return;
		if (state !== 'swiping') return reset();
		suppressClick = true;
		const velocity = dx / Math.max(1, performance.now() - t0);
		const go = target(dx);
		const far = Math.abs(dx) > node.offsetWidth * COMMIT_FRACTION || Math.abs(velocity) > COMMIT_VELOCITY;
		if (go && far) {
			lastMove.dir = dx < 0 ? 'next' : 'prev';
			navigator.vibrate?.(8);
			if (reducedMotion()) {
				setTransform(0, false);
				go();
			} else {
				setTransform(Math.sign(dx) * window.innerWidth * 1.1, true);
				setTimeout(go, 160);
			}
		} else {
			setTransform(0, true);
		}
		reset();
	}

	function reset() {
		state = 'idle';
		id = null;
	}

	// A swipe that ends over a button must not also press it.
	function click(e: MouseEvent) {
		if (suppressClick) {
			e.preventDefault();
			e.stopPropagation();
			suppressClick = false;
		}
	}
	function clearSuppress() {
		setTimeout(() => (suppressClick = false), 0);
	}

	node.addEventListener('pointerdown', down);
	node.addEventListener('pointermove', move);
	node.addEventListener('pointerup', up);
	node.addEventListener('pointercancel', () => {
		if (state === 'swiping') setTransform(0, true);
		reset();
	});
	node.addEventListener('click', click, true);
	node.addEventListener('pointerup', clearSuppress);

	return {
		update(next: SwipeOptions) {
			opts = next;
		},
		destroy() {
			node.removeEventListener('pointerdown', down);
			node.removeEventListener('pointermove', move);
			node.removeEventListener('pointerup', up);
			node.removeEventListener('click', click, true);
			node.removeEventListener('pointerup', clearSuppress);
		}
	};
}
