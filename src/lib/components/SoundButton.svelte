<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * A button that starts its sound on pointerdown, the moment a finger
	 * lands, rather than waiting for the finger to lift. Keyboard and
	 * screen-reader activation still work through the normal click.
	 */
	let {
		onplay,
		children,
		class: className = 'btn',
		label,
		playing = false
	}: {
		onplay: () => void;
		children: Snippet;
		class?: string;
		label?: string;
		playing?: boolean;
	} = $props();

	let lastPointer = 0;

	function pointerdown(e: PointerEvent) {
		if (e.button !== 0) return;
		lastPointer = performance.now();
		onplay();
	}

	function click() {
		// Skip the click that follows a pointerdown we already handled.
		if (performance.now() - lastPointer < 1000) return;
		onplay();
	}
</script>

<button
	type="button"
	class={[className, { playing }]}
	aria-label={label}
	onpointerdown={pointerdown}
	onclick={click}
>
	{@render children()}
</button>

<style>
	/* Rings ripple out from the button while its sound plays. */
	.playing {
		animation: ripple 1.1s ease-out infinite;
	}
	@keyframes ripple {
		0% {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--honey) 70%, transparent);
		}
		100% {
			box-shadow: 0 0 0 18px transparent;
		}
	}
</style>
