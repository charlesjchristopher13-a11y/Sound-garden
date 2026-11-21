<script lang="ts">
	import Flower from '#lib/components/Flower.svelte';
	import { to } from '#lib/paths.ts';
	import { cardById, cards, setById, type SetId } from '#lib/catalog.ts';
	import { progress } from '#lib/progress.svelte.ts';

	const todays = $derived(progress.today.map((id) => cardById.get(id)!));
	const first = $derived(todays[0]);

	// Big colour blocks, one per place a child can go.
	const blocks: { id: SetId; label: string; cat: string }[] = [
		{ id: 'start', label: 'Start here', cat: 'cat-start' },
		{ id: 'consonants', label: 'Sounds', cat: 'cat-consonant' },
		{ id: 'vowels', label: 'Vowels', cat: 'cat-vowel' },
		{ id: 'two-sound', label: 'Blends', cat: 'cat-blend' }
	];
</script>

<svelte:head><title>Sound Garden · Listen, say, play</title></svelte:head>

<div class="wrap">
	<section class="hero panel" aria-labelledby="today-h">
		<div class="intro">
			<p class="hi">Hi, {progress.learner.name}! 👋</p>
			<h1 id="today-h" tabindex="-1">Today's practice</h1>
			<p class="muted">Listen, say it, try it!</p>
			{#if first}
				<a class="btn primary big go" href={to(`/sounds/today/${first.id}`)}>
					<span aria-hidden="true">▶</span> Start practice
				</a>
			{/if}
		</div>
		<ol class="today" aria-label="Today's cards">
			{#each todays as c, i (c.id)}
				<li>
					<a href={to(`/sounds/today/${c.id}`)} class="mini cat-{c.category}" data-status={progress.status(c.id)}>
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

	<nav class="blocks" aria-label="Places to go">
		{#each blocks as k (k.id)}
			{@const set = setById.get(k.id)!}
			<a class="block {k.cat}" href={to(`/sounds/${k.id}`)}>
				<span class="be" aria-hidden="true">{set.emoji}</span>
				<span class="bl">{k.label}</span>
			</a>
		{/each}
		<a class="block play" href={to(`/play`)}>
			<span class="be" aria-hidden="true">🎯</span>
			<span class="bl">Play</span>
		</a>
	</nav>

	<section class="grid2">
		<div class="panel">
			<h2>Today's flower</h2>
			<Flower cards={todays} done={(id) => progress.triedToday(id)} />
			<p class="muted small center">Each card tried today grows a petal.</p>
			<dl class="stats">
				<div><dt>Tried</dt><dd>{progress.practiced.size}</dd></div>
				<div><dt>Needs practice</dt><dd>{progress.counts.practice}</dd></div>
				<div><dt>Secure</dt><dd>{progress.counts.secure}</dd></div>
			</dl>
			<p class="muted small">{progress.practiced.size} of {cards.length} cards tried so far.</p>
			<a href={to(`/progress`)}>Progress, learners &amp; backup</a>
		</div>

		<div class="panel">
			<h2>For grown-ups</h2>
			<p>All {cards.length} cards, including digraphs, longer blends and extra challenges.</p>
			<a class="btn" href={to(`/sounds`)}>Every set of sounds</a>
			<p class="small"><a href={to(`/guide`)}>How to use Sound Garden</a></p>
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
			radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--sun-soft) 70%, transparent), transparent 55%),
			radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--leaf-soft) 70%, transparent), transparent 55%),
			var(--surface);
		padding-block: clamp(24px, 4vw, 44px);
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
		border-radius: var(--leaf-sm);
		background: linear-gradient(160deg, var(--glass-hi), transparent 50%), var(--surface);
		border: 1px solid var(--glass-border);
		box-shadow: var(--shadow);
		-webkit-backdrop-filter: var(--blur);
		backdrop-filter: var(--blur);
		color: var(--ink);
		text-decoration: none;
		transition: transform 0.25s var(--ease);
	}
	.mini:hover {
		transform: translateY(-4px);
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
		display: grid;
		place-items: center;
		width: 60px;
		height: 60px;
		margin-bottom: 4px;
		border-radius: 50% 50% 50% 14%;
		font-size: 2.2rem;
		line-height: 1;
		background: color-mix(in srgb, var(--cat) 32%, transparent);
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

	.go {
		min-height: 76px;
		padding-inline: 2em;
		font-size: 1.55rem;
		border-radius: 26px;
	}

	/* Big colour blocks, like a toy box. */
	.blocks {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 14px;
		margin-top: 18px;
	}
	.block {
		--c: var(--cat);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 150px;
		padding: 16px 8px;
		border-radius: 30px 30px 30px 10px;
		background:
			radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.35), transparent 50%),
			color-mix(in srgb, var(--c) 55%, var(--surface-opaque));
		box-shadow:
			0 7px 0 color-mix(in srgb, var(--c) 55%, #000 35%),
			0 18px 30px -18px rgb(0 0 0 / 0.45);
		color: var(--ink);
		text-decoration: none;
		transition: transform 0.12s;
	}
	.block:hover {
		transform: translateY(-3px);
	}
	.block:active {
		transform: translateY(6px);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--c) 55%, #000 35%);
	}
	.block .be {
		font-size: 3.2rem;
		line-height: 1;
		filter: drop-shadow(0 4px 6px rgb(0 0 0 / 0.18));
	}
	.block .bl {
		font-family: var(--font-display);
		font-variation-settings: 'SOFT' 100;
		font-size: 1.45rem;
		font-weight: 700;
	}
	.cat-start {
		--cat: #9fbb7c;
	}
	.block.play {
		--c: var(--sun);
		color: var(--on-sun);
		background:
			radial-gradient(circle at 30% 20%, rgb(255 255 255 / 0.25), transparent 50%),
			var(--sun-grad);
	}

	.grid2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: start;
		gap: 16px;
		margin-top: 22px;
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
	.center {
		text-align: center;
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
		.blocks {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.block.play {
			grid-column: 1 / -1;
			min-height: 110px;
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
