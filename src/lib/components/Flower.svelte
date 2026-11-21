<script lang="ts">
	import type { Card } from '#lib/catalog.ts';

	/**
	 * Today's flower: one petal per card in today's practice. A petal fills
	 * with its sound's colour when the child tries that card today.
	 */
	let { cards, done }: { cards: Card[]; done: (id: string) => boolean } = $props();

	const n = $derived(cards.length || 5);
	const count = $derived(cards.filter((c) => done(c.id)).length);
</script>

<svg
	class="flower"
	viewBox="0 0 200 230"
	role="img"
	aria-label="Today's flower: {count} of {cards.length} petals grown"
>
	<!-- stem and leaves, after the logo -->
	<path class="stem" d="M100 120 C100 160 98 190 100 228" />
	<path class="leaf" d="M100 200 C70 200 46 184 40 160 C66 158 92 172 100 200Z" />
	<path class="leaf" d="M101 186 C128 186 150 172 158 150 C132 148 108 160 101 186Z" />
	{#each cards as c, i (c.id)}
		<g transform="rotate({(360 / n) * i} 100 92)">
			<ellipse
				class="petal cat-{c.category}"
				class:on={done(c.id)}
				cx="100"
				cy="50"
				rx="24"
				ry="40"
				style="--d: {i * 80}ms"
			/>
		</g>
	{/each}
	<circle class="heart" cx="100" cy="92" r="24" />
	<text x="100" y="101" text-anchor="middle" class="num">{count}</text>
</svg>

<style>
	.flower {
		width: 100%;
		max-width: 190px;
		display: block;
		margin: 4px auto 8px;
		overflow: visible;
	}
	.stem {
		fill: none;
		stroke: var(--cat-blend);
		stroke-width: 7;
		stroke-linecap: round;
	}
	.leaf {
		fill: var(--cat-blend);
		opacity: 0.85;
	}
	.petal {
		fill: color-mix(in srgb, var(--cat) 14%, transparent);
		stroke: color-mix(in srgb, var(--cat) 70%, transparent);
		stroke-width: 2.5;
		stroke-dasharray: 6 6;
		transform-box: fill-box;
		transform-origin: 50% 100%;
		transition:
			fill 0.5s,
			transform 0.5s cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	.petal.on {
		fill: var(--cat);
		stroke: none;
		opacity: 0.92;
		transform: scale(1.06);
		animation: bloom 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) var(--d) backwards;
	}
	@keyframes bloom {
		from {
			transform: scale(0.2);
		}
	}
	.heart {
		fill: var(--surface-2-opaque);
		stroke: var(--honey);
		stroke-width: 3;
	}
	.num {
		font-family: var(--font-display);
		font-size: 26px;
		font-weight: 700;
		fill: var(--ink);
	}
</style>
