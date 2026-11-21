<script lang="ts">
	import type { Card } from '#lib/catalog.ts';
	import type { CardStatus } from '#lib/progress.svelte.ts';

	let {
		card,
		href,
		status = 'new',
		showLetters = true
	}: { card: Card; href: string; status?: CardStatus; showLetters?: boolean } = $props();

	const statusText: Record<CardStatus, string> = {
		new: '',
		tried: 'tried',
		practice: 'needs practice',
		secure: 'secure'
	};
</script>

<a class="tile cat-{card.category}" {href} id="tile-{card.id}" data-status={status}>
	{#if status !== 'new'}
		<span class="badge" aria-hidden="true">{status === 'secure' ? '🌻' : status === 'practice' ? '🌱' : '★'}</span>
	{/if}
	<span class="pic" aria-hidden="true">{card.picture.emoji}</span>
	{#if showLetters}<span class="spell">{card.spelling}</span>{/if}
	<span class="word">{card.picture.word}</span>
	{#if card.blend?.position === 'end'}<span class="meta">at the end</span>{/if}
	{#if card.blend?.advanced}<span class="meta challenge">★ Challenge</span>{/if}
	{#if statusText[status]}<span class="sr-only">, {statusText[status]}</span>{/if}
</a>

<style>
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 2px;
		min-height: 168px;
		padding: 16px;
		border-radius: var(--leaf-sm);
		background:
			linear-gradient(140deg, var(--glass-hi), transparent 45%),
			var(--surface);
		border: 1px solid var(--glass-border);
		box-shadow:
			0 6px 0 color-mix(in srgb, var(--cat) 45%, transparent),
			var(--shadow);
		-webkit-backdrop-filter: var(--blur);
		backdrop-filter: var(--blur);
		color: var(--ink);
		text-decoration: none;
		transition:
			transform 0.25s var(--ease),
			box-shadow 0.25s;
	}
	.tile:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow), 0 22px 40px -22px rgb(74 42 23 / 0.45);
	}
	.tile:hover .pic {
		transform: scale(1.08) rotate(-3deg);
	}
	.tile:active {
		transform: translateY(5px);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--cat) 45%, transparent);
	}
	/* The picture sits on a petal in its sound's colour. */
	.pic {
		display: grid;
		place-items: center;
		width: 84px;
		height: 84px;
		margin-bottom: 8px;
		border-radius: 50% 50% 50% 14%;
		font-size: 3rem;
		line-height: 1;
		background: color-mix(in srgb, var(--cat) 32%, transparent);
		box-shadow: inset 0 1px 0 var(--glass-hi);
		transition: transform 0.3s var(--ease);
	}
	.spell {
		font-size: 2rem;
		font-weight: 700;
		line-height: 1.1;
	}
	.word {
		font-size: 1.05rem;
		color: var(--ink-soft);
	}
	.meta {
		margin-top: 2px;
		font-size: 0.9rem;
		color: var(--muted);
	}
	.meta.challenge {
		margin-top: 2px;
		color: var(--sun);
		font-weight: 700;
	}
	.badge {
		position: absolute;
		top: 10px;
		right: 12px;
		font-size: 1.3rem;
		color: var(--honey);
	}
</style>
