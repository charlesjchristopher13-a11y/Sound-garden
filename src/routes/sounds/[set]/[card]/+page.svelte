<script lang="ts">
	import { to } from '#lib/paths.ts';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import SoundButton from '#lib/components/SoundButton.svelte';
	import { player } from '#lib/audio.svelte.ts';
	import {
		bigLabel,
		cardsInSet,
		describeCard,
		familyLabel,
		filterCards,
		partAudio
	} from '#lib/catalog.ts';
	import { progress, type Rating } from '#lib/progress.svelte.ts';
	import { lastMove, swipe, type Direction } from '#lib/swipe.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const card = $derived(data.card);
	const set = $derived(data.set);

	// The list Back/Next walk through: same set, family and search as the grid.
	const search = $derived(page.url.search);
	const family = $derived(page.url.searchParams.get('family'));
	const q = $derived(page.url.searchParams.get('q') ?? '');
	const ctx = $derived({ today: progress.today, practiced: progress.practiced });
	const list = $derived.by(() => {
		const l = filterCards(cardsInSet(set.id, ctx), family, q);
		return l.length ? l : cardsInSet(set.id, ctx);
	});
	const pos = $derived(list.findIndex((c) => c.id === card.id));
	const prev = $derived(list.length > 1 ? list[(Math.max(pos, 0) - 1 + list.length) % list.length] : null);
	const next = $derived(list.length > 1 ? list[(pos + 1) % list.length] : null);
	const hrefFor = (id: string) => to(`/sounds/${set.id}/${id}${search}`);
	const backHref = $derived(to(`/sounds/${set.id}${search}`));

	const label = $derived(`/${card.soundLabel}/`);
	const listen = () => player.play(card.audio.main, label);
	const slow = () => card.audio.slow && player.play(card.audio.slow, `${card.phonemes.map((p) => `/${p}/`).join(' ')}`);
	const three = () => player.play(card.audio.main, label, 3);

	// Play on open (if sound is unlocked) and warm up the neighbours.
	// Only `card` is tracked: progress or status changes must not replay it.
	$effect(() => {
		const c = card;
		untrack(() => {
			if (player.ready) void player.play(c.audio.main, `/${c.soundLabel}/`);
			else player.needTap();
			player.preload([
				c.audio.slow,
				...(c.blend ? c.phonemes.map(partAudio) : []),
				next?.audio.main,
				prev?.audio.main
			]);
		});
	});

	// Move through the set, remembering the direction so the next card can
	// slide in from the matching side.
	function go(dir: Direction) {
		const c = dir === 'next' ? next : prev;
		if (!c) return;
		lastMove.dir = dir;
		goto(hrefFor(c.id));
	}
	let enterDir = $state<Direction | null>(null);
	$effect.pre(() => {
		void card;
		untrack(() => {
			enterDir = lastMove.dir;
			lastMove.dir = null;
		});
	});
	// The card is re-created on each change; keep keyboard focus on Back/Next.
	$effect(() => {
		void card;
		const rel = lastMove.refocus;
		lastMove.refocus = null;
		if (rel) document.querySelector<HTMLElement>(`.stage a[rel='${rel}']`)?.focus();
	});

	const tried = $derived(progress.triedToday(card.id));
	const rating = $derived(progress.learner.cards[card.id]?.rating ?? null);
	function rate(r: Rating) {
		progress.rate(card.id, rating === r ? null : r);
	}

	function onkey(e: KeyboardEvent) {
		if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
		const t = e.target as HTMLElement;
		if (t.closest('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowRight') go('next');
		else if (e.key === 'ArrowLeft') go('prev');
	}

	// A friendly word for the child instead of the technical description.
	const kindLabel = $derived(
		card.blend ? 'Blend' : card.category === 'digraph' ? 'Two letters, one sound' : card.category === 'vowel' ? 'Vowel' : 'Sound'
	);

	// "Mouth": show how to make the sound, and play it.
	let showMouth = $state(false);
	function mouth() {
		showMouth = !showMouth;
		if (showMouth) listen();
	}

	const kidPrompt = $derived(
		card.blend
			? card.phonemes.length === 2
				? 'Say both sounds. Slide them close together!'
				: 'Say each sound. Slide them close together!'
			: (card.kidTip ?? card.adultTip)
	);
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>{card.spelling} · {card.picture.word} · Sound Garden</title></svelte:head>

<div class="wrap">
	<div class="topline">
		<a class="btn" href={backHref}><span aria-hidden="true">🌼</span> Pick a picture</a>
		{#if pos >= 0}<span class="where">{pos + 1} of {list.length}</span>{/if}
	</div>

	<div class="stage">
		{#if prev}
			<a
				class="arrow prev"
				href={hrefFor(prev.id)}
				rel="prev"
				onclick={() => ((lastMove.dir = 'prev'), (lastMove.refocus = 'prev'))}
			>
				<span aria-hidden="true">◀</span><span class="sr-only">Back: {prev.picture.word}</span>
			</a>
		{/if}

		{#key card.id}
			<article
				class="card panel cat-{card.category}"
				class:enter-next={enterDir === 'next'}
				class:enter-prev={enterDir === 'prev'}
				aria-labelledby="card-h"
				use:swipe={{ onnext: next ? () => go('next') : undefined, onprev: prev ? () => go('prev') : undefined }}
			>
				<span class="kind">{kindLabel}</span>
				<div class="orb-wrap">
					<span class="pic" role="img" aria-label={card.picture.word}>{card.picture.emoji}</span>
					<!-- The logo's sound waves; they ripple while a sound plays. -->
					<svg class="waves" class:on={player.status.playing} viewBox="0 0 60 60" aria-hidden="true">
						<path d="M8 22a14 14 0 0 1 14 14" />
						<path d="M8 10a26 26 0 0 1 26 26" />
						<path d="M8 -2a38 38 0 0 1 38 38" />
					</svg>
				</div>
				<h1 id="card-h" tabindex="-1">
					<span class="letters">{bigLabel(card)}</span>
					<span class="sr-only">, as in</span>
					<span class="word">{card.picture.word}</span>
				</h1>
				{#if card.blend?.position === 'end'}
					<p class="hint">Listen at the end of the word.</p>
				{/if}

				{#if card.blend}
					<div class="parts" role="group" aria-label="Sounds in this blend">
						{#each card.phonemes as p, i (i)}
							<SoundButton class="bubble" label="Hear /{p}/" onplay={() => player.play(partAudio(p), `/${p}/`)}>
								/{p}/
							</SoundButton>
							{#if i < card.phonemes.length - 1}<span class="plus" aria-hidden="true">+</span>{/if}
						{/each}
					</div>
				{/if}

				<!-- Hear · Slow · Mouth · Again: big round buttons with a caption. -->
				<div class="trio">
					<SoundButton class="circle hear" onplay={listen} playing={player.status.playing}>
						<span class="dot" aria-hidden="true">🔊</span><span class="cap">Hear</span>
					</SoundButton>
					{#if card.audio.slow}
						<SoundButton class="circle slow" onplay={slow}>
							<span class="dot" aria-hidden="true">🐢</span><span class="cap">Slow</span>
						</SoundButton>
					{/if}
					<button type="button" class="circle mouth" aria-expanded={showMouth} onclick={mouth}>
						<span class="dot" aria-hidden="true">👄</span><span class="cap">Mouth</span>
					</button>
					<SoundButton class="circle again" onplay={three}>
						<span class="dot" aria-hidden="true">🔁</span><span class="cap">Again</span>
					</SoundButton>
				</div>
				<p class="status" aria-hidden="true">{player.status.message || ' '}</p>

				{#if showMouth}
					<p class="mouth-tip"><span aria-hidden="true">👄</span> {kidPrompt}</p>
				{/if}

				<button type="button" class="btn big tried" aria-pressed={tried} onclick={() => progress.markTried(card.id)}>
					<span class="star" aria-hidden="true">{tried ? '★' : '☆'}</span>
					{tried ? 'Tried today!' : 'I tried it!'}
				</button>
			</article>
		{/key}

		{#if next}
			<a
				class="arrow next"
				href={hrefFor(next.id)}
				rel="next"
				onclick={() => ((lastMove.dir = 'next'), (lastMove.refocus = 'next'))}
			>
				<span class="sr-only">Next: {next.picture.word}</span><span aria-hidden="true">▶</span>
			</a>
		{/if}
	</div>

	{#if next || prev}<p class="swipe-hint" aria-hidden="true">Swipe the card to change sounds</p>{/if}

	<details class="grownup panel">
		<summary>For grown-ups: how is it going, word examples &amp; tips</summary>
		<div class="gbody">
			<p class="about">
				<strong>{describeCard(card)}</strong>{card.blend?.advanced ? ' · Extra challenge' : ''}{family
					? ` · showing ${familyLabel(family)}`
					: ''}
			</p>
			<fieldset class="rating">
				<legend>How secure is this sound?</legend>
				<div class="rbtns">
					<button type="button" class="btn" aria-pressed={rating === 'practice'} onclick={() => rate('practice')}>
						🌱 Needs practice
					</button>
					<button type="button" class="btn" aria-pressed={rating === 'secure'} onclick={() => rate('secure')}>
						🌻 Secure
					</button>
				</div>
				<p class="muted small">
					Stars show the child tried. Your rating records how it sounded. Secure cards leave Today's practice.
				</p>
			</fieldset>

			<div class="words">
				{#each [['Beginning', card.examples.beginning], ['Middle', card.examples.middle], ['End', card.examples.end]] as [h, ws] (h)}
					<section>
						<h2>{h}</h2>
						<p>{(ws as string[]).length ? (ws as string[]).join(' · ') : '—'}</p>
					</section>
				{/each}
			</div>
			<p>{card.adultTip}</p>
			<p class="muted small">
				{card.blend
					? 'The blend audio joins short single-sound clips as a practice model. Help your child slide the sounds into natural connected speech.'
					: 'The audio plays only the featured sound, not the picture word.'}
			</p>
			{#if card.blend?.advanced}
				<p class="muted small">
					Extra challenge: save this for later if your child is still learning single sounds. R-ending clusters use
					American /r/.
				</p>
			{/if}
		</div>
	</details>
</div>

<style>
	.topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		max-width: 920px;
		margin: 0 auto 14px;
	}
	.where {
		font-weight: 700;
		color: var(--ink-soft);
		padding: 6px 14px;
		border-radius: 999px;
		background: var(--surface-2);
	}

	/* Card in the middle, big arrows either side. */
	.stage {
		display: grid;
		grid-template-columns: 88px minmax(0, 720px) 88px;
		grid-template-areas: 'prev card next';
		justify-content: center;
		align-items: center;
		gap: 16px;
	}
	.card {
		grid-area: card;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding-top: 22px;
		user-select: none;
		-webkit-user-select: none;
		will-change: transform;
	}
	.arrow {
		display: grid;
		place-items: center;
		width: 84px;
		height: 84px;
		border-radius: 50%;
		font-size: 2rem;
		text-decoration: none;
		color: var(--on-leaf);
		background: var(--leaf-grad);
		box-shadow:
			0 6px 0 var(--edge-leaf),
			0 14px 24px -12px rgb(0 0 0 / 0.4);
		transition: transform 0.1s;
	}
	.arrow:active {
		transform: translateY(5px);
		box-shadow: 0 1px 0 var(--edge-leaf);
	}
	.arrow.prev {
		grid-area: prev;
	}
	.arrow.next {
		grid-area: next;
	}

	/* The next card slides in from the side the child swiped towards. */
	.enter-next {
		animation: in-right 0.38s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.enter-prev {
		animation: in-left 0.38s cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes in-right {
		from {
			transform: translate3d(40%, 0, 0) rotate(4deg);
			opacity: 0;
		}
	}
	@keyframes in-left {
		from {
			transform: translate3d(-40%, 0, 0) rotate(-4deg);
			opacity: 0;
		}
	}

	.kind {
		padding: 6px 16px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--cat) 30%, transparent);
		font-weight: 700;
		font-size: 1.05rem;
	}
	.orb-wrap {
		position: relative;
	}
	/* The picture floats on a glowing orb in its sound's colour. */
	.pic {
		display: grid;
		place-items: center;
		width: clamp(150px, 40vw, 200px);
		aspect-ratio: 1;
		margin: 14px 0 6px;
		border-radius: 50%;
		font-size: clamp(4.6rem, 16vw, 6.6rem);
		line-height: 1;
		background:
			radial-gradient(circle at 30% 25%, var(--glass-hi), transparent 45%),
			radial-gradient(circle, color-mix(in srgb, var(--cat) 45%, transparent), transparent 70%),
			var(--surface-2);
		border: 1px solid var(--glass-border);
		box-shadow:
			var(--shadow),
			0 0 60px -10px color-mix(in srgb, var(--cat) 70%, transparent);
		animation: float 6s ease-in-out infinite;
	}
	@keyframes float {
		50% {
			transform: translateY(-6px);
		}
	}
	.waves {
		position: absolute;
		top: 4px;
		right: -38px;
		width: 58px;
		height: 58px;
		fill: none;
		stroke: var(--ink-soft);
		stroke-width: 5;
		stroke-linecap: round;
		opacity: 0.55;
	}
	.waves.on {
		opacity: 1;
	}
	.waves.on path {
		animation: wave 1.1s ease-in-out infinite;
	}
	.waves.on path:nth-child(2) {
		animation-delay: 0.15s;
	}
	.waves.on path:nth-child(3) {
		animation-delay: 0.3s;
	}
	@keyframes wave {
		0%,
		100% {
			opacity: 0.25;
		}
		40% {
			opacity: 1;
		}
	}

	h1 {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0;
	}
	.letters {
		font-family: var(--font);
		font-size: clamp(3.4rem, 14vw, 5.2rem);
		line-height: 1;
	}
	.word {
		font-family: var(--font);
		font-size: 1.5rem;
		font-weight: 400;
		color: var(--ink-soft);
		margin-top: 6px;
	}
	.hint {
		margin: 6px 0 0;
		font-weight: 700;
		color: var(--ink-soft);
	}

	/* Blend parts: big tappable bubbles. */
	.parts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 10px;
		margin-top: 18px;
	}
	.parts :global(.bubble) {
		min-width: 96px;
		min-height: 72px;
		padding: 0 18px;
		border: 0;
		border-radius: 24px 24px 24px 8px;
		background: color-mix(in srgb, var(--cat) 38%, var(--surface-opaque));
		color: var(--ink);
		font-size: 1.7rem;
		font-weight: 700;
		box-shadow: 0 5px 0 color-mix(in srgb, var(--cat) 60%, #000 20%);
		transition: transform 0.1s;
	}
	.parts :global(.bubble:active) {
		transform: translateY(4px);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--cat) 60%, #000 20%);
	}
	.plus {
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--muted);
	}

	/* Hear · Slow · Mouth · Again */
	.trio {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: clamp(10px, 3vw, 22px);
		margin-top: 22px;
	}
	.trio :global(.circle) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--ink);
		font-weight: 700;
		font-size: 1.1rem;
	}
	.trio :global(.dot) {
		display: grid;
		place-items: center;
		width: 76px;
		height: 76px;
		border-radius: 50%;
		font-size: 2rem;
		background: var(--c);
		box-shadow:
			0 6px 0 var(--e),
			inset 0 2px 0 rgb(255 255 255 / 0.35);
		transition: transform 0.1s;
	}
	.trio :global(.circle:active .dot) {
		transform: translateY(5px);
		box-shadow: 0 1px 0 var(--e);
	}
	.trio :global(.hear .dot) {
		width: 96px;
		height: 96px;
		font-size: 2.6rem;
	}
	.trio :global(.hear) {
		--c: var(--cat-blend);
		--e: var(--edge-leaf);
	}
	.trio :global(.slow) {
		--c: var(--cat-consonant);
		--e: color-mix(in srgb, var(--cat-consonant) 60%, #000 30%);
	}
	.trio :global(.mouth) {
		--c: var(--cat-digraph);
		--e: color-mix(in srgb, var(--cat-digraph) 60%, #000 30%);
	}
	.trio :global(.again) {
		--c: var(--cat-vowel);
		--e: color-mix(in srgb, var(--cat-vowel) 60%, #000 30%);
	}
	.trio :global(.mouth[aria-expanded='true'] .dot) {
		outline: 4px solid var(--ink);
		outline-offset: 3px;
	}
	.trio :global(.playing .dot) {
		animation: ripple 1.1s ease-out infinite;
	}
	@keyframes ripple {
		0% {
			box-shadow:
				0 6px 0 var(--e),
				0 0 0 0 color-mix(in srgb, var(--c) 70%, transparent);
		}
		100% {
			box-shadow:
				0 6px 0 var(--e),
				0 0 0 20px transparent;
		}
	}

	.status {
		min-height: 1.6em;
		margin: 12px 0 0;
		font-weight: 700;
		color: var(--leaf);
	}
	.mouth-tip {
		max-width: 30ch;
		margin: 4px 0 6px;
		padding: 14px 20px;
		border-radius: 24px 24px 24px 8px;
		background: color-mix(in srgb, var(--cat-digraph) 28%, var(--surface-opaque));
		font-size: 1.3rem;
		font-weight: 700;
	}
	.tried {
		margin-top: 12px;
		min-width: 240px;
		font-size: 1.4rem;
	}
	.tried .star {
		font-size: 1.6rem;
		color: var(--sun);
	}

	.swipe-hint {
		display: none;
		margin: 12px 0 0;
		text-align: center;
		color: var(--muted);
	}
	@media (pointer: coarse) {
		.swipe-hint {
			display: block;
		}
	}

	.grownup {
		max-width: 720px;
		margin: 20px auto 0;
		padding-block: 8px;
	}
	summary {
		cursor: pointer;
		min-height: var(--tap);
		display: flex;
		align-items: center;
		font-weight: 700;
	}
	.gbody {
		padding-top: 8px;
	}
	.about {
		margin-bottom: 14px;
	}
	.rating {
		border: 0;
		padding: 0;
		margin: 0 0 16px;
	}
	.rating legend {
		font-weight: 700;
		margin-bottom: 8px;
	}
	.rbtns {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.words {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 12px;
	}
	.words h2 {
		font-family: var(--font);
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 0 0 4px;
	}
	.small {
		font-size: 0.95rem;
	}

	/* Phones: arrows sit under the card, either side of the star. */
	@media (max-width: 760px) {
		.stage {
			grid-template-columns: 1fr 1fr;
			grid-template-areas:
				'card card'
				'prev next';
			gap: 14px;
		}
		.arrow {
			width: 100%;
			height: 72px;
			border-radius: 24px;
		}
		.words {
			grid-template-columns: 1fr;
		}
	}
</style>
