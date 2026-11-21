<script lang="ts">
	import { cardById, cards, setById, type SetId } from '#lib/catalog.ts';
	import { progress } from '#lib/progress.svelte.ts';

	const todays = $derived(progress.today.map((id) => cardById.get(id)!));
	const first = $derived(todays[0]);

	const explore: { id: SetId; note: string }[] = [
		{ id: 'start', note: 'Best first stop' },
		{ id: 'consonants', note: '19 sounds' },
		{ id: 'vowels', note: '20 sounds' },
		{ id: 'two-sound', note: '73 blends' }
	];
</script>

<svelte:head><title>Sound Garden · Listen, say, play</title></svelte:head>

<div class="wrap">
	<section class="hero panel" aria-labelledby="today-h">
		<div class="intro">
			<p class="hi">Hi, {progress.learner.name}! 👋</p>
			<h1 id="today-h" tabindex="-1">Today's practice</h1>
			<p class="muted">Five sounds to listen to, say out loud and try. Tap a picture to start.</p>
			{#if first}
				<a class="btn primary big" href="/sounds/today/{first.id}">▶ Start practice</a>
			{/if}
		</div>
		<ol class="today" aria-label="Today's cards">
			{#each todays as c, i (c.id)}
				<li>
					<a href="/sounds/today/{c.id}" class="mini" data-status={progress.status(c.id)}>
						<span class="num" aria-hidden="true">{i + 1}</span>
						<span class="pic" aria-hidden="true">{c.picture.emoji}</span>
						<span class="spell">{c.spelling}</span>
						<span class="word">{c.picture.word}</span>
						{#if progress.triedToday(c.id)}<span class="done"><span aria-hidden="true">★</span> tried today</span>{/if}
					</a>
				</li>
			{/each}
		</ol>
	</section>

	<section class="grid2">
		<div class="panel">
			<h2>Explore sounds</h2>
			<ul class="explore">
				{#each explore as e (e.id)}
					{@const s = setById.get(e.id)!}
					<li>
						<a href="/sounds/{s.id}">
							<span class="ei" aria-hidden="true">{s.emoji}</span>
							<span><strong>{s.label}</strong><span class="muted">{e.note}</span></span>
						</a>
					</li>
				{/each}
			</ul>
			<a class="btn ghost" href="/sounds">See every set, including extra challenges <span aria-hidden="true">→</span></a>
		</div>

		<div class="panel play">
			<h2>Sound Hunt</h2>
			<p>Hear a sound, then find the picture. Five quick rounds.</p>
			<a class="btn accent big" href="/play">🎯 Let's play</a>
		</div>

		<div class="panel">
			<h2>Growing so far</h2>
			<dl class="stats">
				<div><dt>Tried</dt><dd>{progress.practiced.size}</dd></div>
				<div><dt>Needs practice</dt><dd>{progress.counts.practice}</dd></div>
				<div><dt>Secure</dt><dd>{progress.counts.secure}</dd></div>
			</dl>
			<meter
				min="0"
				max={cards.length}
				value={progress.practiced.size}
				aria-label="Cards tried, out of {cards.length}"
			></meter>
			<p class="muted small">{progress.practiced.size} of {cards.length} cards tried.</p>
			<a href="/progress">Progress, learners &amp; backup</a>
		</div>
	</section>
</div>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
		gap: clamp(16px, 4vw, 40px);
		align-items: center;
		background:
			radial-gradient(circle at 0% 0%, var(--sun-soft), transparent 55%),
			radial-gradient(circle at 100% 100%, var(--leaf-soft), transparent 55%),
			var(--surface);
	}
	.hi {
		font-weight: 700;
		color: var(--ink-soft);
		margin: 0;
	}
	.intro .btn {
		margin-top: 8px;
	}
	.today {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
	}
	.mini {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 14px 6px 12px;
		min-height: 150px;
		border-radius: var(--radius);
		background: var(--surface);
		border: 1.5px solid var(--line);
		color: var(--ink);
		text-decoration: none;
		transition: transform 0.15s var(--ease);
	}
	.mini:hover {
		transform: translateY(-3px);
	}
	.num {
		position: absolute;
		top: 8px;
		left: 10px;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--muted);
	}
	.mini .pic {
		font-size: 2.6rem;
		line-height: 1.15;
	}
	.mini .spell {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.mini .word {
		color: var(--ink-soft);
		font-size: 1rem;
	}
	.done {
		margin-top: 4px;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--leaf);
	}

	.grid2 {
		display: grid;
		grid-template-columns: 1.3fr 1fr 1fr;
		align-items: start;
		gap: 16px;
		margin-top: 16px;
	}
	.explore {
		list-style: none;
		padding: 0;
		margin: 0 0 12px;
		display: grid;
		gap: 8px;
	}
	.explore a {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 60px;
		padding: 8px 14px;
		border-radius: 16px;
		background: var(--surface-2);
		color: var(--ink);
		text-decoration: none;
	}
	.explore strong {
		display: block;
	}
	.explore .muted {
		font-size: 0.95rem;
	}
	.ei {
		font-size: 1.7rem;
	}
	.play {
		background: linear-gradient(160deg, var(--sun-soft), var(--surface) 70%);
	}
	.stats {
		display: flex;
		gap: 18px;
		margin: 0 0 12px;
	}
	.stats dt {
		font-size: 0.95rem;
		color: var(--muted);
	}
	.stats dd {
		margin: 0;
		font-size: 1.8rem;
		font-weight: 700;
	}
	meter {
		width: 100%;
		height: 14px;
	}
	.small {
		font-size: 0.95rem;
		margin-top: 6px;
	}

	@media (max-width: 960px) {
		.hero {
			grid-template-columns: 1fr;
		}
		.grid2 {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 560px) {
		.today {
			grid-template-columns: repeat(5, minmax(120px, 1fr));
			overflow-x: auto;
			scroll-snap-type: x mandatory;
			padding-bottom: 6px;
			margin-inline: -4px;
		}
		.today li {
			scroll-snap-align: start;
		}
	}
</style>
