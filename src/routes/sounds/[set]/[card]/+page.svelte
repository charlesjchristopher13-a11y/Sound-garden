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

	const tried = $derived(progress.triedToday(card.id));
	const rating = $derived(progress.learner.cards[card.id]?.rating ?? null);
	function rate(r: Rating) {
		progress.rate(card.id, rating === r ? null : r);
	}

	function onkey(e: KeyboardEvent) {
		if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
		const t = e.target as HTMLElement;
		if (t.closest('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'ArrowRight' && next) goto(hrefFor(next.id));
		else if (e.key === 'ArrowLeft' && prev) goto(hrefFor(prev.id));
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
		<a class="btn ghost" href={backHref}><span aria-hidden="true">←</span> {set.label}</a>
		<span class="where muted">
			{#if pos >= 0}{pos + 1} of {list.length}{/if}
			{#if family}· {familyLabel(family)}{/if}
		</span>
	</div>

	<article class="card panel" aria-labelledby="card-h">
		<div class="feature">
			<span class="pill" class:challenge={card.blend?.advanced}>
				{describeCard(card)}{card.blend?.advanced ? ' · Extra challenge' : ''}
			</span>
			<span class="pic" role="img" aria-label={card.picture.word}>{card.picture.emoji}</span>
			<h1 id="card-h" tabindex="-1">
				<span class="letters">{bigLabel(card)}</span>
				<span class="sr-only">, as in</span>
				<span class="word">{card.picture.word}</span>
			</h1>
			{#if card.blend?.position === 'end'}
				<p class="muted hint">Listen for it at the end of the word.</p>
			{/if}

			{#if card.blend}
				<div class="parts" role="group" aria-label="Sounds in this blend">
					{#each card.phonemes as p, i (i)}
						<SoundButton
							class="btn part"
							label="Hear /{p}/"
							onplay={() => player.play(partAudio(p), `/${p}/`)}
						>
							/{p}/ <span aria-hidden="true">🔊</span>
						</SoundButton>
						{#if i < card.phonemes.length - 1}<span class="plus" aria-hidden="true">+</span>{/if}
					{/each}
				</div>
			{/if}

			<div class="actions">
				<SoundButton class="btn primary big listen" onplay={listen} playing={player.status.playing}>
					<span aria-hidden="true">🔊</span>
					{card.blend ? 'Hear blend' : 'Listen'}
				</SoundButton>
				{#if card.audio.slow}
					<SoundButton class="btn" onplay={slow}><span aria-hidden="true">🐢</span> One at a time</SoundButton>
				{/if}
				<SoundButton class="btn" onplay={three}><span aria-hidden="true">🔁</span> 3 times</SoundButton>
			</div>
			<p class="status" aria-hidden="true">{player.status.message || ' '}</p>
		</div>

		<div class="turn">
			<h2><span aria-hidden="true">🗣️</span> Your turn!</h2>
			<p>{kidPrompt}</p>
			<button
				type="button"
				class="btn big tried"
				aria-pressed={tried}
				onclick={() => progress.markTried(card.id)}
			>
				<span aria-hidden="true">{tried ? '★' : '☆'}</span>
				{tried ? 'Tried today!' : 'I tried it!'}
			</button>
		</div>

		<nav class="pager" aria-label="Cards">
			{#if prev}<a class="btn" href={hrefFor(prev.id)} rel="prev"><span aria-hidden="true">←</span> Back<span class="sr-only">: {prev.picture.word}</span></a>{/if}
			<a class="btn ghost" href={backHref}>Pick a picture</a>
			{#if next}<a class="btn primary" href={hrefFor(next.id)} rel="next">Next<span class="sr-only">: {next.picture.word}</span> <span aria-hidden="true">→</span></a>{/if}
		</nav>

		<details class="grownup">
			<summary>For grown-ups: how is it going, word examples &amp; tips</summary>
			<div class="gbody">
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
							<h3>{h}</h3>
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
	</article>
</div>

<style>
	.topline {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}
	.card {
		max-width: 780px;
		margin-inline: auto;
		padding-top: 24px;
	}
	.feature {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	/* The picture floats on a glowing glass orb. */
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
			radial-gradient(circle, color-mix(in srgb, var(--honey) 35%, transparent), transparent 70%),
			var(--surface-2);
		border: 1px solid var(--glass-border);
		box-shadow:
			var(--shadow),
			0 0 60px -10px color-mix(in srgb, var(--honey) 60%, transparent);
		animation: float 6s ease-in-out infinite;
	}
	@keyframes float {
		50% {
			transform: translateY(-6px);
		}
	}
	h1 {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0;
	}
	.letters {
		font-size: clamp(3rem, 12vw, 4.6rem);
		line-height: 1;
	}
	.word {
		font-size: 1.4rem;
		font-weight: 400;
		color: var(--ink-soft);
		margin-top: 6px;
	}
	.hint {
		margin: 4px 0 0;
	}
	.parts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 8px;
		margin-top: 18px;
	}
	.parts :global(.part) {
		min-height: var(--tap-kid);
		min-width: 92px;
		font-size: 1.35rem;
		background: color-mix(in srgb, var(--sun-soft) 80%, transparent);
		border-radius: 18px;
	}
	.plus {
		font-size: 1.6rem;
		font-weight: 700;
		color: var(--muted);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 20px;
	}
	.actions :global(.listen) {
		min-width: 220px;
	}
	.status {
		min-height: 1.6em;
		margin: 12px 0 0;
		font-weight: 700;
		color: var(--leaf);
	}
	.turn {
		margin-top: 20px;
		padding: 18px;
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--leaf-soft) 80%, transparent);
		border: 1px solid var(--glass-border);
		text-align: center;
	}
	.turn h2 {
		margin-bottom: 4px;
	}
	.tried {
		margin-top: 4px;
		background: var(--surface);
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-top: 20px;
		flex-wrap: wrap;
	}
	.pager .btn {
		flex: 1 1 0;
		min-width: 120px;
	}
	.grownup {
		margin-top: 20px;
		border-top: 1px solid var(--line);
		padding-top: 12px;
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
	.words h3 {
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 0 0 4px;
	}
	.small {
		font-size: 0.95rem;
	}
	@media (max-width: 520px) {
		.words {
			grid-template-columns: 1fr;
		}
		.actions :global(.listen) {
			width: 100%;
		}
	}
</style>
