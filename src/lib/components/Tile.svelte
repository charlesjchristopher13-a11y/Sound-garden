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

<a class="tile" {href} id="tile-{card.id}" data-status={status}>
	{#if status !== 'new'}
		<span class="badge" aria-hidden="true">{status === 'secure' ? '🌻' : status === 'practice' ? '🌱' : '★'}</span>
	{/if}
	<span class="pic" aria-hidden="true">{card.picture.emoji}</span>
	{#if showLetters}<span class="spell">{card.spelling}</span>{/if}
	<span class="word">{card.picture.word}</span>
	{#if card.blend}
		<span class="meta"
			>{card.phonemes.length} sounds · {card.blend.position === 'end' ? 'ending' : 'beginning'}</span
		>
	{/if}
	{#if card.blend?.advanced}<span class="meta challenge">Extra challenge</span>{/if}
	{#if statusText[status]}<span class="sr-only">, {statusText[status]}</span>{/if}
</a>

<style>
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-height: 168px;
		padding: 16px;
		border-radius: var(--radius);
		background: var(--surface);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		color: var(--ink);
		text-decoration: none;
		transition:
			transform 0.15s var(--ease),
			box-shadow 0.15s;
	}
	.tile:hover {
		transform: translateY(-3px);
	}
	.tile:active {
		transform: scale(0.97);
	}
	.pic {
		font-size: 2.9rem;
		line-height: 1.1;
		margin-bottom: 6px;
	}
	.spell {
		font-size: 1.7rem;
		font-weight: 700;
		line-height: 1.1;
	}
	.word {
		font-size: 1.05rem;
		color: var(--ink-soft);
	}
	.meta {
		margin-top: auto;
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
